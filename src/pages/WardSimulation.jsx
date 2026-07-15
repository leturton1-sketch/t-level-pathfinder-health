import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { isLoggedIn, getCurrentUser } from "@/lib/clinicalAuth";
import { PREBUILT_SCENARIOS } from "@/lib/specData";
import { SKBadgeGroup } from "@/components/SKBadge";
import NEWS2Badge from "@/components/NEWS2Badge";
import Ward3D from "@/components/Ward3D";
import WardEditPanel from "@/components/WardEditPanel";
import WardPropertiesPanel from "@/components/WardPropertiesPanel";
import PatientPanel from "@/components/PatientPanel";
import { WARD_ITEM_TYPES, generateDefaultItems, DEFAULT_PATIENTS, getItemLabel } from "@/lib/wardItems";
import {
  Stethoscope, Clock, ChevronRight, User, Heart, AlertCircle, CheckCircle, X,
  Pencil, LayoutGrid, MessageSquare, Settings, Bell, Camera, AlertTriangle,
} from "lucide-react";

const DIFFICULTY_LABELS = { guided: "Guided", intermediate: "Intermediate", independent: "Independent" };

export default function WardSimulation() {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const canEdit = ["super_admin", "admin", "tutor"].includes(user?.role);

  // Ward state
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [selectedItemForPlacement, setSelectedItemForPlacement] = useState(null);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [suite, setSuite] = useState("both");
  const [cameraCommand, setCameraCommand] = useState({ type: "reset", nonce: 0 });
  const [saveStatus, setSaveStatus] = useState("");

  // Undo/redo
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const skipHistoryRef = useRef(false);

  // Patient/scenario state
  const [selectedBed, setSelectedBed] = useState(null);
  const [showPatientPanel, setShowPatientPanel] = useState(false);
  const [scenarios, setScenarios] = useState([]);
  const [activeScenario, setActiveScenario] = useState(null);
  const [showScenarioList, setShowScenarioList] = useState(false);
  const [vitals, setVitals] = useState(null);
  const [decisions, setDecisions] = useState([]);
  const [showDebrief, setShowDebrief] = useState(false);

  // Call bells
  const [callBells, setCallBells] = useState({});
  const [showCallBellPanel, setShowCallBellPanel] = useState(false);

  // Confirmation dialog
  const [confirmAction, setConfirmAction] = useState(null);

  const saveTimerRef = useRef(null);
  const isFirstLoadRef = useRef(true);

  // Auth check + load
  useEffect(() => {
    if (!isLoggedIn()) { navigate("/login"); return; }
    loadScenarios();
    loadLayout();
  }, [navigate]);

  const loadScenarios = async () => {
    try {
      const existing = await base44.entities.Scenario.list();
      setScenarios(existing.length > 0 ? existing : PREBUILT_SCENARIOS);
    } catch { setScenarios(PREBUILT_SCENARIOS); }
  };

  const loadLayout = async () => {
    setLoading(true);
    try {
      const existing = await base44.entities.WardLayout.filter({ suite: "ward" });
      if (existing.length > 0 && existing[0].items) {
        const loaded = JSON.parse(existing[0].items || "[]");
        setItems(loaded.length > 0 ? loaded : generateDefaultItems());
      } else {
        const local = localStorage.getItem("wardLayout_ward");
        setItems(local ? JSON.parse(local) : generateDefaultItems());
      }
    } catch {
      const local = localStorage.getItem("wardLayout_ward");
      setItems(local ? JSON.parse(local) : generateDefaultItems());
    } finally { setLoading(false); }
  };

  // Auto-save with debounce
  const debouncedSave = useCallback((itemsToSave) => {
    setSaveStatus("Saving…");
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      try {
        const itemsJson = JSON.stringify(itemsToSave);
        const existing = await base44.entities.WardLayout.filter({ suite: "ward" });
        if (existing.length > 0) {
          await base44.entities.WardLayout.update(existing[0].id, { items: itemsJson });
        } else {
          await base44.entities.WardLayout.create({ suite: "ward", items: itemsJson, layout_name: "Default" });
        }
        setSaveStatus("Layout saved");
        setTimeout(() => setSaveStatus(""), 2500);
      } catch {
        localStorage.setItem("wardLayout_ward", JSON.stringify(itemsToSave));
        setSaveStatus("Unable to save – changes retained on this device");
      }
    }, 800);
  }, []);

  // Trigger auto-save on items change (skip first load and undo/redo)
  useEffect(() => {
    if (isFirstLoadRef.current) { isFirstLoadRef.current = false; return; }
    if (editMode && items.length > 0) debouncedSave(items);
  }, [items, editMode, debouncedSave]);

  // Save before leaving
  useEffect(() => {
    const handler = () => {
      if (editMode) localStorage.setItem("wardLayout_ward", JSON.stringify(items));
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [editMode, items]);

  // Ward state dispatch for AI assistant
  useEffect(() => {
    window.dispatchEvent(new CustomEvent("ward-state-update", {
      detail: {
        editMode, suite,
        placedItems: items.map(i => ({ type: i.type, designation: i.designation, x: i.x, z: i.z })),
        callBells,
        availableItemTypes: WARD_ITEM_TYPES.map(t => t.type),
      },
    }));
  }, [editMode, suite, items, callBells]);

  // AI command listener
  useEffect(() => {
    const handler = (e) => {
      const { action, itemType, designation } = e.detail;
      switch (action) {
        case "place": if (editMode && itemType) handleItemPlace(itemType, 0, 0); break;
        case "reset_callbell":
          if (designation && callBells[designation]) toggleCallBell(designation);
          else Object.keys(callBells).filter(d => callBells[d]).forEach(d => toggleCallBell(d));
          break;
        case "activate_callbell":
          if (designation && !callBells[designation]) toggleCallBell(designation);
          break;
      }
    };
    window.addEventListener("ward-ai-command", handler);
    return () => window.removeEventListener("ward-ai-command", handler);
  }, [editMode, callBells, items]);

  // --- History management ---
  const modifyItems = (newItems) => {
    setItems(newItems);
    if (!skipHistoryRef.current) {
      const newHist = history.slice(0, historyIndex + 1);
      newHist.push(JSON.parse(JSON.stringify(newItems)));
      if (newHist.length > 50) newHist.shift();
      setHistory(newHist);
      setHistoryIndex(newHist.length - 1);
    }
    skipHistoryRef.current = false;
  };

  const undo = () => {
    if (historyIndex > 0) {
      skipHistoryRef.current = true;
      setHistoryIndex(historyIndex - 1);
      setItems(JSON.parse(JSON.stringify(history[historyIndex - 1])));
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      skipHistoryRef.current = true;
      setHistoryIndex(historyIndex + 1);
      setItems(JSON.parse(JSON.stringify(history[historyIndex + 1])));
    }
  };

  // --- Item handlers ---
  const handleItemPlace = (type, x, z) => {
    const designation = type === "bed" ? `${suite === "B" ? "B" : "A"}${items.filter(i => i.type === "bed").length + 1}` : null;
    const newItem = { id: `item_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, type, x, z, rotationY: 0, designation };
    modifyItems([...items, newItem]);
    setSelectedItemId(newItem.id);
    setSelectedItemForPlacement(null);
  };

  const handleItemMove = (itemId, x, z) => {
    modifyItems(items.map(i => i.id === itemId ? { ...i, x, z } : i));
  };

  const handleItemSelect = (itemId) => {
    setSelectedItemId(itemId);
    setSelectedItemForPlacement(null);
  };

  const handleRotate = (direction, angle) => {
    if (!selectedItemId) return;
    modifyItems(items.map(i => i.id === selectedItemId ? { ...i, rotationY: (i.rotationY || 0) + (direction === "left" ? -angle : angle) } : i));
  };

  const handleDuplicate = () => {
    const item = items.find(i => i.id === selectedItemId);
    if (!item) return;
    const newItem = { ...item, id: `item_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, x: item.x + 2, z: item.z + 2, designation: item.type === "bed" ? `${suite === "B" ? "B" : "A"}${items.filter(i => i.type === "bed").length + 1}` : null };
    modifyItems([...items, newItem]);
    setSelectedItemId(newItem.id);
  };

  const handleDeleteRequest = () => { setConfirmAction({ type: "delete" }); };

  const handleResetLayoutRequest = () => { setConfirmAction({ type: "reset" }); };

  const confirmAction_yes = () => {
    if (confirmAction?.type === "delete" && selectedItemId) {
      modifyItems(items.filter(i => i.id !== selectedItemId));
      setSelectedItemId(null);
    } else if (confirmAction?.type === "reset") {
      modifyItems(generateDefaultItems());
      setSelectedItemId(null);
    }
    setConfirmAction(null);
  };

  // --- Edit mode toggle ---
  const handleEditToggle = async () => {
    if (editMode) {
      // Save and exit
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      await saveNow(items);
      setEditMode(false);
      setSelectedItemId(null);
      setSelectedItemForPlacement(null);
    } else {
      setActiveScenario(null);
      setShowPatientPanel(false);
      setEditMode(true);
    }
  };

  const saveNow = async (itemsToSave) => {
    setSaveStatus("Saving…");
    try {
      const itemsJson = JSON.stringify(itemsToSave);
      const existing = await base44.entities.WardLayout.filter({ suite: "ward" });
      if (existing.length > 0) await base44.entities.WardLayout.update(existing[0].id, { items: itemsJson });
      else await base44.entities.WardLayout.create({ suite: "ward", items: itemsJson, layout_name: "Default" });
      setSaveStatus("Layout saved");
      setTimeout(() => setSaveStatus(""), 2500);
    } catch {
      localStorage.setItem("wardLayout_ward", JSON.stringify(itemsToSave));
      setSaveStatus("Unable to save – changes retained on this device");
    }
  };

  // --- Navigation with save ---
  const navigateAway = async (path) => {
    if (editMode) await saveNow(items);
    navigate(path);
  };

  // --- Camera ---
  const resetCamera = () => setCameraCommand({ type: "reset", nonce: Date.now() });

  const focusSuite = (s) => {
    setSuite(s);
    if (s === "A") setCameraCommand({ type: "suite", target: { x: -10, z: 12 }, nonce: Date.now() });
    else if (s === "B") setCameraCommand({ type: "suite", target: { x: 10, z: 12 }, nonce: Date.now() });
    else setCameraCommand({ type: "reset", nonce: Date.now() });
  };

  // --- Bed click ---
  const handleBedClick = (itemId) => {
    if (editMode) return;
    const item = items.find(i => i.id === itemId);
    if (!item) return;
    setSelectedBed(item.designation);
    setShowPatientPanel(true);
    setCameraCommand({ type: "focus", target: { x: item.x, z: item.z }, nonce: Date.now() });
  };

  // --- Call bell ---
  const toggleCallBell = (designation) => {
    const newActive = !callBells[designation];
    setCallBells(prev => ({ ...prev, [designation]: newActive }));
    window.dispatchEvent(new CustomEvent("callbell-status", { detail: { bedDesignation: designation, active: newActive } }));
  };

  const wardBeds = Object.keys(DEFAULT_PATIENTS);

  // --- Scenario ---
  const startScenario = (scenario) => {
    setActiveScenario(scenario);
    setVitals({ ...scenario.initial_vitals });
    setDecisions([]);
    setShowPatientPanel(false);
    setShowScenarioList(false);
  };

  const getScenarioForBed = (bed) => scenarios.find(s => s.bed_number?.includes(bed) || bed?.includes(s.bed_number));

  const handleBeginTask = () => {
    if (!selectedBed) return;
    const scenario = getScenarioForBed(selectedBed) || scenarios[0];
    if (scenario) startScenario(scenario);
  };

  const decisionSteps = activeScenario ? [
    { prompt: `${activeScenario.patient_name} is in ${activeScenario.bed_number}. What is your first action?`,
      options: [
        { label: "Perform full ABCDE assessment", correct: true, feedback: "Correct — systematic assessment is always the first priority." },
        { label: "Administer prescribed medication", correct: false, feedback: "Assess before intervening — always follow the ABCDE approach." },
        { label: "Call the doctor immediately", correct: false, feedback: "Assess the patient first — you need information to escalate effectively." },
      ] },
    { prompt: `NEWS2 score is ${activeScenario.initial_news2}. What should you do?`,
      options: [
        { label: activeScenario.initial_news2 >= 5 ? "Escalate using SBAR" : "Continue routine monitoring", correct: true, feedback: "Correct — appropriate escalation based on NEWS2 score." },
        { label: "Document only and continue", correct: false, feedback: "Escalation is required — documenting alone is insufficient." },
        { label: "Reassess in 1 hour", correct: false, feedback: "Do not delay — escalate now." },
      ] },
    { prompt: "The patient needs ongoing care. Which intervention is appropriate?",
      options: [
        { label: "Implement person-centred care plan", correct: true, feedback: "Correct — care should always be person-centred and evidence-based." },
        { label: "Apply standard care without assessment", correct: false, feedback: "All care must be individualised." },
        { label: "Wait for doctor's orders before any action", correct: false, feedback: "Nursing care continues independently." },
      ] },
  ] : [];
  const currentStep = decisions.length;
  const handleDecision = (option, stepIdx) => {
    setDecisions([...decisions, { step: stepIdx, choice: option.label, correct: option.correct, feedback: option.feedback }]);
    if (option.correct && vitals) setVitals({ ...vitals, rr: Math.max(12, vitals.rr - 2), spo2: Math.min(98, vitals.spo2 + 3) });
    if (stepIdx + 1 >= decisionSteps.length) setTimeout(() => setShowDebrief(true), 1500);
  };
  const score = decisions.filter(d => d.correct).length;
  const exitScenario = () => { setActiveScenario(null); setDecisions([]); setVitals(null); setShowPatientPanel(false); };

  const selectedItem = items.find(i => i.id === selectedItemId);

  // --- Debrief screen ---
  if (showDebrief && activeScenario) {
    const pct = Math.round((score / decisionSteps.length) * 100);
    return (
      <div className="min-h-screen bg-slate-100 px-4 pt-6 pb-24 max-w-2xl mx-auto">
        <div className="text-center mb-6">
          <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-3 ${pct >= 70 ? "bg-clinical-green/20" : "bg-clinical-amber/20"}`}>
            {pct >= 70 ? <CheckCircle className="w-8 h-8 text-clinical-green" /> : <AlertCircle className="w-8 h-8 text-clinical-amber" />}
          </div>
          <h1 className="text-xl font-heading font-bold text-slate-800">Scenario Complete</h1>
          <p className="text-sm text-slate-500">{activeScenario.name}</p>
          <div className="text-3xl font-heading font-bold text-clinical-teal mt-2">{pct}%</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 mb-4 shadow-sm">
          <h2 className="text-sm font-heading font-bold text-slate-800 mb-2">Clinical Debrief</h2>
          <p className="text-sm text-slate-600">{activeScenario.debrief_rationale}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 mb-4 shadow-sm">
          <h2 className="text-sm font-heading font-bold text-slate-800 mb-3">Decision Pathway</h2>
          <div className="space-y-2">
            {decisions.map((d, i) => (
              <div key={i} className={`rounded-lg p-3 text-xs ${d.correct ? "bg-clinical-green/5 border border-clinical-green/20" : "bg-clinical-red/5 border border-clinical-red/20"}`}>
                <div className="flex items-center gap-2 mb-1">
                  {d.correct ? <CheckCircle className="w-3.5 h-3.5 text-clinical-green" /> : <X className="w-3.5 h-3.5 text-clinical-red" />}
                  <span className="font-semibold text-slate-800">Step {i + 1}: {d.choice}</span>
                </div>
                <p className="text-slate-500">{d.feedback}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="mb-4"><SKBadgeGroup skCodes={activeScenario.sk_codes} poCodes={activeScenario.performance_outcomes} /></div>
        <button onClick={() => { setShowDebrief(false); exitScenario(); }}
          className="w-full py-3 rounded-lg bg-clinical-teal text-white font-heading font-semibold text-sm hover:opacity-90">Back to Ward</button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-100">
        <div className="w-8 h-8 border-2 border-clinical-teal/30 border-t-clinical-teal rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-100 flex flex-col">
      {/* Top navigation bar */}
      <div className="z-20 bg-white border-b border-slate-200 shadow-sm">
        <div className="flex items-center justify-between px-3 py-2.5 sm:px-4 gap-2">
          {/* Logo */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center">
              <Stethoscope className="w-5 h-5 text-white" />
            </div>
            <div className="hidden sm:block">
              <span className="font-display text-sm text-slate-800 block leading-none">NursiCore</span>
              <span className="text-[8px] text-slate-400 uppercase tracking-wider">T-Level Academy</span>
            </div>
          </div>

          {/* Suite selector */}
          <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
            {["A", "B", "both"].map(s => (
              <button key={s} onClick={() => focusSuite(s)}
                className={`px-3 py-1.5 text-xs font-heading font-semibold rounded-md transition-all ${suite === s ? "bg-slate-800 text-white shadow-sm" : "text-slate-600 hover:bg-slate-200"}`}>
                {s === "both" ? "Full Ward" : `Bay ${s}`}
              </button>
            ))}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button onClick={resetCamera} className="flex items-center gap-1.5 rounded-lg bg-white border border-slate-300 px-2.5 py-1.5 text-xs font-heading font-medium text-slate-600 hover:bg-slate-50 transition-colors" aria-label="Reset camera">
              <Camera className="w-3.5 h-3.5" /><span className="hidden lg:inline">Reset View</span>
            </button>
            {canEdit && (
              <button onClick={handleEditToggle}
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-heading font-medium transition-colors border ${editMode ? "bg-clinical-teal text-white border-clinical-teal" : "bg-white border-slate-300 text-slate-600 hover:bg-slate-50"}`}>
                <Pencil className="w-3.5 h-3.5" /><span className="hidden lg:inline">{editMode ? "Save & Exit" : "Edit Ward"}</span>
              </button>
            )}
            {!editMode && (
              <>
                <button onClick={() => navigateAway("/")} className="flex items-center gap-1.5 rounded-lg bg-white border border-slate-300 px-2.5 py-1.5 text-xs font-heading font-medium text-slate-600 hover:bg-slate-50">
                  <LayoutGrid className="w-3.5 h-3.5" /><span className="hidden lg:inline">Dashboard</span>
                </button>
                <button onClick={() => navigateAway("/profile")} className="flex items-center gap-1.5 rounded-lg bg-white border border-slate-300 px-2.5 py-1.5 text-xs font-heading font-medium text-slate-600 hover:bg-slate-50">
                  <MessageSquare className="w-3.5 h-3.5" /><span className="hidden lg:inline">AI Tutor</span>
                </button>
                <button onClick={() => setShowScenarioList(true)}
                  className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-heading font-medium border ${showScenarioList ? "bg-clinical-teal text-white border-clinical-teal" : "bg-white border-slate-300 text-slate-600 hover:bg-slate-50"}`}>
                  <Settings className="w-3.5 h-3.5" /><span className="hidden lg:inline">Scenarios</span>
                </button>
                <button onClick={() => setShowCallBellPanel(true)}
                  className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-heading font-medium border ${showCallBellPanel ? "bg-clinical-amber text-white border-clinical-amber" : "bg-white border-slate-300 text-slate-600 hover:bg-slate-50"}`}>
                  <Bell className="w-3.5 h-3.5" />
                  {Object.values(callBells).some(Boolean) && <span className="w-1.5 h-1.5 rounded-full bg-clinical-red animate-pulse" />}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Scenario indicator */}
        {activeScenario && !editMode && (
          <div className="flex items-center justify-between px-4 py-2 bg-slate-50 border-t border-slate-200">
            <div className="flex items-center gap-3">
              <button onClick={exitScenario} className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-800"><X className="w-3.5 h-3.5" /> Exit Scenario</button>
              <div className="text-xs"><span className="text-slate-400">Active: </span><span className="font-semibold text-slate-800">{activeScenario.name}</span></div>
            </div>
            <NEWS2Badge score={activeScenario.initial_news2} size="sm" />
          </div>
        )}

        {/* Save status */}
        {saveStatus && (
          <div className="flex items-center justify-center gap-1.5 py-1 bg-slate-50 border-t border-slate-200">
            <span className={`text-[10px] font-medium ${saveStatus.includes("Unable") ? "text-clinical-red" : saveStatus.includes("Saving") ? "text-slate-500" : "text-clinical-green"}`}>
              {saveStatus.includes("Saving") ? "● " : saveStatus.includes("Unable") ? "⚠ " : "✓ "}{saveStatus}
            </span>
          </div>
        )}
      </div>

      {/* 3D Ward */}
      <div className="flex-1 relative">
        <Ward3D
          items={items}
          editMode={editMode}
          selectedItemId={selectedItemId}
          snapToGrid={snapToGrid}
          selectedItemForPlacement={selectedItemForPlacement}
          suite={suite}
          cameraCommand={cameraCommand}
          onItemSelect={handleItemSelect}
          onItemMove={handleItemMove}
          onItemPlace={handleItemPlace}
          onBedClick={handleBedClick}
        />

        {/* Edit panel (left) */}
        {editMode && (
          <WardEditPanel
            selectedItemForPlacement={selectedItemForPlacement}
            onSelectItemType={(type) => { setSelectedItemForPlacement(type); setSelectedItemId(null); }}
            itemCount={items.length}
            snapToGrid={snapToGrid}
            onSnapToggle={() => setSnapToGrid(!snapToGrid)}
            onUndo={undo} onRedo={redo}
            canUndo={historyIndex > 0} canRedo={historyIndex < history.length - 1}
            onResetLayout={handleResetLayoutRequest}
            onExitEdit={handleEditToggle}
          />
        )}

        {/* Properties panel (right) */}
        {editMode && selectedItem && (
          <WardPropertiesPanel
            item={selectedItem}
            onRotate15={(dir) => handleRotate(dir, Math.PI / 12)}
            onRotate90={(dir) => handleRotate(dir, Math.PI / 2)}
            onDuplicate={handleDuplicate}
            onDelete={handleDeleteRequest}
            onClose={() => setSelectedItemId(null)}
          />
        )}

        {/* Patient panel */}
        {showPatientPanel && selectedBed && !editMode && (
          <PatientPanel
            bedDesignation={selectedBed}
            onClose={() => { setShowPatientPanel(false); setSelectedBed(null); }}
            onViewPatient={() => {}}
            onRecordObservations={() => navigateAway("/care-planning/news2")}
            onBeginTask={handleBeginTask}
            hasScenario={!!getScenarioForBed(selectedBed) || scenarios.length > 0}
          />
        )}

        {/* Hint */}
        {!activeScenario && !editMode && !showPatientPanel && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 rounded-lg bg-white/80 backdrop-blur-sm px-4 py-2 text-xs text-slate-600 border border-slate-200 shadow-sm">
            Click a bed to view patient details →
          </div>
        )}
      </div>

      {/* Confirmation dialog */}
      {confirmAction && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/30 backdrop-blur-sm animate-fade-in" onClick={() => setConfirmAction(null)}>
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-[90%]" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-3">
              <AlertTriangle className="w-6 h-6 text-clinical-amber" />
              <h2 className="font-heading font-bold text-slate-800">{confirmAction.type === "delete" ? "Delete Item?" : "Reset Layout?"}</h2>
            </div>
            <p className="text-sm text-slate-600 mb-4">
              {confirmAction.type === "delete"
                ? "Are you sure you want to delete this item? This action cannot be undone (except via Undo)."
                : "Are you sure you want to reset the layout to defaults? All current placements will be lost."}
            </p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmAction(null)} className="flex-1 py-2.5 rounded-lg border border-slate-300 text-slate-700 text-sm font-heading font-semibold hover:bg-slate-50">Cancel</button>
              <button onClick={confirmAction_yes} className="flex-1 py-2.5 rounded-lg bg-clinical-red text-white text-sm font-heading font-semibold hover:opacity-90">Confirm</button>
            </div>
          </div>
        </div>
      )}

      {/* Scenario list */}
      {showScenarioList && !editMode && (
        <div className="absolute inset-0 z-30 flex justify-end animate-fade-in" onClick={() => setShowScenarioList(false)}>
          <div className="absolute inset-0 bg-black/20" />
          <div className="relative w-full sm:max-w-md bg-white h-full overflow-y-auto scrollbar-thin shadow-2xl animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
              <h2 className="font-heading font-bold text-sm text-slate-800">Scenarios</h2>
              <button onClick={() => setShowScenarioList(false)} className="p-1.5 rounded-lg hover:bg-slate-100"><X className="w-4 h-4 text-slate-400" /></button>
            </div>
            <div className="p-3 space-y-3">
              {scenarios.map((scenario, idx) => (
                <button key={idx} onClick={() => startScenario(scenario)}
                  className="group w-full text-left rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-clinical-teal/40 transition-all p-4">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] font-semibold uppercase rounded px-1.5 py-0.5 ${scenario.difficulty === "guided" ? "bg-clinical-green/15 text-clinical-green" : scenario.difficulty === "intermediate" ? "bg-clinical-amber/15 text-clinical-amber" : "bg-clinical-red/15 text-clinical-red"}`}>{DIFFICULTY_LABELS[scenario.difficulty]}</span>
                        <span className="flex items-center gap-1 text-[10px] text-slate-400"><Clock className="w-3 h-3" /> {scenario.estimated_duration} min</span>
                      </div>
                      <h3 className="font-heading font-bold text-sm text-slate-800">{scenario.name}</h3>
                      <p className="text-xs text-slate-500 mt-1">{scenario.description}</p>
                    </div>
                    <NEWS2Badge score={scenario.initial_news2} size="sm" />
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500 mb-2">
                    <span className="flex items-center gap-1"><User className="w-3 h-3" /> {scenario.patient_name}</span>
                    <span className="flex items-center gap-1"><Heart className="w-3 h-3" /> {scenario.bed_number}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <SKBadgeGroup skCodes={scenario.sk_codes} poCodes={scenario.performance_outcomes} />
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-clinical-teal" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Call bell panel */}
      {showCallBellPanel && !editMode && (
        <div className="absolute inset-0 z-30 flex justify-end animate-fade-in" onClick={() => setShowCallBellPanel(false)}>
          <div className="absolute inset-0 bg-black/20" />
          <div className="relative w-full sm:max-w-sm bg-white h-full overflow-y-auto scrollbar-thin shadow-2xl animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
              <h2 className="font-heading font-bold text-sm text-slate-800">Call Bells</h2>
              <button onClick={() => setShowCallBellPanel(false)} className="p-1.5 rounded-lg hover:bg-slate-100"><X className="w-4 h-4 text-slate-400" /></button>
            </div>
            <div className="p-3 space-y-2">
              <p className="text-xs text-slate-500 mb-2">Tap a bed to activate or reset its call bell. The AI assistant will verbally announce active call bells periodically until reset.</p>
              {wardBeds.map(bed => (
                <button key={bed} onClick={() => toggleCallBell(bed)}
                  className={`w-full flex items-center justify-between rounded-lg border p-3 transition-all ${callBells[bed] ? "border-clinical-amber/40 bg-clinical-amber/10" : "border-slate-200 bg-slate-50 hover:bg-slate-100"}`}>
                  <div className="flex items-center gap-2">
                    <Bell className={`w-4 h-4 ${callBells[bed] ? "text-clinical-amber animate-pulse" : "text-slate-400"}`} />
                    <span className="font-heading font-bold text-sm text-slate-800">Bed {bed}</span>
                  </div>
                  <span className={`text-xs font-medium ${callBells[bed] ? "text-clinical-amber" : "text-slate-400"}`}>{callBells[bed] ? "ACTIVE" : "Idle"}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
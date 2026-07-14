import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { isLoggedIn, getCurrentUser } from "@/lib/clinicalAuth";
import { PREBUILT_SCENARIOS } from "@/lib/specData";
import { SKBadgeGroup } from "@/components/SKBadge";
import NEWS2Badge from "@/components/NEWS2Badge";
import Ward3D from "@/components/Ward3D";
import WardEditPanel from "@/components/WardEditPanel";
import { WARD_ITEM_TYPES } from "@/lib/wardItems";
import {
  Stethoscope, Clock, ChevronRight, User, Heart, AlertCircle, CheckCircle, X,
  Pencil, LayoutGrid, MessageSquare, Settings, Bell,
} from "lucide-react";

const DIFFICULTY_LABELS = { guided: "Guided", intermediate: "Intermediate", independent: "Independent" };

export default function WardSimulation() {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const [scenarios, setScenarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeScenario, setActiveScenario] = useState(null);
  const [showPatientPanel, setShowPatientPanel] = useState(false);
  const [vitals, setVitals] = useState(null);
  const [decisions, setDecisions] = useState([]);
  const [showDebrief, setShowDebrief] = useState(false);
  const [suite, setSuite] = useState("A");
  const [showScenarioList, setShowScenarioList] = useState(false);

  // Edit mode state
  const [editMode, setEditMode] = useState(false);
  const [placedItems, setPlacedItems] = useState([]);
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [selectedItemForPlacement, setSelectedItemForPlacement] = useState(null);
  const [bedDesignation, setBedDesignation] = useState("");
  const [callBells, setCallBells] = useState({});
  const [showCallBellPanel, setShowCallBellPanel] = useState(false);

  const canEdit = ["super_admin", "admin"].includes(user?.role);

  useEffect(() => {
    if (!isLoggedIn()) { navigate("/login"); return; }
    loadScenarios();
  }, [navigate]);

  const loadScenarios = async () => {
    setLoading(true);
    try {
      const existing = await base44.entities.Scenario.list();
      setScenarios(existing.length > 0 ? existing : PREBUILT_SCENARIOS);
    } catch {
      setScenarios(PREBUILT_SCENARIOS);
    } finally {
      setLoading(false);
    }
  };

  const patientsForWard = scenarios.map((s) => ({
    name: s.patient_name, news2_score: s.initial_news2 || 0, bed: s.bed_number, condition: s.patient_condition,
  }));

  // Ward layout load/save
  const loadLayout = async (suiteName) => {
    try {
      const existing = await base44.entities.WardLayout.filter({ suite: suiteName });
      if (existing.length > 0) {
        setPlacedItems(JSON.parse(existing[0].items || "[]"));
      } else {
        setPlacedItems([]);
      }
    } catch {
      const saved = localStorage.getItem(`wardLayout_${suiteName}`);
      setPlacedItems(saved ? JSON.parse(saved) : []);
    }
  };

  const saveLayout = async () => {
    const suiteToSave = suite === "both" ? "A" : suite;
    const itemsJson = JSON.stringify(placedItems);
    try {
      const existing = await base44.entities.WardLayout.filter({ suite: suiteToSave });
      if (existing.length > 0) {
        await base44.entities.WardLayout.update(existing[0].id, { items: itemsJson });
      } else {
        await base44.entities.WardLayout.create({ suite: suiteToSave, items: itemsJson, layout_name: "Default" });
      }
    } catch {
      localStorage.setItem(`wardLayout_${suiteToSave}`, itemsJson);
    }
  };

  // Edit mode handlers
  const handleEditToggle = () => {
    if (editMode) {
      saveLayout();
      setEditMode(false);
      setSelectedItemId(null);
      setSelectedItemForPlacement(null);
    } else {
      const suiteToEdit = suite === "both" ? "A" : suite;
      if (suite === "both") setSuite("A");
      loadLayout(suiteToEdit);
      setActiveScenario(null);
      setEditMode(true);
    }
  };

  const handleItemPlace = (type, x, z, rotationY) => {
    // Smart merging for nurse stations
    if (type === "nurse_station") {
      const adjacent = placedItems.find((item) =>
        item.type === "nurse_station" && !item.expanded &&
        Math.abs(item.x - x) <= 2 && Math.abs(item.z - z) <= 2
      );
      if (adjacent) {
        setPlacedItems((prev) => prev.map((item) =>
          item.id === adjacent.id ? { ...item, expanded: true } : item
        ));
        setSelectedItemId(adjacent.id);
        setSelectedItemForPlacement(null);
        return;
      }
    }
    const designation = type === "bed" ? (bedDesignation || null) : null;
    const newItem = {
      id: `item_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      type, x, z, rotationY: rotationY || 0, designation,
    };
    setPlacedItems((prev) => [...prev, newItem]);
    setSelectedItemId(newItem.id);
    setSelectedItemForPlacement(null);
    if (type === "bed") {
      const prefix = suite === "B" ? "B" : "A";
      const bedCount = placedItems.filter((i) => i.type === "bed").length + 1;
      setBedDesignation(`${prefix}${bedCount + 1}`);
    }
  };

  const handleItemMove = (itemId, x, z) => {
    setPlacedItems((prev) => prev.map((item) =>
      item.id === itemId ? { ...item, x: Math.round(x * 10) / 10, z: Math.round(z * 10) / 10 } : item
    ));
  };

  const handleItemSelect = (itemId) => {
    setSelectedItemId(itemId);
    setSelectedItemForPlacement(null);
  };

  const handleItemRotate = (direction) => {
    if (!selectedItemId) return;
    const sel = placedItems.find((i) => i.id === selectedItemId);
    const isCurtain = sel?.type === "curtain" || sel?.type === "curtain_rail";
    const angle = isCurtain ? Math.PI / 2 : Math.PI / 12;
    setPlacedItems((prev) => prev.map((item) =>
      item.id === selectedItemId
        ? { ...item, rotationY: (item.rotationY || 0) + (direction === "left" ? -angle : angle) }
        : item
    ));
  };

  const handleItemDelete = () => {
    if (!selectedItemId) return;
    setPlacedItems((prev) => prev.filter((item) => item.id !== selectedItemId));
    setSelectedItemId(null);
  };

  // Call bell management
  const toggleCallBell = (designation) => {
    const newActive = !callBells[designation];
    setCallBells((prev) => ({ ...prev, [designation]: newActive }));
    window.dispatchEvent(new CustomEvent("callbell-status", {
      detail: { bedDesignation: designation, active: newActive },
    }));
  };

  const wardBeds = (() => {
    const beds = [];
    if (suite === "A" || suite === "both") for (let i = 1; i <= 4; i++) beds.push(`A${i}`);
    if (suite === "B" || suite === "both") for (let i = 1; i <= 4; i++) beds.push(`B${i}`);
    return beds;
  })();

  const selectedItem = placedItems.find((i) => i.id === selectedItemId);

  // AI event listener — processes voice/typed commands from AI assistant
  useEffect(() => {
    const handler = (e) => {
      const { action, itemType, designation, x, z, direction } = e.detail;
      switch (action) {
        case "place":
          if (editMode && itemType) handleItemPlace(itemType, x || 0, z || 0, 0);
          break;
        case "delete":
          if (selectedItemId) handleItemDelete();
          break;
        case "rotate":
          if (selectedItemId) handleItemRotate(direction || "right");
          break;
        case "activate_callbell":
          if (designation && !callBells[designation]) toggleCallBell(designation);
          break;
        case "reset_callbell":
          if (designation && callBells[designation]) toggleCallBell(designation);
          else if (!designation) Object.keys(callBells).filter((d) => callBells[d]).forEach((d) => toggleCallBell(d));
          break;
      }
    };
    window.addEventListener("ward-ai-command", handler);
    return () => window.removeEventListener("ward-ai-command", handler);
  }, [editMode, selectedItemId, callBells, placedItems]);

  // Dispatch ward state to AI assistant
  useEffect(() => {
    window.dispatchEvent(new CustomEvent("ward-state-update", {
      detail: {
        editMode, suite,
        placedItems: placedItems.map((i) => ({ type: i.type, designation: i.designation, x: i.x, z: i.z })),
        callBells,
        availableItemTypes: WARD_ITEM_TYPES.map((t) => t.type),
      },
    }));
  }, [editMode, suite, placedItems, callBells]);

  // Scenario handlers
  const startScenario = (scenario) => {
    setActiveScenario(scenario);
    setVitals({ ...scenario.initial_vitals });
    setDecisions([]);
    setShowPatientPanel(false);
    setShowScenarioList(false);
  };

  const handleBedClick = (bedIdx) => {
    if (editMode) return;
    if (activeScenario) { setShowPatientPanel(true); return; }
    const scenario = scenarios[bedIdx];
    if (scenario) startScenario(scenario);
  };

  const decisionSteps = activeScenario ? [
    {
      prompt: `${activeScenario.patient_name} is in ${activeScenario.bed_number}. What is your first action?`,
      options: [
        { label: "Perform full ABCDE assessment", correct: true, feedback: "Correct — systematic assessment is always the first priority." },
        { label: "Administer prescribed medication", correct: false, feedback: "Assess before intervening — always follow the ABCDE approach." },
        { label: "Call the doctor immediately", correct: false, feedback: "Assess the patient first — you need information to escalate effectively." },
        { label: "Check observation charts", correct: false, feedback: "Reviewing charts is useful but direct patient assessment comes first." },
      ],
    },
    {
      prompt: `NEWS2 score is ${activeScenario.initial_news2}. ${activeScenario.initial_news2 >= 7 ? "This is a HIGH score." : activeScenario.initial_news2 >= 5 ? "This is a MEDIUM score." : "This is a low score."} What should you do?`,
      options: [
        { label: activeScenario.initial_news2 >= 5 ? "Escalate to registered nurse/medical team using SBAR" : "Continue routine monitoring", correct: true, feedback: "Correct — appropriate escalation based on NEWS2 score." },
        { label: "Document only and continue", correct: false, feedback: "Escalation is required — documenting alone is insufficient." },
        { label: "Reassess in 1 hour", correct: false, feedback: "Do not delay — escalate now based on the current NEWS2 score." },
      ],
    },
    {
      prompt: "The patient needs ongoing care. Which intervention is appropriate?",
      options: [
        { label: "Implement person-centred care plan", correct: true, feedback: "Correct — care should always be person-centred and evidence-based." },
        { label: "Apply standard care without assessment", correct: false, feedback: "All care must be individualised — person-centred approach is essential (CS1)." },
        { label: "Wait for doctor's orders before any action", correct: false, feedback: "Nursing care continues independently — don't wait passively." },
      ],
    },
  ] : [];

  const currentStep = decisions.length;

  const handleDecision = (option, stepIdx) => {
    const newDecision = { step: stepIdx, choice: option.label, correct: option.correct, feedback: option.feedback };
    setDecisions([...decisions, newDecision]);
    if (option.correct && vitals) {
      setVitals({ ...vitals, rr: Math.max(12, (vitals.rr || 18) - 2), spo2: Math.min(98, (vitals.spo2 || 95) + 3), hr: Math.max(60, (vitals.hr || 80) - 10) });
    }
    if (stepIdx + 1 >= decisionSteps.length) {
      setTimeout(() => setShowDebrief(true), 1500);
    }
  };

  const score = decisions.filter((d) => d.correct).length;
  const maxScore = decisionSteps.length;

  const exitScenario = () => {
    setActiveScenario(null); setDecisions([]); setVitals(null); setShowPatientPanel(false);
  };

  // Debrief screen
  if (showDebrief && activeScenario) {
    const percentage = Math.round((score / maxScore) * 100);
    return (
      <div className="min-h-screen bg-slate-100 px-4 pt-6 pb-24 max-w-2xl mx-auto">
        <div className="text-center mb-6">
          <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-3 ${percentage >= 70 ? "bg-clinical-green/20" : percentage >= 40 ? "bg-clinical-amber/20" : "bg-clinical-red/20"}`}>
            {percentage >= 70 ? <CheckCircle className="w-8 h-8 text-clinical-green" /> : <AlertCircle className="w-8 h-8 text-clinical-amber" />}
          </div>
          <h1 className="text-xl font-heading font-bold text-slate-800">Scenario Complete</h1>
          <p className="text-sm text-slate-500">{activeScenario.name}</p>
          <div className="text-3xl font-heading font-bold text-clinical-teal mt-2">{percentage}%</div>
          <p className="text-xs text-slate-500">{score} of {maxScore} correct decisions</p>
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
        <div className="flex gap-2">
          <button onClick={() => { setShowDebrief(false); exitScenario(); }} className="flex-1 py-3 rounded-lg border border-slate-300 text-slate-700 font-heading font-semibold text-sm hover:bg-slate-50">Back to Ward</button>
          <button onClick={() => { setShowDebrief(false); exitScenario(); }} className="flex-1 py-3 rounded-lg bg-clinical-teal text-white font-heading font-semibold text-sm hover:opacity-90">New Scenario</button>
        </div>
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
          {/* Left: Logo */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center">
              <Stethoscope className="w-5 h-5 text-white" />
            </div>
            <span className="font-display text-sm text-slate-800 hidden sm:inline">ClinicalEdge</span>
          </div>

          {/* Center: Suite toggle (hidden in edit mode) */}
          {!editMode && (
            <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
              {["A", "B", "both"].map((s) => (
                <button key={s} onClick={() => setSuite(s)}
                  className={`px-3 py-1.5 text-xs font-heading font-semibold rounded-md transition-all ${suite === s ? "bg-slate-800 text-white shadow-sm" : "text-slate-600 hover:bg-slate-200"}`}>
                  {s === "both" ? "Both" : `Suite ${s}`}
                </button>
              ))}
            </div>
          )}

          {/* Right: Action buttons */}
          <div className="flex items-center gap-1.5 shrink-0">
            {canEdit && (
              <button onClick={handleEditToggle}
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-heading font-medium transition-colors border ${
                  editMode ? "bg-clinical-teal text-white border-clinical-teal" : "bg-white border-slate-300 text-slate-600 hover:bg-slate-50"
                }`}>
                <Pencil className="w-3.5 h-3.5" />
                <span className="hidden lg:inline">{editMode ? "Save & Exit" : "Edit Ward"}</span>
              </button>
            )}
            {!editMode && (
              <>
                <button onClick={() => navigate("/")} className="flex items-center gap-1.5 rounded-lg bg-white border border-slate-300 px-2.5 py-1.5 text-xs font-heading font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                  <LayoutGrid className="w-3.5 h-3.5" /><span className="hidden lg:inline">Dashboard</span>
                </button>
                <button onClick={() => navigate("/profile")} className="flex items-center gap-1.5 rounded-lg bg-white border border-slate-300 px-2.5 py-1.5 text-xs font-heading font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                  <MessageSquare className="w-3.5 h-3.5" /><span className="hidden lg:inline">AI Tutor</span>
                </button>
                <button onClick={() => setShowCallBellPanel(true)}
                  className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-heading font-medium transition-colors border ${
                    showCallBellPanel ? "bg-clinical-amber text-white border-clinical-amber" : "bg-white border-slate-300 text-slate-600 hover:bg-slate-50"
                  }`}>
                  <Bell className="w-3.5 h-3.5" /><span className="hidden lg:inline">Call Bells</span>
                  {Object.values(callBells).some(Boolean) && <span className="w-1.5 h-1.5 rounded-full bg-clinical-red animate-pulse" />}
                </button>
                <button onClick={() => setShowScenarioList(true)}
                  className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-heading font-medium transition-colors border ${
                    showScenarioList ? "bg-clinical-teal text-white border-clinical-teal" : "bg-white border-slate-300 text-slate-600 hover:bg-slate-50"
                  }`}>
                  <Settings className="w-3.5 h-3.5" /><span className="hidden lg:inline">Scenario</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Scenario active indicator */}
        {activeScenario && !editMode && (
          <div className="flex items-center justify-between px-4 py-2 bg-slate-50 border-t border-slate-200">
            <div className="flex items-center gap-3">
              <button onClick={exitScenario} className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-800">
                <X className="w-3.5 h-3.5" /> Exit Scenario
              </button>
              <div className="text-xs"><span className="text-slate-400">Active: </span><span className="font-semibold text-slate-800">{activeScenario.name}</span></div>
            </div>
            <NEWS2Badge score={activeScenario.initial_news2} size="sm" />
          </div>
        )}
      </div>

      {/* 3D Ward viewport */}
      <div className="flex-1 relative">
        <Ward3D
          patients={patientsForWard}
          onBedClick={handleBedClick}
          suite={suite}
          editMode={editMode}
          placedItems={placedItems}
          selectedItemId={selectedItemId}
          selectedItemForPlacement={selectedItemForPlacement}
          onItemPlace={handleItemPlace}
          onItemMove={handleItemMove}
          onItemSelect={handleItemSelect}
        />

        {/* Edit panel */}
        {editMode && (
          <WardEditPanel
            selectedItemForPlacement={selectedItemForPlacement}
            onSelectItemType={(type) => {
              setSelectedItemForPlacement(type);
              setSelectedItemId(null);
              if (type === "bed") {
                const prefix = suite === "B" ? "B" : "A";
                const bedCount = placedItems.filter((i) => i.type === "bed").length + 1;
                setBedDesignation(`${prefix}${bedCount}`);
              }
            }}
            selectedItemId={selectedItemId}
            onRotate={handleItemRotate}
            onDelete={handleItemDelete}
            onExitEdit={handleEditToggle}
            itemCount={placedItems.length}
            bedDesignation={bedDesignation}
            onDesignationChange={setBedDesignation}
            selectedItem={selectedItem}
          />
        )}

        {/* Hint */}
        {!activeScenario && !editMode && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 rounded-lg bg-white/80 backdrop-blur-sm px-4 py-2 text-xs text-slate-600 border border-slate-200 shadow-sm">
            Tap a bed to begin a scenario →
          </div>
        )}
      </div>

      {/* Patient panel */}
      {activeScenario && showPatientPanel && !editMode && (
        <div className="absolute bottom-0 left-0 right-0 z-10 bg-white/95 backdrop-blur-xl rounded-t-2xl border-t border-clinical-teal/30 p-4 max-h-[70vh] overflow-y-auto scrollbar-thin animate-slide-up shadow-2xl">
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-heading font-bold text-slate-800">{activeScenario.patient_name}</h2>
                <span className="text-xs text-slate-500">{activeScenario.patient_age}y · {activeScenario.bed_number}</span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">{activeScenario.patient_condition}</p>
            </div>
            <button onClick={() => setShowPatientPanel(false)} className="p-1.5 rounded-lg hover:bg-slate-100"><X className="w-4 h-4 text-slate-400" /></button>
          </div>
          <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
            <div className="rounded-lg bg-slate-50 p-2"><p className="text-slate-400">Comorbidities</p><p className="text-slate-700">{activeScenario.patient_comorbidities}</p></div>
            <div className="rounded-lg bg-slate-50 p-2"><p className="text-slate-400">Medications</p><p className="text-slate-700">{activeScenario.patient_medications}</p></div>
            <div className="rounded-lg bg-slate-50 p-2"><p className="text-slate-400">Allergies</p><p className="text-slate-700 text-clinical-amber">{activeScenario.patient_allergies}</p></div>
            <div className="rounded-lg bg-slate-50 p-2"><p className="text-slate-400">Current NEWS2</p><div className="mt-0.5"><NEWS2Badge score={activeScenario.initial_news2} size="sm" /></div></div>
          </div>
          {vitals && (
            <div className="rounded-lg bg-slate-50 p-2 mb-3">
              <p className="text-xs font-semibold text-slate-400 mb-1">CURRENT VITALS</p>
              <div className="grid grid-cols-4 gap-2 text-xs">
                <div><span className="text-slate-400">RR</span> <span className="font-bold text-slate-800">{vitals.rr}</span></div>
                <div><span className="text-slate-400">SpO₂</span> <span className="font-bold text-slate-800">{vitals.spo2}%</span></div>
                <div><span className="text-slate-400">BP</span> <span className="font-bold text-slate-800">{vitals.sbp}</span></div>
                <div><span className="text-slate-400">HR</span> <span className="font-bold text-slate-800">{vitals.hr}</span></div>
              </div>
            </div>
          )}
          {currentStep < decisionSteps.length ? (
            <div>
              <p className="text-sm font-semibold text-slate-800 mb-2">{decisionSteps[currentStep].prompt}</p>
              <div className="space-y-2">
                {decisionSteps[currentStep].options.map((opt, i) => (
                  <button key={i} onClick={() => handleDecision(opt, currentStep)}
                    className="w-full text-left rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 hover:border-clinical-teal/50 hover:bg-clinical-teal/5 transition-all">
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
          {decisions.length > 0 && currentStep <= decisionSteps.length && currentStep > 0 && !showDebrief && (
            <div className={`mt-3 rounded-lg p-3 text-xs ${decisions[decisions.length - 1].correct ? "bg-clinical-green/10 text-clinical-green" : "bg-clinical-red/10 text-clinical-red"}`}>
              {decisions[decisions.length - 1].feedback}
            </div>
          )}
          <div className="mt-3 pt-3 border-t border-slate-200"><SKBadgeGroup skCodes={activeScenario.sk_codes} poCodes={activeScenario.performance_outcomes} /></div>
        </div>
      )}

      {/* Scenario list slide-in */}
      {showScenarioList && !editMode && (
        <div className="absolute inset-0 z-30 flex justify-end animate-fade-in" onClick={() => setShowScenarioList(false)}>
          <div className="absolute inset-0 bg-black/20" />
          <div className="relative w-full sm:max-w-md bg-white h-full overflow-y-auto scrollbar-thin shadow-2xl animate-slide-up" onClick={(e) => e.stopPropagation()}>
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
                        <span className={`text-[10px] font-semibold uppercase rounded px-1.5 py-0.5 ${scenario.difficulty === "guided" ? "bg-clinical-green/15 text-clinical-green" : scenario.difficulty === "intermediate" ? "bg-clinical-amber/15 text-clinical-amber" : "bg-clinical-red/15 text-clinical-red"}`}>
                          {DIFFICULTY_LABELS[scenario.difficulty]}
                        </span>
                        <span className="flex items-center gap-1 text-[10px] text-slate-400"><Clock className="w-3 h-3" /> {scenario.estimated_duration} min</span>
                      </div>
                      <h3 className="font-heading font-bold text-sm text-slate-800">{scenario.name}</h3>
                      <p className="text-xs text-slate-500 mt-1">{scenario.description}</p>
                    </div>
                    <NEWS2Badge score={scenario.initial_news2} size="sm" />
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500 mb-2">
                    <span className="flex items-center gap-1"><User className="w-3 h-3" /> {scenario.patient_name}, {scenario.patient_age}y</span>
                    <span className="flex items-center gap-1"><Heart className="w-3 h-3" /> {scenario.bed_number}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <SKBadgeGroup skCodes={scenario.sk_codes} poCodes={scenario.performance_outcomes} />
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-clinical-teal transition-colors" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Call bell management panel */}
      {showCallBellPanel && !editMode && (
        <div className="absolute inset-0 z-30 flex justify-end animate-fade-in" onClick={() => setShowCallBellPanel(false)}>
          <div className="absolute inset-0 bg-black/20" />
          <div className="relative w-full sm:max-w-sm bg-white h-full overflow-y-auto scrollbar-thin shadow-2xl animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
              <h2 className="font-heading font-bold text-sm text-slate-800">Call Bells</h2>
              <button onClick={() => setShowCallBellPanel(false)} className="p-1.5 rounded-lg hover:bg-slate-100"><X className="w-4 h-4 text-slate-400" /></button>
            </div>
            <div className="p-3 space-y-2">
              <p className="text-xs text-slate-500 mb-2">Tap a bed to activate or reset its call bell. The AI assistant will verbally announce active call bells periodically until reset.</p>
              {wardBeds.map((bed) => (
                <button key={bed} onClick={() => toggleCallBell(bed)}
                  className={`w-full flex items-center justify-between rounded-lg border p-3 transition-all ${
                    callBells[bed] ? "border-clinical-amber/40 bg-clinical-amber/10" : "border-slate-200 bg-slate-50 hover:bg-slate-100"
                  }`}>
                  <div className="flex items-center gap-2">
                    <Bell className={`w-4 h-4 ${callBells[bed] ? "text-clinical-amber animate-pulse" : "text-slate-400"}`} />
                    <span className="font-heading font-bold text-sm text-slate-800">Bed {bed}</span>
                  </div>
                  <span className={`text-xs font-medium ${callBells[bed] ? "text-clinical-amber" : "text-slate-400"}`}>
                    {callBells[bed] ? "ACTIVE" : "Idle"}
                  </span>
                </button>
              ))}
              {Object.values(callBells).some(Boolean) && (
                <button onClick={() => Object.keys(callBells).filter((d) => callBells[d]).forEach((d) => toggleCallBell(d))}
                  className="w-full mt-2 py-2 rounded-lg border border-clinical-red/30 bg-clinical-red/5 text-clinical-red text-xs font-heading font-semibold hover:bg-clinical-red/10">
                  Reset All Call Bells
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
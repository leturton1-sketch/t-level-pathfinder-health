import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { isLoggedIn, getCurrentUser } from "@/lib/clinicalAuth";
import { PREBUILT_SCENARIOS } from "@/lib/specData";
import { SKBadgeGroup } from "@/components/SKBadge";
import NEWS2Badge from "@/components/NEWS2Badge";
import Ward3D from "@/components/Ward3D";
import ADLScenario from "@/components/ADLScenario";
import WardEditPanel from "@/components/WardEditPanel";
import WardPropertiesPanel from "@/components/WardPropertiesPanel";
import PatientPanel from "@/components/PatientPanel";
import WardPatientPanel from "@/components/WardPatientPanel";
import { getPatientForBed } from "@/lib/wardPatients";
import { storeCarePlanSimulation } from "@/lib/carePlanSimulation";
import { WARD_ITEM_TYPES, generateDefaultItems } from "@/lib/wardItems";
import { useWardNarration } from "@/hooks/useWardNarration";
import { announceVoiceFeedback } from "@/utils/ukVoiceSynthesizer";
import { getSimulationState, startSimulation, endSimulation, setSimulationController, subscribeSimulationState } from "@/lib/simulationState";
import { withExponentialBackoff } from "@/lib/networkRetry";
import {
  Stethoscope, Clock, ChevronRight, User, Heart, AlertCircle, CheckCircle, X,
  Pencil, LayoutGrid, Settings, Camera, AlertTriangle, Power, Info,
  Sun, Moon,
} from "lucide-react";

const DIFFICULTY_LABELS = { guided: "Guided", intermediate: "Intermediate", independent: "Independent" };

function normaliseWardLayout(rawLayout) {
  if (!Array.isArray(rawLayout) || rawLayout.length === 0) return generateDefaultItems();
  const validItems = rawLayout.filter((item) =>
    item &&
    typeof item.id === "string" &&
    typeof item.type === "string" &&
    Number.isFinite(Number(item.x)) &&
    Number.isFinite(Number(item.z))
  ).map((item) => ({ ...item, x: Number(item.x), z: Number(item.z) }));
  return validItems.length > 0 ? consolidateTeachingTables(validItems) : generateDefaultItems();
}

function readLocalWardLayout() {
  try {
    const stored = localStorage.getItem("wardLayout_ward");
    return stored ? normaliseWardLayout(JSON.parse(stored)) : generateDefaultItems();
  } catch {
    localStorage.removeItem("wardLayout_ward");
    return generateDefaultItems();
  }
}

function consolidateTeachingTables(layout) {
  let next = [...layout];
  const zones = [
    { matches: (item) => item.type === "table" && item.x >= 15 && item.z < 15, x: 30, z: 0 },
    { matches: (item) => item.type === "table" && item.z >= 15, x: 0, z: 25 },
  ];
  zones.forEach((zone) => {
    const tables = next.filter(zone.matches);
    if (tables.length > 1) {
      next = next.filter((item) => !zone.matches(item));
      next.push({ ...tables[0], x: zone.x, z: zone.z, rotationY: tables[0].rotationY || 0 });
    }
  });
  return next;
}

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
  const [suite, setSuite] = useState("all");
  const [dayNightMode, setDayNightMode] = useState("auto");
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
  const [adlScenario, setAdlScenario] = useState(null);
  const [activeCallBed, setActiveCallBed] = useState(null);
  const [simState, setSimState] = useState(getSimulationState);

  // Clinical narration during simulation
  const narration = useWardNarration();

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
      const existing = await withExponentialBackoff(() => base44.entities.Scenario.list());
      const customIds = new Set(existing.map((scenario) => scenario.name));
      setScenarios([...PREBUILT_SCENARIOS.filter((scenario) => !customIds.has(scenario.name)), ...existing]);
    } catch { setScenarios(PREBUILT_SCENARIOS); }
  };

  const loadLayout = async () => {
    setLoading(true);
    try {
      const existing = await withExponentialBackoff(() => base44.entities.WardLayout.filter({ suite: "ward" }));
      if (existing.length > 0 && existing[0].items) {
        try {
          setItems(normaliseWardLayout(JSON.parse(existing[0].items)));
        } catch {
          setItems(readLocalWardLayout());
        }
      } else {
        setItems(readLocalWardLayout());
      }
    } catch {
      setItems(readLocalWardLayout());
    } finally {
      setLoading(false);
    }
  };

  // Auto-save with debounce
  const debouncedSave = useCallback((itemsToSave) => {
    setSaveStatus("Saving…");
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      try {
        const itemsJson = JSON.stringify(itemsToSave);
        const existing = await withExponentialBackoff(() => base44.entities.WardLayout.filter({ suite: "ward" }));
        if (existing.length > 0) {
          await withExponentialBackoff(() => base44.entities.WardLayout.update(existing[0].id, { items: itemsJson }));
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

  // Keep the shared simulation state in sync so the dashboard never disagrees
  // with what's actually happening on the ward.
  useEffect(() => subscribeSimulationState(setSimState), []);

  // Ward state dispatch for AI assistant
  useEffect(() => {
    window.dispatchEvent(new CustomEvent("ward-state-update", {
      detail: {
        editMode, suite,
        placedItems: items.map(i => ({ type: i.type, designation: i.designation, x: i.x, z: i.z })),
        availableItemTypes: WARD_ITEM_TYPES.map(t => t.type),
      },
    }));
  }, [editMode, suite, items]);

  // AI command listener
  useEffect(() => {
    const handler = (e) => {
      const { action, itemType, designation, direction } = e.detail;
      switch (action) {
        case "place": if (editMode && itemType) handleItemPlace(itemType, 0, 0); break;
        case "delete": {
          if (!designation) break;
          const target = items.find((i) => i.designation === designation);
          if (target) modifyItems(items.filter((i) => i.id !== target.id));
          break;
        }
        case "rotate": {
          const target = designation ? items.find((i) => i.designation === designation) : items.find((i) => i.id === selectedItemId);
          if (target) modifyItems(items.map((i) => i.id === target.id ? { ...i, rotationY: (i.rotationY || 0) + (direction === "left" ? -15 : 15) } : i));
          break;
        }
        case "start-simulation": if (!simState.running) handleBeginTask(); break;
        case "end-simulation": if (simState.running) handleEndSimulationRequest(); break;
        case "take-control": setSimulationController(e.detail.controller === "user" ? "user" : "ai"); break;
      }
    };
    window.addEventListener("ward-ai-command", handler);
    return () => window.removeEventListener("ward-ai-command", handler);
  }, [editMode, items, selectedItemId, simState.running]);

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
  const handleItemPlace = (type, x, z, rotationY) => {
    const suitePrefix = x >= 0 ? "B" : "A";
    const bedCount = items.filter(i => i.type === "bed" && (suitePrefix === "B" ? i.x >= 0 : i.x < 0)).length;
    const designation = type === "bed" ? `${suitePrefix}${bedCount + 1}` : null;
    const newItem = { id: `item_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, type, x, z, rotationY: rotationY ?? 0, designation };
    modifyItems([...items, newItem]);
    setSelectedItemId(newItem.id);
    setSelectedItemForPlacement(null);
  };

  const handleItemMove = (itemId, x, z, rotationY) => {
    modifyItems(items.map(i => i.id === itemId ? { ...i, x, z, ...(rotationY != null ? { rotationY } : {}) } : i));
  };

  const handleItemRotate = (itemId, rotationY) => {
    modifyItems(items.map(i => i.id === itemId ? { ...i, rotationY } : i));
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

  const handleEndSimulationRequest = () => { setConfirmAction({ type: "end" }); };

  const confirmAction_yes = () => {
    if (confirmAction?.type === "delete" && selectedItemId) {
      modifyItems(items.filter(i => i.id !== selectedItemId));
      setSelectedItemId(null);
    } else if (confirmAction?.type === "reset") {
      modifyItems(generateDefaultItems());
      setSelectedItemId(null);
    } else if (confirmAction?.type === "end") {
      // End the simulation session: clear scenarios, patients, alarms and scores
      setActiveScenario(null);
      setAdlScenario(null);
      setVitals(null);
      setDecisions([]);
      setActiveCallBed(null);
      setShowPatientPanel(false);
      setSelectedBed(null);
      setShowDebrief(false);
      setShowScenarioList(false);
      narration.stop();
      setCameraCommand({ type: "reset", nonce: Date.now() });
      endSimulation();
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
      const existing = await withExponentialBackoff(() => base44.entities.WardLayout.filter({ suite: "ward" }));
      if (existing.length > 0) await withExponentialBackoff(() => base44.entities.WardLayout.update(existing[0].id, { items: itemsJson }));
      else await base44.entities.WardLayout.create({ suite: "ward", items: itemsJson, layout_name: "Default" });
      setSaveStatus("Layout saved");
      announceVoiceFeedback("Ward layout saved successfully.");
      setTimeout(() => setSaveStatus(""), 2500);
    } catch {
      localStorage.setItem("wardLayout_ward", JSON.stringify(itemsToSave));
      setSaveStatus("Unable to save – changes retained on this device");
      announceVoiceFeedback("The ward layout could not be saved online. Your changes are retained on this device.");
    }
  };

  // --- Navigation with save ---
  const navigateAway = async (path) => {
    if (editMode) await saveNow(items);
    navigate(path);
  };

  const launchPatientCarePlan = async (toolId, patient) => {
    storeCarePlanSimulation(patient, toolId);
    await navigateAway(`/care-planning/tool/${toolId}`);
  };

  // --- Camera ---
  const resetCamera = () => setCameraCommand({ type: "reset", nonce: Date.now() });

  const focusSuite = (s) => {
    setSuite(s);
    if (s === "all") {
      setCameraCommand({ type: "reset", nonce: Date.now() });
    } else {
      const targets = {
        A: { x: -30, z: 16 },
        B: { x: 0, z: 16 },
        C: { x: 30, z: 16 },
        D: { x: 0, z: 41, lookZ: 25 },
      };
      setCameraCommand({ type: "suite", target: targets[s], nonce: Date.now() });
    }
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

  // --- Scenario ---
  const startScenario = (scenario) => {
    startSimulation({ controller: "user", scenarioId: scenario.id, scenarioName: scenario.name });
    if (scenario.category === "activities_daily_living") {
      setShowScenarioList(false);
      setActiveScenario(null);
      setAdlScenario(scenario);
      return;
    }
    setActiveScenario(scenario);
    setVitals({ ...scenario.initial_vitals });
    setDecisions([]);
    setShowPatientPanel(false);
    setShowScenarioList(false);
    // Narrate the opening clinical prompt
    const prompt = `${scenario.patient_name} is in ${scenario.bed_number}. ${scenario.patient_condition}. What is your first action?`;
    setTimeout(() => narration.speak(prompt), 400);
  };

  const getScenarioForBed = (bed) => scenarios.find(s => s.bed_number?.includes(bed) || bed?.includes(s.bed_number));

  const handleBeginTask = () => {
    if (!selectedBed) return;
    const scenario = getScenarioForBed(selectedBed) || scenarios[0];
    if (scenario) startScenario(scenario);
  };

  const handleBeginPatientScenario = (wardPatient) => {
    // Build a scenario object from the ward patient data
    const scenario = {
      id: `ward_${wardPatient.id}`,
      name: `${wardPatient.name} — ${wardPatient.condition.split(",")[0]}`,
      description: wardPatient.admission_reason,
      patient_name: wardPatient.name,
      patient_age: wardPatient.age,
      patient_condition: wardPatient.condition,
      patient_comorbidities: wardPatient.comorbidities,
      patient_medications: wardPatient.medications,
      patient_allergies: wardPatient.allergies,
      bed_number: `Bed ${wardPatient.bedDesignation}`,
      initial_vitals: wardPatient.initial_vitals,
      initial_news2: wardPatient.initial_news2,
      sk_codes: ["SK1", "SK2", "SK4", "SK5"],
      performance_outcomes: ["PO4", "PO9"],
      debrief_rationale: wardPatient.debrief_rationale,
      difficulty: wardPatient.initial_news2 >= 7 ? "independent" : wardPatient.initial_news2 >= 3 ? "intermediate" : "guided",
      estimated_duration: 20,
    };
    setShowPatientPanel(false);
    startScenario(scenario);
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
    narration.speak(option.feedback);
    if (stepIdx + 1 >= decisionSteps.length) setTimeout(() => setShowDebrief(true), 1500);
  };
  const score = decisions.filter(d => d.correct).length;
  const exitScenario = () => { setActiveScenario(null); setAdlScenario(null); setDecisions([]); setVitals(null); setShowPatientPanel(false); narration.stop(); endSimulation(); };

  // Persist the simulation result when the debrief is reached — triggers the tutor email and feeds the performance dashboard
  const debriefSavedRef = useRef(false);
  useEffect(() => {
    if (showDebrief && activeScenario && !debriefSavedRef.current) {
      debriefSavedRef.current = true;
      const maxScore = decisionSteps.length;
      const pct = Math.round((score / maxScore) * 100);
      base44.entities.SimulationResult.create({
        student_id: user?.id,
        student_name: user?.full_name,
        scenario_id: activeScenario.id,
        scenario_name: activeScenario.name,
        decisions: JSON.stringify(decisions),
        score,
        max_score: maxScore,
        decision_path: JSON.stringify({ correct: score, total: maxScore }),
        completed: true,
        sk_codes: activeScenario.sk_codes || [],
        performance_outcomes: activeScenario.performance_outcomes || [],
      }).catch(() => {});
      // Narrate the debrief headline
      setTimeout(() => narration.speak(`Scenario complete. You scored ${pct} percent. ${activeScenario.debrief_rationale}`), 300);
    }
    if (!showDebrief) debriefSavedRef.current = false;
  }, [showDebrief, activeScenario, decisions, score, decisionSteps.length]);

  const selectedItem = items.find(i => i.id === selectedItemId);

  // --- Debrief screen ---
  if (showDebrief && activeScenario) {
    const pct = Math.round((score / decisionSteps.length) * 100);
    return (
      <div className="clinical-page-shell clinical-page-shell--narrow min-h-screen bg-background">
        <div className="text-center mb-6">
          <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-3 ${pct >= 70 ? "bg-clinical-green/20" : "bg-clinical-amber/20"}`}>
            {pct >= 70 ? <CheckCircle className="w-8 h-8 text-clinical-green" /> : <AlertCircle className="w-8 h-8 text-clinical-amber" />}
          </div>
          <h1 className="text-xl font-heading font-bold text-foreground">Scenario Complete</h1>
          <p className="text-sm text-muted-foreground">{activeScenario.name}</p>
          <div className="text-3xl font-heading font-bold text-clinical-teal mt-2">{pct}%</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 mb-4 shadow-sm">
          <h2 className="text-sm font-heading font-bold text-foreground mb-2">Clinical Debrief</h2>
          <p className="text-sm text-muted-foreground">{activeScenario.debrief_rationale}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 mb-4 shadow-sm">
          <h2 className="text-sm font-heading font-bold text-foreground mb-3">Decision Pathway</h2>
          <div className="space-y-2">
            {decisions.map((d, i) => (
              <div key={i} className={`rounded-lg p-3 text-xs ${d.correct ? "bg-clinical-green/5 border border-clinical-green/20" : "bg-clinical-red/5 border border-clinical-red/20"}`}>
                <div className="flex items-center gap-2 mb-1">
                  {d.correct ? <CheckCircle className="w-3.5 h-3.5 text-clinical-green" /> : <X className="w-3.5 h-3.5 text-clinical-red" />}
                  <span className="font-semibold text-foreground">Step {i + 1}: {d.choice}</span>
                </div>
                <p className="text-muted-foreground">{d.feedback}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="mb-4"><SKBadgeGroup skCodes={activeScenario.sk_codes} poCodes={activeScenario.performance_outcomes} /></div>
        <div className="pf-progress-links" aria-label="Continue your learning">
          <button className="pf-secondary-button" onClick={() => navigate("/care-planning")}>Continue to care planning</button>
          <button className="pf-secondary-button" onClick={() => navigate("/reflection")}>Reflect on your decisions</button>
          <button className="pf-secondary-button" onClick={() => navigate("/performance")}>View progress and feedback</button>
        </div>
        <button onClick={() => { setShowDebrief(false); exitScenario(); }}
          className="w-full py-3 rounded-lg bg-clinical-teal text-white font-heading font-semibold text-sm hover:opacity-90">Back to Ward</button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="w-8 h-8 border-2 border-clinical-teal/30 border-t-clinical-teal rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="pf-ward-page relative bg-background flex flex-col">
      {/* Status bar */}
      <div className="bg-primary text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-2 text-[10px] font-heading uppercase tracking-wider sm:px-6 lg:px-8">
          <span>Ward Simulation · Live</span>
          <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> Monitoring</span>
        </div>
      </div>
      {/* Top navigation bar */}
      <div className="z-20 bg-card border-b border-border shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 sm:px-6 lg:px-8">
          {/* Logo */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <Stethoscope className="w-5 h-5 text-white" />
            </div>
            <div className="hidden sm:block">
              <span className="font-display text-sm text-foreground block leading-none">ClinicalEdge</span>
              <span className="text-[8px] text-muted-foreground uppercase tracking-wider">T-Level Academy</span>
            </div>
          </div>

          {/* Suite selector */}
          <div className="flex items-center gap-1 bg-background rounded-lg p-1">
            {["A", "B", "C", "D", "all"].map(s => (
              <button key={s} onClick={() => focusSuite(s)}
                className={`px-2.5 py-1.5 text-xs font-heading font-semibold rounded-md transition-all ${suite === s ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:bg-secondary/60"}`}>
                {s === "all" ? "Full Academy" : s === "C" ? "Skills" : s === "D" ? "Theory" : `Suite ${s}`}
              </button>
            ))}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setDayNightMode(prev => prev === "day" ? "night" : prev === "night" ? "auto" : "day")}
              className="flex items-center gap-1.5 rounded-lg bg-card border border-border px-2.5 py-1.5 text-xs font-heading font-medium text-muted-foreground hover:bg-secondary/40 transition-colors"
              aria-label={`Ward environment: ${dayNightMode}`}
              title={`Ward environment: ${dayNightMode === "auto" ? "Auto (local time)" : dayNightMode === "day" ? "Day" : "Night"} — click to toggle`}
            >
              {dayNightMode === "night"
                ? <Moon className="w-3.5 h-3.5 text-clinical-amber" />
                : <Sun className="w-3.5 h-3.5 text-clinical-amber" />}
              <span className="hidden lg:inline">{dayNightMode === "auto" ? "Auto" : dayNightMode === "day" ? "Day" : "Night"}</span>
            </button>
            <button onClick={resetCamera} className="flex items-center gap-1.5 rounded-lg bg-card border border-border px-2.5 py-1.5 text-xs font-heading font-medium text-muted-foreground hover:bg-secondary/40 transition-colors" aria-label="Reset camera">
              <Camera className="w-3.5 h-3.5" /><span className="hidden lg:inline">Reset View</span>
            </button>
            {canEdit && (
              <button aria-label={editMode ? "Save and exit ward editor" : "Edit ward"} onClick={handleEditToggle}
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-heading font-medium transition-colors border ${editMode ? "bg-clinical-teal text-white border-clinical-teal" : "bg-card border-border text-muted-foreground hover:bg-secondary/40"}`}>
                <Pencil className="w-3.5 h-3.5" /><span className="hidden lg:inline">{editMode ? "Save & Exit" : "Edit Ward"}</span>
              </button>
            )}
            {!editMode && (
              <>
                <button aria-label="Pathfinder Overview" onClick={() => navigateAway("/")} className="flex items-center gap-1.5 rounded-lg bg-card border border-border px-2.5 py-1.5 text-xs font-heading font-medium text-muted-foreground hover:bg-secondary/40">
                  <LayoutGrid className="w-3.5 h-3.5" /><span className="hidden lg:inline">Dashboard</span>
                </button>
                <button aria-label="Scenarios" onClick={() => setShowScenarioList(true)}
                  className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-heading font-medium border ${showScenarioList ? "bg-clinical-teal text-white border-clinical-teal" : "bg-card border-border text-muted-foreground hover:bg-secondary/40"}`}>
                  <Settings className="w-3.5 h-3.5" /><span className="hidden lg:inline">Scenarios</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Scenario indicator */}
        {(activeScenario || adlScenario) && !editMode && (
          <div className="flex items-center justify-between px-4 py-2 bg-secondary/40 border-t border-border">
            <div className="flex items-center gap-3">
              <button onClick={exitScenario} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"><X className="w-3.5 h-3.5" /> Exit Scenario</button>
              <div className="text-xs"><span className="text-muted-foreground">Active: </span><span className="font-semibold text-foreground">{activeScenario?.name || adlScenario?.name || "ADL Simulation"}</span></div>
            </div>
            <div className="flex items-center gap-2">
              {activeScenario && <NEWS2Badge score={activeScenario.initial_news2} size="sm" />}
              <div className="flex items-center rounded-lg border border-border bg-card p-0.5 text-xs" role="group" aria-label="Who is in control of this simulation">
                <button type="button" onClick={() => setSimulationController("user")}
                  className={`rounded-md px-2 py-1 font-heading font-medium transition-colors ${simState.controller === "ai" ? "text-muted-foreground hover:text-foreground" : "bg-clinical-teal text-white"}`}>
                  You
                </button>
                <button type="button" onClick={() => setSimulationController("ai")}
                  className={`rounded-md px-2 py-1 font-heading font-medium transition-colors ${simState.controller === "ai" ? "bg-clinical-teal text-white" : "text-muted-foreground hover:text-foreground"}`}>
                  Pathfinder AI
                </button>
              </div>
              <button onClick={handleEndSimulationRequest} className="flex items-center gap-1.5 rounded-lg bg-clinical-red/10 border border-clinical-red/30 px-2.5 py-1.5 text-xs font-heading font-semibold text-clinical-red hover:bg-clinical-red/20 transition-colors">
                <Power className="w-3.5 h-3.5" /><span className="hidden sm:inline">End Simulation</span>
              </button>
            </div>
          </div>
        )}

        {/* Save status */}
        {saveStatus && (
          <div className="flex items-center justify-center gap-1.5 py-1 bg-secondary/40 border-t border-border">
            <span className={`text-[10px] font-medium ${saveStatus.includes("Unable") ? "text-clinical-red" : saveStatus.includes("Saving") ? "text-muted-foreground" : "text-clinical-green"}`}>
              {saveStatus.includes("Saving") ? "● " : saveStatus.includes("Unable") ? "⚠ " : "✓ "}{saveStatus}
            </span>
          </div>
        )}
      </div>

      {/* 3D Ward */}
      <div className="pf-ward-viewport relative">
        <Ward3D
          items={items}
          editMode={editMode}
          selectedItemId={selectedItemId}
          snapToGrid={snapToGrid}
          selectedItemForPlacement={selectedItemForPlacement}
          suite={suite}
          dayNightMode={dayNightMode}
          cameraCommand={cameraCommand}
          onItemSelect={handleItemSelect}
          onItemMove={handleItemMove}
          onItemPlace={handleItemPlace}
          onItemRotate={handleItemRotate}
          onBedClick={handleBedClick}
          onSelectItemType={(type) => { setSelectedItemForPlacement(type); setSelectedItemId(null); }}
          activeCallBed={activeCallBed}
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

        {/* Patient panel — celebrity ward patient if available, legacy panel otherwise */}
        {showPatientPanel && selectedBed && !editMode && (
          getPatientForBed(selectedBed) ? (
            <WardPatientPanel
              bedDesignation={selectedBed}
              onClose={() => { setShowPatientPanel(false); setSelectedBed(null); }}
              onBeginScenario={handleBeginPatientScenario}
              onLaunchTool={(path) => navigateAway(path)}
              onLaunchCarePlan={launchPatientCarePlan}
            />
          ) : (
            <PatientPanel
              bedDesignation={selectedBed}
              onClose={() => { setShowPatientPanel(false); setSelectedBed(null); }}
              onViewPatient={() => {}}
              onRecordObservations={() => navigateAway("/care-planning/news2")}
              onBeginTask={handleBeginTask}
              hasScenario={!!getScenarioForBed(selectedBed) || scenarios.length > 0}
            />
          )
        )}

        {adlScenario && !editMode && (
          <ADLScenario
            scenario={adlScenario}
            bedDesignations={items.filter((item) => item.type === "bed").map((item) => item.designation)}
            onActiveBedChange={setActiveCallBed}
            onClose={() => { setAdlScenario(null); setActiveCallBed(null); }}
          />
        )}

        {/* Instructions (top-left) — view patient details */}
        {!activeScenario && !adlScenario && !editMode && !showPatientPanel && (
          <div className="absolute top-3 left-3 z-10 w-64 rounded-xl bg-card/90 backdrop-blur-md border border-border shadow-lg p-3">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Info className="w-3.5 h-3.5 text-clinical-teal" />
              <h3 className="text-xs font-heading font-bold text-foreground uppercase tracking-wide">Instructions</h3>
            </div>
            <p className="text-[11px] text-muted-foreground mb-2">Click a bed in the ward to load that patient, then use the button below to view their details.</p>
            <button
              onClick={() => selectedBed && setShowPatientPanel(true)}
              disabled={!selectedBed}
              className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-clinical-teal text-white px-2.5 py-1.5 text-xs font-heading font-semibold disabled:opacity-40 hover:opacity-90 transition-opacity"
            >
              <User className="w-3.5 h-3.5" /> View Patient Details
            </button>
          </div>
        )}
      </div>

      {/* Confirmation dialog */}
      {confirmAction && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/30 backdrop-blur-sm animate-fade-in" onClick={() => setConfirmAction(null)}>
          <div className="bg-card rounded-xl shadow-2xl p-6 max-w-sm w-[90%]" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-3">
              <AlertTriangle className="w-6 h-6 text-clinical-amber" />
              <h2 className="font-heading font-bold text-foreground">{confirmAction.type === "delete" ? "Delete Item?" : confirmAction.type === "reset" ? "Reset Layout?" : "End Simulation?"}</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              {confirmAction.type === "delete"
                ? "Are you sure you want to delete this item? This action cannot be undone (except via Undo)."
                : confirmAction.type === "reset"
                  ? "Are you sure you want to reset the layout to defaults? All current placements will be lost."
                  : "This will end the current simulation session — the active scenario, patient vitals, NEWS2 scores, alarm bells and call lights will be cleared, and the ward will return to an empty monitoring state."}
            </p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmAction(null)} className="flex-1 py-2.5 rounded-lg border border-border text-foreground text-sm font-heading font-semibold hover:bg-secondary/40">Cancel</button>
              <button onClick={confirmAction_yes} className="flex-1 py-2.5 rounded-lg bg-clinical-red text-white text-sm font-heading font-semibold hover:opacity-90">Confirm</button>
            </div>
          </div>
        </div>
      )}

      {/* Scenario list */}
      {showScenarioList && !editMode && (
        <div className="absolute inset-0 z-30 flex justify-end animate-fade-in" onClick={() => setShowScenarioList(false)}>
          <div className="absolute inset-0 bg-black/20" />
          <div className="relative w-full sm:max-w-md bg-card h-full overflow-y-auto scrollbar-thin shadow-2xl animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-card border-b border-border px-4 py-3 flex items-center justify-between">
              <h2 className="font-heading font-bold text-sm text-foreground">Scenarios</h2>
              <button type="button" onClick={() => setShowScenarioList(false)} aria-label="Close scenario list" className="p-1.5 rounded-lg hover:bg-secondary/60"><X className="w-4 h-4 text-muted-foreground" /></button>
            </div>
            <div className="p-3 pb-0">
              <button onClick={handleEndSimulationRequest}
                className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-clinical-red/10 border border-clinical-red/30 px-2.5 py-2 text-xs font-heading font-semibold text-clinical-red hover:bg-clinical-red/20 transition-colors">
                <Power className="w-3.5 h-3.5" /> End Simulation
              </button>
            </div>
            <div className="p-3 space-y-3">
              {scenarios.map((scenario, idx) => (
                <button key={idx} onClick={() => startScenario(scenario)}
                  className="group w-full text-left rounded-xl border border-border bg-card hover:bg-secondary/40 hover:border-clinical-teal/40 transition-all p-4">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] font-semibold uppercase rounded px-1.5 py-0.5 ${scenario.difficulty === "guided" ? "bg-clinical-green/15 text-clinical-green" : scenario.difficulty === "intermediate" ? "bg-clinical-amber/15 text-clinical-amber" : "bg-clinical-red/15 text-clinical-red"}`}>{DIFFICULTY_LABELS[scenario.difficulty]}</span>
                        <span className="flex items-center gap-1 text-[10px] text-muted-foreground"><Clock className="w-3 h-3" /> {scenario.estimated_duration} min</span>
                      </div>
                      <h3 className="font-heading font-bold text-sm text-foreground">{scenario.name}</h3>
                      <p className="text-xs text-muted-foreground mt-1">{scenario.description}</p>
                    </div>
                    <NEWS2Badge score={scenario.initial_news2} size="sm" />
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                    <span className="flex items-center gap-1"><User className="w-3 h-3" /> {scenario.patient_name}</span>
                    <span className="flex items-center gap-1"><Heart className="w-3 h-3" /> {scenario.bed_number}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <SKBadgeGroup skCodes={scenario.sk_codes} poCodes={scenario.performance_outcomes} />
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-clinical-teal" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
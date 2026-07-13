import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { isLoggedIn, getCurrentUser } from "@/lib/clinicalAuth";
import { PREBUILT_SCENARIOS } from "@/lib/specData";
import { SKBadgeGroup } from "@/components/SKBadge";
import NEWS2Badge from "@/components/NEWS2Badge";
import Ward3D from "@/components/Ward3D";
import { Stethoscope, Clock, ChevronRight, ArrowLeft, Activity, User, Heart, Pill, AlertCircle, CheckCircle, X } from "lucide-react";

const DIFFICULTY_LABELS = { guided: "Guided", intermediate: "Intermediate", independent: "Independent" };

export default function WardSimulation() {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const [scenarios, setScenarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeScenario, setActiveScenario] = useState(null);
  const [selectedBed, setSelectedBed] = useState(null);
  const [showPatientPanel, setShowPatientPanel] = useState(false);
  const [decisionState, setDecisionState] = useState(null);
  const [vitals, setVitals] = useState(null);
  const [decisions, setDecisions] = useState([]);
  const [showDebrief, setShowDebrief] = useState(false);

  useEffect(() => {
    if (!isLoggedIn()) {
      navigate("/login");
      return;
    }
    loadScenarios();
  }, [navigate]);

  const loadScenarios = async () => {
    setLoading(true);
    try {
      const existing = await base44.entities.Scenario.list();
      if (existing.length > 0) {
        setScenarios(existing);
      } else {
        setScenarios(PREBUILT_SCENARIOS);
      }
    } catch {
      setScenarios(PREBUILT_SCENARIOS);
    } finally {
      setLoading(false);
    }
  };

  const patientsForWard = scenarios.map((s) => ({
    name: s.patient_name,
    news2_score: s.initial_news2 || 0,
    bed: s.bed_number,
    condition: s.patient_condition,
  }));

  const startScenario = (scenario) => {
    setActiveScenario(scenario);
    setVitals({ ...scenario.initial_vitals });
    setDecisions([]);
    setDecisionState("intro");
    setShowPatientPanel(false);
  };

  const handleBedClick = (bedIdx) => {
    if (activeScenario) {
      setShowPatientPanel(true);
      return;
    }
    const patient = patientsForWard[bedIdx];
    if (patient) {
      const scenario = scenarios[bedIdx];
      if (scenario) startScenario(scenario);
    }
  };

  // Simple decision tree for the active scenario
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

  const currentStep = decisionState === "intro" ? 0 : decisions.length;

  const handleDecision = (option, stepIdx) => {
    const newDecision = { step: stepIdx, choice: option.label, correct: option.correct, feedback: option.feedback };
    setDecisions([...decisions, newDecision]);

    // Simulate vitals change
    if (option.correct && vitals) {
      setVitals({
        ...vitals,
        rr: Math.max(12, (vitals.rr || 18) - 2),
        spo2: Math.min(98, (vitals.spo2 || 95) + 3),
        hr: Math.max(60, (vitals.hr || 80) - 10),
      });
    }

    if (stepIdx + 1 >= decisionSteps.length) {
      setTimeout(() => setShowDebrief(true), 1500);
    }
  };

  const score = decisions.filter((d) => d.correct).length;
  const maxScore = decisionSteps.length;

  // Debrief screen
  if (showDebrief && activeScenario) {
    const percentage = Math.round((score / maxScore) * 100);
    return (
      <div className="min-h-screen bg-clinical-navy px-4 pt-6 pb-24 max-w-2xl mx-auto">
        <div className="text-center mb-6">
          <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-3 ${
            percentage >= 70 ? "bg-clinical-green/20" : percentage >= 40 ? "bg-clinical-amber/20" : "bg-clinical-red/20"
          }`}>
            {percentage >= 70 ? <CheckCircle className="w-8 h-8 text-clinical-green" /> : <AlertCircle className="w-8 h-8 text-clinical-amber" />}
          </div>
          <h1 className="text-xl font-bold text-foreground">Scenario Complete</h1>
          <p className="text-sm text-muted-foreground">{activeScenario.name}</p>
          <div className="text-3xl font-bold text-clinical-teal mt-2">{percentage}%</div>
          <p className="text-xs text-muted-foreground">{score} of {maxScore} correct decisions</p>
        </div>

        <div className="rounded-xl border border-border bg-card/60 p-4 mb-4">
          <h2 className="text-sm font-bold text-foreground mb-2">Clinical Debrief</h2>
          <p className="text-sm text-muted-foreground">{activeScenario.debrief_rationale}</p>
        </div>

        <div className="rounded-xl border border-border bg-card/60 p-4 mb-4">
          <h2 className="text-sm font-bold text-foreground mb-3">Decision Pathway</h2>
          <div className="space-y-2">
            {decisions.map((d, i) => (
              <div key={i} className={`rounded-lg p-3 text-xs ${
                d.correct ? "bg-clinical-green/5 border border-clinical-green/20" : "bg-clinical-red/5 border border-clinical-red/20"
              }`}>
                <div className="flex items-center gap-2 mb-1">
                  {d.correct ? <CheckCircle className="w-3.5 h-3.5 text-clinical-green" /> : <X className="w-3.5 h-3.5 text-clinical-red" />}
                  <span className="font-semibold text-foreground">Step {i + 1}: {d.choice}</span>
                </div>
                <p className="text-muted-foreground">{d.feedback}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <SKBadgeGroup skCodes={activeScenario.sk_codes} poCodes={activeScenario.performance_outcomes} />
        </div>

        <div className="flex gap-2">
          <button onClick={() => { setActiveScenario(null); setShowDebrief(false); setDecisions([]); }} className="flex-1 py-3 rounded-lg border border-border text-foreground font-semibold text-sm hover:bg-muted/50">
            Back to Ward
          </button>
          <button onClick={() => { setActiveScenario(null); setShowDebrief(false); setDecisions([]); setVitals(null); }} className="flex-1 py-3 rounded-lg bg-clinical-teal text-white font-semibold text-sm hover:opacity-90">
            New Scenario
          </button>
        </div>
      </div>
    );
  }

  // 3D Ward view (scenario active)
  if (activeScenario) {
    return (
      <div className="fixed inset-0 bg-clinical-navy">
        <Ward3D patients={patientsForWard} onBedClick={handleBedClick} selectedBed={selectedBed} />

        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-clinical-navy to-transparent p-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => { setActiveScenario(null); setDecisions([]); setVitals(null); }}
              className="flex items-center gap-2 rounded-lg bg-card/80 backdrop-blur-sm px-3 py-1.5 text-xs text-foreground border border-border"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Exit
            </button>
            <div className="rounded-lg bg-card/80 backdrop-blur-sm px-3 py-1.5 text-xs border border-border">
              <span className="text-muted-foreground">Scenario:</span> <span className="font-semibold text-foreground">{activeScenario.name}</span>
            </div>
            {vitals && (
              <div className="rounded-lg bg-card/80 backdrop-blur-sm px-3 py-1.5 border border-border">
                <NEWS2Badge score={activeScenario.initial_news2} size="sm" />
              </div>
            )}
          </div>
        </div>

        {/* Patient panel / decision interface */}
        {showPatientPanel && (
          <div className="absolute bottom-0 left-0 right-0 z-10 bg-card/95 backdrop-blur-xl rounded-t-2xl border-t border-clinical-teal/30 p-4 max-h-[70vh] overflow-y-auto scrollbar-thin animate-slide-up">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-foreground">{activeScenario.patient_name}</h2>
                  <span className="text-xs text-muted-foreground">{activeScenario.patient_age}y · {activeScenario.bed_number}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{activeScenario.patient_condition}</p>
              </div>
              <button onClick={() => setShowPatientPanel(false)} className="p-1.5 rounded-lg hover:bg-muted">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {/* Patient details */}
            <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
              <div className="rounded-lg bg-muted/30 p-2">
                <p className="text-muted-foreground">Comorbidities</p>
                <p className="text-foreground">{activeScenario.patient_comorbidities}</p>
              </div>
              <div className="rounded-lg bg-muted/30 p-2">
                <p className="text-muted-foreground">Medications</p>
                <p className="text-foreground">{activeScenario.patient_medications}</p>
              </div>
              <div className="rounded-lg bg-muted/30 p-2">
                <p className="text-muted-foreground">Allergies</p>
                <p className="text-foreground text-clinical-amber">{activeScenario.patient_allergies}</p>
              </div>
              <div className="rounded-lg bg-muted/30 p-2">
                <p className="text-muted-foreground">Current NEWS2</p>
                <div className="mt-0.5"><NEWS2Badge score={activeScenario.initial_news2} size="sm" /></div>
              </div>
            </div>

            {/* Vitals display */}
            {vitals && (
              <div className="rounded-lg bg-background/50 p-2 mb-3">
                <p className="text-xs font-semibold text-muted-foreground mb-1">CURRENT VITALS</p>
                <div className="grid grid-cols-4 gap-2 text-xs">
                  <div><span className="text-muted-foreground">RR</span> <span className="font-bold text-foreground">{vitals.rr}</span></div>
                  <div><span className="text-muted-foreground">SpO₂</span> <span className="font-bold text-foreground">{vitals.spo2}%</span></div>
                  <div><span className="text-muted-foreground">BP</span> <span className="font-bold text-foreground">{vitals.sbp}</span></div>
                  <div><span className="text-muted-foreground">HR</span> <span className="font-bold text-foreground">{vitals.hr}</span></div>
                </div>
              </div>
            )}

            {/* Decision interface */}
            {currentStep < decisionSteps.length ? (
              <div>
                <p className="text-sm font-semibold text-foreground mb-2">{decisionSteps[currentStep].prompt}</p>
                <div className="space-y-2">
                  {decisionSteps[currentStep].options.map((opt, i) => (
                    <button
                      key={i}
                      onClick={() => handleDecision(opt, currentStep)}
                      className="w-full text-left rounded-lg border border-border bg-muted/30 px-3 py-2.5 text-sm text-foreground hover:border-clinical-teal/50 hover:bg-clinical-teal/5 transition-all"
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {/* Last decision feedback */}
            {decisions.length > 0 && currentStep <= decisionSteps.length && currentStep > 0 && !showDebrief && (
              <div className={`mt-3 rounded-lg p-3 text-xs ${
                decisions[decisions.length - 1].correct ? "bg-clinical-green/10 text-clinical-green" : "bg-clinical-red/10 text-clinical-red"
              }`}>
                {decisions[decisions.length - 1].feedback}
              </div>
            )}

            {/* SK badges */}
            <div className="mt-3 pt-3 border-t border-border">
              <SKBadgeGroup skCodes={activeScenario.sk_codes} poCodes={activeScenario.performance_outcomes} />
            </div>
          </div>
        )}

        {/* Hint to tap a bed */}
        {!showPatientPanel && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 rounded-lg bg-card/80 backdrop-blur-sm px-4 py-2 text-xs text-clinical-teal border border-clinical-teal/30 animate-pulse">
            Tap a bed to begin the scenario →
          </div>
        )}
      </div>
    );
  }

  // Scenario lobby
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-clinical-navy">
        <div className="w-8 h-8 border-2 border-clinical-teal/30 border-t-clinical-teal rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-clinical-navy px-4 pt-6 pb-24 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Stethoscope className="w-5 h-5 text-clinical-teal" />
          3D Ward Simulation
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Interactive scenario-based patient management
        </p>
      </div>

      <div className="space-y-3">
        {scenarios.map((scenario, idx) => (
          <button
            key={idx}
            onClick={() => startScenario(scenario)}
            className="group w-full text-left rounded-xl border border-border bg-card/60 hover:bg-card/80 hover:border-clinical-teal/40 transition-all p-4 animate-slide-up"
            style={{ animationDelay: `${idx * 50}ms` }}
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[10px] font-semibold uppercase rounded px-1.5 py-0.5 ${
                    scenario.difficulty === "guided" ? "bg-clinical-green/15 text-clinical-green" :
                    scenario.difficulty === "intermediate" ? "bg-clinical-amber/15 text-clinical-amber" :
                    "bg-clinical-red/15 text-clinical-red"
                  }`}>
                    {DIFFICULTY_LABELS[scenario.difficulty]}
                  </span>
                  <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Clock className="w-3 h-3" /> {scenario.estimated_duration} min
                  </span>
                </div>
                <h3 className="font-bold text-sm text-foreground">{scenario.name}</h3>
                <p className="text-xs text-muted-foreground mt-1">{scenario.description}</p>
              </div>
              <NEWS2Badge score={scenario.initial_news2} size="sm" />
            </div>

            <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
              <span className="flex items-center gap-1"><User className="w-3 h-3" /> {scenario.patient_name}, {scenario.patient_age}y</span>
              <span className="flex items-center gap-1"><Heart className="w-3 h-3" /> {scenario.bed_number}</span>
            </div>

            <div className="flex items-center justify-between">
              <SKBadgeGroup skCodes={scenario.sk_codes} poCodes={scenario.performance_outcomes} />
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-clinical-teal transition-colors" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
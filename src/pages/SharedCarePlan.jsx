import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { isLoggedIn, getCurrentUser } from "@/lib/clinicalAuth";
import { SKBadgeGroup } from "@/components/SKBadge";
import ClinicalTargetProfiler from "@/components/ClinicalTargetProfiler";
import SBARHandoverCard from "@/components/SBARHandoverCard";
import { SBAR_PATIENTS } from "@/lib/sbarDatabase";
import { scanEntry, TARGET_ORDER } from "@/lib/clinicalTargets";
import { pearsonGrade, pearsonGradeColor } from "@/lib/pearsonGrading";
import {
  ClipboardList, Users, FileText, ShieldAlert, Target, RefreshCw,
  ChevronDown, ChevronUp, Volume2, Save, Send, CheckCircle2, GraduationCap,
} from "lucide-react";

const TEXT_SECTIONS = [
  { key: "handover", label: "Handover Notes (SBAR)", icon: FileText, placeholder: "Document your SBAR handover: Situation, Background, Assessment, Recommendation…" },
  { key: "risk", label: "Risk Profiles", icon: ShieldAlert, placeholder: "Identify and document the patient's risk profiles (falls, pressure, infection, deterioration)…" },
  { key: "goals", label: "SMART Goals", icon: Target, placeholder: "Establish SMART care goals — Specific, Measurable, Achievable, Relevant, Time-bound…" },
  { key: "interventions", label: "Role-Specific Interventions", icon: Users, placeholder: "Document role-specific nursing interventions and MDT actions…" },
];

export default function SharedCarePlan() {
  const navigate = useNavigate();
  const user = getCurrentUser();

  const [caseId, setCaseId] = useState(SBAR_PATIENTS[0].id);
  const [texts, setTexts] = useState({ handover: "", risk: "", goals: "", interventions: "" });
  const [voiceOn, setVoiceOn] = useState(true);
  const [showSBAR, setShowSBAR] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const saveTimerRef = useRef(null);

  useEffect(() => {
    if (!isLoggedIn()) navigate("/login");
  }, [navigate]);

  const combinedText = useMemo(
    () => Object.values(texts).join(" \n "),
    [texts]
  );

  const result = useMemo(() => scanEntry(caseId, combinedText), [caseId, combinedText]);

  // Pearson formative score: 70% from established targets, 30% from keyword coverage
  const pearsonScore = useMemo(() => {
    const targetPart = (result.establishedCount / result.total) * 70;
    let totalMatched = 0, totalMin = 0;
    for (const key of TARGET_ORDER) {
      const t = result.targets[key];
      if (t) { totalMatched += t.matchedCount; totalMin += t.minKeywords; }
    }
    const coveragePart = totalMin > 0 ? Math.min(1, totalMatched / totalMin) * 30 : 0;
    return Math.round(targetPart + coveragePart);
  }, [result]);

  const grade = pearsonGrade(pearsonScore);
  const gradeColor = pearsonGradeColor(pearsonScore);

  const handleChange = (key, val) => {
    setTexts((prev) => ({ ...prev, [key]: val }));
    setSubmitted(false);
  };

  const handleCaseChange = (newId) => {
    setCaseId(newId);
    setSubmitted(false);
  };

  const persist = async (status) => {
    const patient = SBAR_PATIENTS.find((p) => p.id === caseId);
    setSaving(true);
    try {
      await base44.entities.CarePlanSubmission.create({
        student_id: user?.id,
        student_name: user?.full_name,
        type: "handover_sbar",
        title: `Shared Care Plan — ${patient?.name || caseId}`,
        content: JSON.stringify({ caseId, texts, pearsonScore, establishedCount: result.establishedCount }),
        linked_scenario: patient?.name,
        status,
        sk_codes: ["SK3", "SK6", "SK9", "SK11"],
        performance_outcomes: ["PO4", "PO5", "PO9"],
      });
      setSavedMsg(status === "submitted" ? "Submitted — your tutor will be notified." : "Draft saved.");
      if (status === "submitted") setSubmitted(true);
      setTimeout(() => setSavedMsg(""), 3000);
    } catch {
      setSavedMsg("Unable to save — your work is retained on this device.");
      setTimeout(() => setSavedMsg(""), 3000);
    } finally {
      setSaving(false);
    }
  };

  const resetAll = () => {
    setTexts({ handover: "", risk: "", goals: "", interventions: "" });
    setSubmitted(false);
  };

  const selectedPatient = SBAR_PATIENTS.find((p) => p.id === caseId);

  return (
    <div className="min-h-screen bg-clinical-navy pb-28">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-3 py-2.5 sm:px-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <button onClick={() => navigate("/care-planning")} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 shrink-0">←</button>
              <ClipboardList className="w-5 h-5 text-clinical-teal shrink-0" />
              <h1 className="font-heading font-bold text-sm sm:text-base text-slate-800 truncate">Shared Care Plan Workspace</h1>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className={`hidden sm:inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-heading font-bold border ${gradeColor.bg} ${gradeColor.border} ${gradeColor.text}`}>
                <GraduationCap className="w-3.5 h-3.5" /> {grade.label} · {pearsonScore}%
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-3 sm:px-4 pt-4 space-y-4">
        {/* Case selector */}
        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
          <label className="text-[11px] font-heading font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">Active Celebrity Patient Case</label>
          <div className="flex flex-wrap gap-2">
            {SBAR_PATIENTS.map((p) => (
              <button
                key={p.id}
                onClick={() => handleCaseChange(p.id)}
                className={`rounded-lg px-3 py-1.5 text-xs font-heading font-semibold border transition-all ${caseId === p.id ? "bg-clinical-teal text-white border-clinical-teal shadow-sm" : "bg-white text-slate-600 border-slate-200 hover:border-clinical-teal/40"}`}
              >
                {p.name}
              </button>
            ))}
          </div>
          {selectedPatient && (
            <p className="text-[11px] text-slate-500 mt-2 leading-snug">
              <span className="font-semibold text-slate-700">Condition: </span>{selectedPatient.condition}
            </p>
          )}
        </div>

        {/* SBAR handover database toggle */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <button
            onClick={() => setShowSBAR((v) => !v)}
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-clinical-teal" />
              <span className="text-sm font-heading font-bold text-slate-800">Multi-Character SBAR Handover Database</span>
              <span className="text-[10px] text-slate-400">{SBAR_PATIENTS.length} celebrities</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => { e.stopPropagation(); setVoiceOn((v) => !v); }}
                className={`flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-heading font-semibold border ${voiceOn ? "bg-clinical-teal text-white border-clinical-teal" : "bg-white text-slate-500 border-slate-300"}`}
              >
                <Volume2 className="w-3 h-3" /> {voiceOn ? "VOICE ON" : "VOICE OFF"}
              </button>
              {showSBAR ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </div>
          </button>
          {showSBAR && (
            <div className="px-3 pb-3 pt-1 space-y-3 max-h-[480px] overflow-y-auto scrollbar-thin border-t border-slate-100">
              {SBAR_PATIENTS.map((p) => (
                <SBARHandoverCard key={p.id} patient={p} voiceOn={voiceOn} onToggleVoice={() => setVoiceOn(true)} />
              ))}
            </div>
          )}
        </div>

        {/* Clinical Target Profiler */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Target className="w-4 h-4 text-clinical-teal" />
            <h2 className="text-sm font-heading font-bold text-slate-800">Real-Time Clinical Targets Auto-Profiler</h2>
            <span className="text-[10px] text-slate-400">Scans your entries as you type</span>
          </div>
          <ClinicalTargetProfiler caseId={caseId} combinedText={combinedText} />
        </div>

        {/* Text entry workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {TEXT_SECTIONS.map((sec) => (
            <div key={sec.key} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
              <div className="flex items-center gap-1.5 mb-2">
                <sec.icon className="w-4 h-4 text-slate-500" />
                <label className="text-xs font-heading font-bold text-slate-700">{sec.label}</label>
              </div>
              <textarea
                value={texts[sec.key]}
                onChange={(e) => handleChange(sec.key, e.target.value)}
                placeholder={sec.placeholder}
                rows={6}
                className="w-full rounded-lg border border-slate-200 bg-slate-50/50 p-2.5 text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-clinical-teal/50 focus:bg-white resize-y scrollbar-thin"
              />
              <div className="flex items-center justify-between mt-1">
                <span className="text-[10px] text-slate-400">{(texts[sec.key] || "").length} characters</span>
                {texts[sec.key]?.trim() && <CheckCircle2 className="w-3 h-3 text-clinical-green" />}
              </div>
            </div>
          ))}
        </div>

        {/* Pearson formative feedback */}
        <div className={`rounded-xl border p-4 shadow-sm ${gradeColor.bg} ${gradeColor.border}`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <GraduationCap className={`w-5 h-5 ${gradeColor.text}`} />
              <h2 className="text-sm font-heading font-bold text-slate-800">Pearson Formative Performance Assessment</h2>
            </div>
            <div className="text-right">
              <div className={`text-2xl font-display font-bold ${gradeColor.text}`}>{pearsonScore}%</div>
              <div className="text-[10px] text-slate-500">{grade.label}</div>
            </div>
          </div>
          <p className="text-xs text-slate-600 mb-2">{grade.description}</p>
          <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-500 ${gradeColor.bar}`} style={{ width: `${pearsonScore}%` }} />
          </div>
          <div className="mt-2"><SKBadgeGroup skCodes={["SK3", "SK6", "SK9", "SK11"]} poCodes={["PO4", "PO5", "PO9"]} /></div>
        </div>

        {/* Action bar */}
        <div className="flex items-center gap-2">
          <button
            onClick={resetAll}
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-heading font-semibold text-slate-600 hover:bg-slate-50"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Reset
          </button>
          <button
            onClick={() => persist("draft")}
            disabled={saving}
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-heading font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" /> Save Draft
          </button>
          <button
            onClick={() => persist("submitted")}
            disabled={saving || result.establishedCount === 0}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-clinical-teal text-white px-3 py-2 text-xs font-heading font-semibold hover:opacity-90 disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" /> {submitted ? "Submitted" : "Submit to Tutor"}
          </button>
        </div>
        {savedMsg && (
          <div className="text-center text-xs text-slate-500 font-medium animate-fade-in">{savedMsg}</div>
        )}
      </div>
    </div>
  );
}
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, User, Heart, AlertTriangle, ClipboardList, ChevronRight, ChevronDown,
  Shield, Activity, BookOpen, AlertCircle,
  Thermometer, Droplets, Wind, Zap, FileText,
} from "lucide-react";
import { getPatientForBed, news2Band } from "@/lib/wardPatients";
import EHRModal from "@/components/ehr/EHRModal";

const VITAL_CONFIG = [
  { key: "rr", label: "RR", unit: "br/min", icon: Wind, normal: [12, 20] },
  { key: "spo2", label: "SpO₂", unit: "%", icon: Droplets, normal: [96, 100] },
  { key: "sbp", label: "SBP", unit: "mmHg", icon: Activity, normal: [90, 120] },
  { key: "hr", label: "HR", unit: "bpm", icon: Heart, normal: [60, 100] },
  { key: "temp", label: "Temp", unit: "°C", icon: Thermometer, normal: [36.0, 37.5] },
  { key: "cbg", label: "CBG", unit: "mmol/L", icon: Zap, normal: [4.0, 7.8] },
];

function VitalCell({ config, value }) {
  if (value == null) return null;
  const [lo, hi] = config.normal;
  const abnormal = value < lo || value > hi;
  const critical = config.key === "spo2" ? value < 92 : config.key === "sbp" ? value < 90 : false;
  const Icon = config.icon;
  return (
    <div className={`rounded-xl p-2.5 flex flex-col items-center border ${critical ? "bg-clinical-red/10 border-clinical-red/40" : abnormal ? "bg-clinical-amber/10 border-clinical-amber/40" : "bg-slate-50 border-slate-200"}`}>
      <Icon className={`w-3.5 h-3.5 mb-0.5 ${critical ? "text-clinical-red" : abnormal ? "text-clinical-amber" : "text-slate-400"}`} />
      <span className={`text-base font-heading font-bold leading-none ${critical ? "text-clinical-red" : abnormal ? "text-clinical-amber" : "text-slate-800"}`}>{value}</span>
      <span className="text-[8px] text-slate-400 mt-0.5">{config.label}</span>
    </div>
  );
}

export default function WardPatientPanel({ bedDesignation, onClose, onBeginScenario, onLaunchTool }) {
  const patient = getPatientForBed(bedDesignation);
  const [tab, setTab] = useState("overview");
  const [consentGiven, setConsentGiven] = useState(false);
  const [consentExpanded, setConsentExpanded] = useState(false);
  const [showEHR, setShowEHR] = useState(false);

  if (!patient) {
    return (
      <div className="absolute right-0 top-0 h-full w-full sm:max-w-md bg-white shadow-2xl z-30 flex flex-col animate-slide-up">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
          <h2 className="font-heading font-bold text-slate-800">Bed {bedDesignation}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100"><X className="w-4 h-4 text-slate-400" /></button>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center p-6">
            <User className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-500 font-medium">This bed is unoccupied</p>
            <p className="text-xs text-slate-400 mt-1">No patient assigned to Bed {bedDesignation}</p>
          </div>
        </div>
      </div>
    );
  }

  const band = news2Band(patient.initial_news2);
  const vitals = patient.initial_vitals;
  const tabs = [
    { id: "overview", label: "Overview", icon: User },
    { id: "vitals", label: "Vitals", icon: Activity },
    { id: "clinical", label: "Clinical", icon: ClipboardList },
    { id: "learning", label: "Learning", icon: BookOpen },
  ];

  return (
    <div className="absolute right-0 top-0 h-full w-full sm:max-w-md bg-white shadow-2xl z-30 flex flex-col animate-slide-up overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-br from-white via-[#F6F4F8] to-[#E9E6EF] px-4 pt-4 pb-0 border-b border-[#DCD2EE] shadow-[0_10px_30px_-22px_rgba(36,27,58,.45)]">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[9px] font-bold text-[#625D69] uppercase tracking-widest">Bed {patient.bedDesignation} · Suite {patient.suite}</span>
              {patient.safeguarding_flag && (
                <span className="flex items-center gap-1 text-[9px] font-bold bg-clinical-red/20 text-clinical-red px-1.5 py-0.5 rounded uppercase">
                  <Shield className="w-2.5 h-2.5" /> Safeguarding
                </span>
              )}
            </div>
            <h2 className="text-lg font-heading font-bold text-[#15131A]">{patient.name}</h2>
            <p className="text-xs text-[#625D69]">Age {patient.age} · {patient.pronouns} · NHS {patient.nhs_number}</p>
          </div>
          <button onClick={onClose} className="tlevel-3d-panel p-1.5 rounded-xl hover:-translate-y-0.5 mt-0.5">
            <X className="w-4 h-4 text-[#625D69]" />
          </button>
        </div>

        {/* NEWS2 band */}
        <div className={`rounded-t-xl px-3 py-2 flex items-center justify-between ${band.bg} border-t ${band.border} mt-2`}>
          <span className="text-xs font-heading font-bold text-slate-700">NEWS2 Score</span>
          <span className={`text-sm font-heading font-bold ${band.color}`}>{patient.initial_news2} — {band.label}</span>
        </div>

        {/* Tabs */}
        <div className="flex bg-[#F2EEF7] rounded-none border-t border-[#E9E6EF]">
          {tabs.map(t => {
            const Icon = t.icon;
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex-1 flex flex-col items-center gap-0.5 py-2 text-[10px] font-heading font-semibold uppercase tracking-wide transition-all ${tab === t.id ? "bg-white text-[#63479D] shadow-sm" : "text-[#625D69] hover:text-[#15131A] hover:bg-white/60"}`}>
                <Icon className="w-3.5 h-3.5" />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>

            {tab === "overview" && (
              <div className="p-4 space-y-3">
                <InfoBlock label="Condition" value={patient.condition} />
                <InfoBlock label="Admission Reason" value={patient.admission_reason} />
                <InfoBlock label="Comorbidities" value={patient.comorbidities} />
                <InfoBlock label="Allergies" value={patient.allergies} accent={patient.allergies !== "NKDA"} />
                <InfoBlock label="Medications" value={patient.medications} />

                {/* Consent section */}
                <div className="rounded-xl border border-clinical-teal/30 bg-clinical-teal/5 p-3">
                  <button className="w-full flex items-center justify-between" onClick={() => setConsentExpanded(!consentExpanded)}>
                    <span className="text-xs font-heading font-bold text-clinical-teal uppercase tracking-wide">Obtaining Consent</span>
                    {consentExpanded ? <ChevronDown className="w-4 h-4 text-clinical-teal" /> : <ChevronRight className="w-4 h-4 text-clinical-teal" />}
                  </button>
                  {consentExpanded && (
                    <div className="mt-2 space-y-2">
                      <p className="text-xs text-slate-600 italic leading-relaxed">"{patient.consent_phrase}"</p>
                      <button onClick={() => setConsentGiven(true)}
                        className={`w-full py-2 rounded-lg text-xs font-heading font-semibold transition-all ${consentGiven ? "bg-clinical-green text-white" : "bg-clinical-teal text-white hover:opacity-90"}`}>
                        {consentGiven ? "✓ Consent Obtained" : "Record Verbal Consent Given"}
                      </button>
                      {!consentGiven && <p className="text-[10px] text-clinical-amber text-center">You must obtain consent before performing any assessment</p>}
                    </div>
                  )}
                </div>

                {/* Risk flags */}
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { flag: patient.sskin_risk, label: "SSKIN Risk", icon: Shield, color: "text-orange-600 bg-orange-50 border-orange-200" },
                    { flag: patient.falls_risk, label: "Falls Risk", icon: AlertTriangle, color: "text-clinical-amber bg-clinical-amber/10 border-clinical-amber/30" },
                    { flag: patient.pressure_ulcer_risk, label: "Pressure Ulcer Risk", icon: AlertCircle, color: "text-clinical-red bg-clinical-red/10 border-clinical-red/30" },
                    { flag: patient.safeguarding_flag, label: "Safeguarding", icon: Shield, color: "text-clinical-red bg-clinical-red/10 border-clinical-red/30" },
                  ].filter(f => f.flag).map((f, i) => {
                    const Icon = f.icon;
                    return (
                      <div key={i} className={`rounded-lg border px-3 py-2 flex items-center gap-2 ${f.color}`}>
                        <Icon className="w-3.5 h-3.5 shrink-0" />
                        <span className="text-xs font-semibold">{f.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {tab === "vitals" && (
              <div className="p-4 space-y-4">
                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Initial Observations on Admission</p>
                <div className="grid grid-cols-3 gap-2">
                  {VITAL_CONFIG.map(vc => vitals[vc.key] != null && <VitalCell key={vc.key} config={vc} value={vitals[vc.key]} />)}
                </div>
                <div className={`rounded-xl border p-3 ${band.border} ${band.bg}`}>
                  <p className="text-xs font-heading font-bold text-slate-700 mb-1">NEWS2 Aggregate</p>
                  <div className="flex items-center justify-between">
                    <span className={`text-2xl font-heading font-bold ${band.color}`}>{patient.initial_news2}</span>
                    <div className="text-right">
                      <p className={`text-sm font-heading font-bold ${band.color}`}>{band.label}</p>
                      {patient.initial_news2 >= 5 && <p className="text-[10px] text-clinical-red">→ SBAR escalation required</p>}
                      {patient.initial_news2 >= 7 && <p className="text-[10px] text-clinical-red font-bold">→ URGENT — Continuous monitoring</p>}
                    </div>
                  </div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">AVPU Scale</p>
                  <div className="grid grid-cols-4 gap-1">
                    {["A","V","P","U"].map(l => (
                      <div key={l} className={`rounded-lg p-2 text-center text-xs font-heading font-bold border ${vitals.avpu === l ? "bg-clinical-teal text-white border-clinical-teal" : "bg-white text-slate-400 border-slate-200"}`}>{l}</div>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1.5 text-center">
                    {vitals.avpu === "A" ? "Alert — fully conscious" : vitals.avpu === "V" ? "Voice — responds to voice" : vitals.avpu === "P" ? "Pain — responds to pain only" : vitals.avpu === "C" ? "Confused (C = Confusion variant)" : "Unresponsive"}
                  </p>
                </div>
              </div>
            )}

            {tab === "clinical" && (
              <div className="p-4 space-y-3">
                <div className="rounded-xl border border-clinical-amber/30 bg-clinical-amber/5 p-3">
                  <p className="text-[10px] font-bold text-clinical-amber uppercase tracking-wider mb-1.5">⚠ Clinical Notes</p>
                  <p className="text-xs text-slate-700 leading-relaxed">{patient.clinical_notes}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Spec-Aligned Assessment Focus</p>
                  <div className="space-y-1.5">
                    {patient.assessment_focus.map((af, i) => (
                      <div key={i} className="flex items-start gap-2 rounded-lg border border-slate-200 bg-white p-2.5">
                        <span className="text-[9px] font-bold bg-clinical-teal/10 text-clinical-teal px-1.5 py-0.5 rounded shrink-0 mt-0.5">{af.code}</span>
                        <span className="text-xs text-slate-700">{af.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Patient Persona</p>
                  <p className="text-xs text-slate-600 italic leading-relaxed">"{patient.persona}"</p>
                </div>
              </div>
            )}

            {tab === "learning" && (
              <div className="p-4 space-y-3">
                <div>
                  <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Learning Objectives</p>
                  <div className="space-y-2">
                    {patient.learning_objectives.map((obj, i) => (
                      <div key={i} className="flex items-start gap-2.5 rounded-lg bg-clinical-teal/5 border border-clinical-teal/20 p-2.5">
                        <span className="text-[9px] font-bold bg-clinical-teal text-white px-1.5 py-0.5 rounded-full shrink-0 mt-0.5">{i + 1}</span>
                        <span className="text-xs text-slate-700 leading-relaxed">{obj}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Debrief Rationale</p>
                  <p className="text-xs text-slate-600 leading-relaxed">{patient.debrief_rationale}</p>
                </div>
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer actions */}
      <div className="border-t border-slate-200 bg-white p-3 space-y-2">
        <button
          onClick={() => setShowEHR(true)}
          className="w-full py-2.5 rounded-xl bg-slate-800 text-white text-xs font-heading font-semibold hover:bg-slate-700 flex items-center justify-center gap-1.5"
        >
          <FileText className="w-3.5 h-3.5" /> Open Electronic Health Record
        </button>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-600 text-xs font-heading font-semibold hover:bg-slate-50">
            Close
          </button>
          <button
            onClick={() => { if (consentGiven) onBeginScenario?.(patient); }}
            disabled={!consentGiven}
            className="flex-1 py-2.5 rounded-xl bg-clinical-teal text-white text-xs font-heading font-semibold hover:opacity-90 disabled:opacity-40 flex items-center justify-center gap-1.5"
            title={!consentGiven ? "Obtain patient consent first" : ""}
          >
            <ClipboardList className="w-3.5 h-3.5" />
            {consentGiven ? "Begin Assessment" : "Consent Required"}
          </button>
        </div>
      </div>

      {/* EHR Modal */}
      {showEHR && (
        <EHRModal
          patient={patient}
          onClose={() => setShowEHR(false)}
          onLaunchTool={onLaunchTool}
        />
      )}
    </div>
  );
}

function InfoBlock({ label, value, accent }) {
  return (
    <div>
      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">{label}</p>
      <p className={`text-xs leading-relaxed ${accent ? "text-clinical-red font-semibold" : "text-slate-700"}`}>{value}</p>
    </div>
  );
}
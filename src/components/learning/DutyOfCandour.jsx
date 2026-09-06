import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Scale, AlertTriangle, CheckCircle2, XCircle, RotateCcw,
  BookOpen, FileWarning, ShieldCheck, Award,
} from "lucide-react";
import { DUTY_OF_CANDOUR_SCENARIOS } from "@/lib/learningData";

export default function DutyOfCandour() {
  const [selectedId, setSelectedId] = useState(DUTY_OF_CANDOUR_SCENARIOS[0].id);
  const [selectedActions, setSelectedActions] = useState([]);
  const [submitted, setSubmitted] = useState(false);

  const scenario = DUTY_OF_CANDOUR_SCENARIOS.find(s => s.id === selectedId);

  const handleSelect = (id) => {
    setSelectedId(id);
    setSelectedActions([]);
    setSubmitted(false);
  };

  const toggleAction = (idx) => {
    if (submitted) return;
    setSelectedActions(prev => prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]);
  };

  const handleSubmit = () => setSubmitted(true);
  const reset = () => { setSelectedActions([]); setSubmitted(false); };

  const correctSelected = scenario.correctActions.filter((a, i) => a.correct && selectedActions.includes(i)).length;
  const totalCorrect = scenario.correctActions.filter(a => a.correct).length;
  const incorrectSelected = selectedActions.filter(idx => !scenario.correctActions[idx].correct).length;
  const score = Math.max(0, Math.round((correctSelected / totalCorrect) * 100) - incorrectSelected * 20);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-indigo-800 rounded-2xl p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-indigo-700 flex items-center justify-center">
          <Scale className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="font-heading font-bold text-white text-lg">Duty of Candour</h2>
          <p className="text-xs text-indigo-100">Apply CQC Regulation 20 to patient safety incidents: recognise, be open, apologise, and report (Area 6 — Legislation).</p>
        </div>
      </div>

      {/* Legal context banner */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3 flex items-start gap-2">
        <BookOpen className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
        <p className="text-[11px] text-slate-700 leading-relaxed">
          <strong className="text-indigo-700">CQC Regulation 20 — Duty of Candour:</strong> Every registered provider must be open and transparent with patients when things go wrong. Statutory duty applies to notifiable safety incidents (resulting in death, severe, moderate, or prolonged harm). All registered professionals also have a personal professional duty (NMC Code 2018).
        </p>
      </div>

      {/* Scenario selector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">
        {DUTY_OF_CANDOUR_SCENARIOS.map(s => (
          <button key={s.id} onClick={() => handleSelect(s.id)}
            className={`text-left rounded-xl border p-3 transition-all ${selectedId === s.id ? "border-indigo-500 bg-indigo-50" : "border-slate-200 bg-white hover:bg-slate-50"}`}>
            <div className="flex items-center gap-2 mb-1">
              <FileWarning className={`w-4 h-4 ${selectedId === s.id ? "text-indigo-600" : "text-slate-400"}`} />
              <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wide">Incident</span>
            </div>
            <p className="font-heading font-bold text-xs text-slate-800 leading-tight">{s.title}</p>
          </button>
        ))}
      </div>

      {/* Scenario + actions */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="bg-slate-800 px-4 py-3">
          <h3 className="font-heading font-bold text-white text-sm">{scenario.title}</h3>
        </div>
        <div className="p-4 space-y-4">
          {/* Incident summary */}
          <div className="rounded-xl border border-clinical-amber/30 bg-clinical-amber/5 p-3">
            <div className="flex items-start gap-2 mb-1">
              <AlertTriangle className="w-4 h-4 text-clinical-amber shrink-0 mt-0.5" />
              <p className="text-[10px] font-semibold text-clinical-amber uppercase tracking-wide">Incident Summary</p>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed">{scenario.summary}</p>
          </div>

          {/* Severity */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 font-semibold">Severity:</span>
            <span className="bg-clinical-red/10 text-clinical-red px-2 py-1 rounded-md font-semibold">{scenario.severity}</span>
            {scenario.isNotifiable && (
              <span className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded-md font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Notifiable — Statutory Duty Applies
              </span>
            )}
          </div>

          {/* Actions */}
          <div>
            <p className="text-xs font-heading font-bold text-slate-800 mb-2">Select the correct actions for this incident:</p>
            <div className="space-y-2">
              {scenario.correctActions.map((action, idx) => {
                const isSelected = selectedActions.includes(idx);
                const showState = submitted;
                return (
                  <button key={idx} onClick={() => toggleAction(idx)} disabled={submitted}
                    className={`w-full text-left rounded-xl border p-3 transition-all ${
                      showState
                        ? action.correct
                          ? isSelected ? "border-clinical-green bg-clinical-green/5" : "border-slate-200 bg-slate-50 opacity-60"
                          : isSelected ? "border-clinical-red bg-clinical-red/5" : "border-slate-200 bg-slate-50"
                        : isSelected ? "border-indigo-500 bg-indigo-50" : "border-slate-200 bg-white hover:bg-slate-50"
                    }`}>
                    <div className="flex items-start gap-2">
                      <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 ${
                        showState
                          ? action.correct ? (isSelected ? "bg-clinical-green" : "border border-slate-300") : (isSelected ? "bg-clinical-red" : "border border-slate-300")
                          : isSelected ? "bg-indigo-600" : "border border-slate-300"
                      }`}>
                        {showState && isSelected ? (action.correct ? <CheckCircle2 className="w-3.5 h-3.5 text-white" /> : <XCircle className="w-3.5 h-3.5 text-white" />) : isSelected ? <CheckCircle2 className="w-3.5 h-3.5 text-white" /> : null}
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-slate-700 leading-relaxed">{action.action}</p>
                        {showState && (
                          <p className={`text-[11px] mt-1 italic ${action.correct ? "text-clinical-green" : "text-clinical-red"}`}>{action.feedback}</p>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Score */}
          <AnimatePresence>
            {submitted && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <div className={`rounded-xl p-4 ${score >= 80 ? "bg-clinical-green/10 border border-clinical-green/30" : score >= 50 ? "bg-clinical-amber/10 border border-clinical-amber/30" : "bg-clinical-red/10 border border-clinical-red/30"}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Award className={`w-5 h-5 ${score >= 80 ? "text-clinical-green" : score >= 50 ? "text-clinical-amber" : "text-clinical-red"}`} />
                      <p className="font-heading font-bold text-sm text-slate-800">Duty of Candour Score</p>
                    </div>
                    <p className={`text-3xl font-heading font-bold ${score >= 80 ? "text-clinical-green" : score >= 50 ? "text-clinical-amber" : "text-clinical-red"}`}>{score}%</p>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    {score >= 80 ? "Excellent — you have correctly applied the Duty of Candour principles." : score >= 50 ? "Partially correct — review the feedback above and the legal basis below." : "Significant gaps — revisit CQC Regulation 20 and the NMC Code."}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Legal basis */}
          {submitted && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl border border-indigo-200 bg-indigo-50 p-3">
              <div className="flex items-start gap-2">
                <Scale className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] font-semibold text-indigo-600 uppercase tracking-wide mb-1">Legal & Professional Basis</p>
                  <p className="text-[11px] text-slate-700 leading-relaxed">{scenario.legalBasis}</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            {!submitted ? (
              <button onClick={handleSubmit} disabled={selectedActions.length === 0}
                className="flex-1 py-2.5 rounded-lg bg-indigo-700 text-white text-xs font-heading font-semibold hover:opacity-90 disabled:opacity-40 flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> Submit Responses
              </button>
            ) : (
              <button onClick={reset}
                className="flex-1 py-2.5 rounded-lg border border-slate-300 text-slate-700 text-xs font-heading font-semibold hover:bg-slate-50 flex items-center justify-center gap-2">
                <RotateCcw className="w-4 h-4" /> Review Scenario Again
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clipboard, User, Target, CheckCircle2, XCircle, RotateCcw, Award, Lightbulb,
} from "lucide-react";
import { CARE_PERSONAS } from "@/lib/learningData";

export default function CarePlanPersona() {
  const [selectedId, setSelectedId] = useState(CARE_PERSONAS[0].id);
  const [selectedGoals, setSelectedGoals] = useState([]);
  const [submitted, setSubmitted] = useState(false);

  const persona = CARE_PERSONAS.find(p => p.id === selectedId);

  const toggleGoal = (idx) => {
    if (submitted) return;
    setSelectedGoals(prev => prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]);
  };

  const handleSelectPersona = (id) => {
    setSelectedId(id);
    setSelectedGoals([]);
    setSubmitted(false);
  };

  const handleSubmit = () => setSubmitted(true);

  const handleReset = () => { setSelectedGoals([]); setSubmitted(false); };

  const correctGoals = persona.correctGoals.map((g, i) => ({ ...g, idx: i })).filter(g => g.smart);
  const correctSelected = correctGoals.filter(g => selectedGoals.includes(g.idx)).length;
  const totalCorrect = correctGoals.length;
  const incorrectSelected = selectedGoals.filter(idx => !persona.correctGoals[idx].smart).length;
  const score = totalCorrect > 0 ? Math.round((correctSelected / totalCorrect) * 100) - (incorrectSelected * 15) : 0;
  const finalScore = Math.max(0, score);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-violet-700 rounded-2xl p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center">
          <Clipboard className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="font-heading font-bold text-white text-lg">Care Plan Persona Builder</h2>
          <p className="text-xs text-violet-100">Build person-centred care plans using the nursing process and SMART goal framework for diverse patient personas.</p>
        </div>
      </div>

      {/* Persona selector */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        {CARE_PERSONAS.map(p => (
          <button key={p.id} onClick={() => handleSelectPersona(p.id)}
            className={`text-left rounded-xl border p-3 transition-all ${selectedId === p.id ? "border-violet-500 bg-violet-50" : "border-slate-200 bg-white hover:bg-slate-50"}`}>
            <div className="flex items-center gap-2 mb-1">
              <User className="w-4 h-4 text-violet-500" />
              <span className="text-[10px] font-bold text-violet-600 uppercase tracking-wide">Persona</span>
            </div>
            <p className="font-heading font-bold text-xs text-slate-800 leading-tight">{p.name}</p>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Persona brief */}
        <div className="space-y-3">
          <div className="bg-white rounded-2xl border border-slate-200 p-4">
            <div className="flex items-center gap-2 mb-3">
              <User className="w-4 h-4 text-violet-500" />
              <h3 className="font-heading font-bold text-sm text-slate-800">{persona.name}</h3>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-[10px] font-semibold text-violet-600 uppercase tracking-wide mb-1">Clinical Scenario</p>
                <p className="text-xs text-slate-600 leading-relaxed">{persona.scenario}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-violet-600 uppercase tracking-wide mb-1">Background</p>
                <p className="text-xs text-slate-600 leading-relaxed">{persona.background}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-violet-600 uppercase tracking-wide mb-1">Person-Centred Notes</p>
                <p className="text-xs text-slate-600 leading-relaxed">{persona.culturalNotes}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-violet-600 uppercase tracking-wide mb-1">Identified Needs</p>
                <div className="flex flex-wrap gap-1.5">
                  {persona.needs.map(n => (
                    <span key={n} className="text-[11px] bg-violet-50 text-violet-700 border border-violet-200 px-2 py-1 rounded-md">{n}</span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-violet-600 uppercase tracking-wide mb-1">Nursing Diagnosis</p>
                <p className="text-xs text-slate-600 leading-relaxed italic border-l-2 border-violet-300 pl-2">{persona.nursingDiagnosis}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Goal builder */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-4 h-4 text-clinical-teal" />
            <h3 className="font-heading font-bold text-sm text-slate-800">Select SMART Goals</h3>
          </div>
          <p className="text-[11px] text-slate-500 mb-3">Select the goals that follow the SMART framework (Specific, Measurable, Achievable, Relevant, Time-bound). Avoid vague or unrealistic goals.</p>

          <div className="space-y-2">
            {persona.correctGoals.map((goal, idx) => {
              const isSelected = selectedGoals.includes(idx);
              const isCorrect = goal.smart;
              const showResult = submitted;
              return (
                <button key={idx} onClick={() => toggleGoal(idx)} disabled={submitted}
                  className={`w-full text-left rounded-xl border p-3 transition-all ${showResult
                    ? isCorrect
                      ? isSelected ? "border-clinical-green bg-clinical-green/5" : "border-slate-200 bg-slate-50 opacity-60"
                      : isSelected ? "border-clinical-red bg-clinical-red/5" : "border-slate-200 bg-slate-50"
                    : isSelected ? "border-clinical-teal bg-clinical-teal/5" : "border-slate-200 bg-white hover:bg-slate-50"}`}>
                  <div className="flex items-start gap-2">
                    <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 ${isSelected ? (showResult ? (isCorrect ? "bg-clinical-green" : "bg-clinical-red") : "bg-clinical-teal") : "border border-slate-300"}`}>
                      {showResult && isSelected ? (isCorrect ? <CheckCircle2 className="w-3.5 h-3.5 text-white" /> : <XCircle className="w-3.5 h-3.5 text-white" />) : isSelected ? <CheckCircle2 className="w-3.5 h-3.5 text-white" /> : null}
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed flex-1">{goal.text}</p>
                    {showResult && !isSelected && isCorrect && (
                      <span className="text-[9px] font-bold text-clinical-green bg-clinical-green/10 px-1.5 py-0.5 rounded">MISS</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Score */}
          <AnimatePresence>
            {submitted && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4">
                <div className={`rounded-xl p-4 ${finalScore >= 80 ? "bg-clinical-green/10 border border-clinical-green/30" : finalScore >= 50 ? "bg-clinical-amber/10 border border-clinical-amber/30" : "bg-clinical-red/10 border border-clinical-red/30"}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Award className={`w-5 h-5 ${finalScore >= 80 ? "text-clinical-green" : finalScore >= 50 ? "text-clinical-amber" : "text-clinical-red"}`} />
                    <p className="font-heading font-bold text-sm text-slate-800">Care Plan Quality Score</p>
                  </div>
                  <p className={`text-3xl font-heading font-bold ${finalScore >= 80 ? "text-clinical-green" : finalScore >= 50 ? "text-clinical-amber" : "text-clinical-red"}`}>{finalScore}%</p>
                  <p className="text-[11px] text-slate-600 mt-1">
                    {finalScore >= 80 ? "Excellent — all SMART goals correctly identified." : finalScore >= 50 ? "Good start — review the goals you missed or incorrectly selected." : "Needs improvement — revisit the SMART criteria."}
                  </p>
                  <div className="mt-2 flex items-start gap-2 text-[11px] text-slate-600 bg-white/50 rounded-lg p-2">
                    <Lightbulb className="w-3.5 h-3.5 text-clinical-amber shrink-0 mt-0.5" />
                    <span><strong>SMART</strong> = Specific, Measurable, Achievable, Relevant, Time-bound. Vague goals like "feel better" or unrealistic goals like "cured" fail the framework.</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Actions */}
          <div className="flex gap-2 mt-4">
            {!submitted ? (
              <button onClick={handleSubmit} disabled={selectedGoals.length === 0}
                className="flex-1 py-2.5 rounded-lg bg-clinical-teal text-white text-xs font-heading font-semibold hover:opacity-90 disabled:opacity-40 flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> Submit Care Plan
              </button>
            ) : (
              <button onClick={handleReset}
                className="flex-1 py-2.5 rounded-lg border border-slate-300 text-slate-700 text-xs font-heading font-semibold hover:bg-slate-50 flex items-center justify-center gap-2">
                <RotateCcw className="w-4 h-4" /> Try Again
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Award, CheckCircle, AlertTriangle, RefreshCw, Stethoscope, FileText } from "lucide-react";
import { CHRONIC_CONDITIONS, CONDITION_QUIZ } from "@/lib/learningData";

export default function PathophysiologyMatcher() {
  const [questionIdx, setQuestionIdx] = useState(0);
  const [selected, setSelected] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [completed, setCompleted] = useState([]);

  const question = CONDITION_QUIZ[questionIdx];
  const isLast = questionIdx === CONDITION_QUIZ.length - 1;

  const handleSelect = (conditionId) => {
    if (answered) return;
    setSelected(conditionId);
    setAnswered(true);
    if (conditionId === question.correctConditionId) {
      setScore(s => s + 1);
      if (!completed.includes(questionIdx)) setCompleted(prev => [...prev, questionIdx]);
    }
  };

  const handleNext = () => {
    if (isLast) {
      setQuestionIdx(0);
    } else {
      setQuestionIdx(i => i + 1);
    }
    setSelected(null);
    setAnswered(false);
  };

  const handleReset = () => {
    setQuestionIdx(0); setSelected(null); setAnswered(false); setScore(0); setCompleted([]);
  };

  const progress = Math.round((completed.length / CONDITION_QUIZ.length) * 100);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 sm:p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center">
          <Stethoscope className="w-5 h-5 text-violet-600" />
        </div>
        <div className="flex-1">
          <span className="bg-violet-50 text-violet-700 text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider">Area 9 · Pathophysiology</span>
          <h2 className="text-lg sm:text-xl font-heading font-bold text-slate-800 mt-0.5">Pathophysiology Matcher</h2>
        </div>
        <div className="text-right">
          <div className="text-2xl font-heading font-bold text-slate-800">{score}<span className="text-slate-400 text-sm">/{CONDITION_QUIZ.length}</span></div>
          <div className="text-[10px] text-slate-400 uppercase">Score</div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-slate-500">Question {questionIdx + 1} of {CONDITION_QUIZ.length}</span>
          <span className="text-xs text-slate-500">{progress}% complete</span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <motion.div className="h-full bg-clinical-teal rounded-full" initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.3 }} />
        </div>
      </div>

      {/* Scenario card */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-4">
        <div className="flex items-start gap-2 mb-2">
          <FileText className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
          <p className="text-sm text-slate-700 leading-relaxed">{question.symptomText}</p>
        </div>
        <div className="flex items-start gap-2 pt-2 border-t border-slate-200">
          <Stethoscope className="w-4 h-4 text-clinical-teal shrink-0 mt-0.5" />
          <p className="text-sm text-slate-700 leading-relaxed font-medium">{question.nursingCareText}</p>
        </div>
      </div>

      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Which condition does this describe?</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
        {CHRONIC_CONDITIONS.map((condition) => {
          const isCorrect = condition.id === question.correctConditionId;
          const isSelected = selected === condition.id;
          let stateClass = "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50";
          if (answered) {
            if (isCorrect) stateClass = "border-clinical-green/50 bg-clinical-green/5";
            else if (isSelected) stateClass = "border-clinical-red/50 bg-clinical-red/5";
            else stateClass = "border-slate-200 bg-slate-50 opacity-60";
          }
          return (
            <button key={condition.id} onClick={() => handleSelect(condition.id)} disabled={answered}
              className={`text-left p-3 rounded-xl border transition-all ${stateClass}`}>
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold text-slate-800">{condition.name}</p>
                {answered && isCorrect && <CheckCircle className="w-4 h-4 text-clinical-green shrink-0" />}
                {answered && isSelected && !isCorrect && <AlertTriangle className="w-4 h-4 text-clinical-red shrink-0" />}
              </div>
              {answered && (isCorrect || isSelected) && (
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{condition.definition}</p>
              )}
            </button>
          );
        })}
      </div>

      <AnimatePresence>
        {answered && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden">
            <div className={`p-3 rounded-xl border ${selected === question.correctConditionId ? "bg-clinical-green/10 border-clinical-green/30" : "bg-amber-50 border-amber-200"} mb-3`}>
              <p className="text-xs text-slate-700 leading-relaxed">
                <span className="font-bold">{selected === question.correctConditionId ? "✓ Correct! " : "⚠️ Not quite. "}</span>
                {question.rationale}
              </p>
            </div>
            <div className="flex gap-2">
              <button onClick={handleNext} className="flex-1 py-2.5 rounded-xl bg-clinical-teal text-white text-sm font-heading font-semibold hover:opacity-90 transition-opacity">
                {isLast ? "Restart Quiz" : "Next Question →"}
              </button>
              <button onClick={handleReset} className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-600 text-sm font-heading font-semibold hover:bg-slate-200 transition-colors flex items-center gap-1.5">
                <RefreshCw className="w-4 h-4" /> Reset
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {completed.length === CONDITION_QUIZ.length && !answered && (
        <div className="bg-clinical-teal/10 border border-clinical-teal/30 rounded-xl p-4 flex items-center gap-3">
          <Award className="w-8 h-8 text-clinical-teal" />
          <div>
            <p className="text-sm font-bold text-slate-800">All questions completed!</p>
            <p className="text-xs text-slate-500">Final score: {score}/{CONDITION_QUIZ.length}. {score === CONDITION_QUIZ.length ? "Perfect understanding of pathophysiology!" : "Review the rationale and try again."}</p>
          </div>
        </div>
      )}
    </div>
  );
}
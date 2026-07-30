import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  HeartPulse, Cigarette, Scale, Syringe, SearchCheck, Brain,
  CheckCircle2, XCircle, RotateCcw, ChevronRight, Globe, Users, TrendingDown,
} from "lucide-react";
import { PUBLIC_HEALTH_TOPICS } from "@/lib/learningData";

const TOPIC_ICONS = { Cigarette, Scale, Syringe, SearchCheck, Brain };
const CATEGORY_COLORS = {
  "Health Promotion": { bg: "bg-rose-50", text: "text-rose-600", border: "border-rose-200", header: "bg-rose-600" },
  "Screening & Prevention": { bg: "bg-blue-50", text: "text-blue-600", border: "border-blue-200", header: "bg-blue-600" },
};

export default function PublicHealthAdvisor() {
  const [selectedId, setSelectedId] = useState(PUBLIC_HEALTH_TOPICS[0].id);
  const [quizAnswer, setQuizAnswer] = useState(null);
  const [showResult, setShowResult] = useState(false);

  const topic = PUBLIC_HEALTH_TOPICS.find(t => t.id === selectedId);
  const colors = CATEGORY_COLORS[topic.category];

  const handleSelect = (id) => {
    setSelectedId(id);
    setQuizAnswer(null);
    setShowResult(false);
  };

  const handleAnswer = (idx) => {
    setQuizAnswer(idx);
    setShowResult(true);
  };

  const reset = () => { setQuizAnswer(null); setShowResult(false); };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-rose-700 rounded-2xl p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-rose-600 flex items-center justify-center">
          <HeartPulse className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="font-heading font-bold text-white text-lg">Public Health Advisor</h2>
          <p className="text-xs text-rose-100">Explore UK health promotion, screening programmes, immunisation, and the wider determinants of health (Area 4).</p>
        </div>
      </div>

      {/* Topic selector */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-2">
        {PUBLIC_HEALTH_TOPICS.map(t => {
          const Icon = TOPIC_ICONS[t.icon] || HeartPulse;
          return (
            <button key={t.id} onClick={() => handleSelect(t.id)}
              className={`text-left rounded-xl border p-3 transition-all ${selectedId === t.id ? `${colors.border} ${colors.bg}` : "border-slate-200 bg-white hover:bg-slate-50"}`}>
              <Icon className={`w-5 h-5 mb-1 ${selectedId === t.id ? colors.text : "text-slate-400"}`} />
              <p className="font-heading font-bold text-[11px] text-slate-800 leading-tight">{t.title}</p>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Topic detail */}
        <div className="space-y-3">
          <div className={`rounded-2xl border ${colors.border} bg-white overflow-hidden`}>
            <div className={`${colors.header} px-4 py-3`}>
              <p className="text-[10px] font-bold text-white/80 uppercase tracking-wide">{topic.category}</p>
              <h3 className="font-heading font-bold text-white text-lg">{topic.title}</h3>
            </div>
            <div className="p-4 space-y-3">
              <p className="text-sm text-slate-700 leading-relaxed">{topic.overview}</p>

              <div>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <TrendingDown className="w-3.5 h-3.5 text-slate-500" />
                  <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Determinants of Health</p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {topic.determinants.map(d => (
                    <span key={d} className="text-[11px] bg-slate-100 text-slate-600 px-2 py-1 rounded-md">{d}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Interventions */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Globe className="w-4 h-4 text-rose-500" />
              <h3 className="font-heading font-bold text-sm text-slate-800">Evidence-Based Interventions</h3>
            </div>
            <div className="space-y-2">
              {topic.interventions.map((iv, idx) => (
                <div key={idx} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="font-heading font-bold text-xs text-slate-800 mb-0.5">{iv.name}</p>
                  <p className="text-[11px] text-slate-600 leading-relaxed">{iv.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column: screening + quiz */}
        <div className="space-y-3">
          {topic.screening && (
            <div className="bg-white rounded-2xl border border-slate-200 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-4 h-4 text-blue-500" />
                <h3 className="font-heading font-bold text-sm text-slate-800">{topic.screening.title}</h3>
              </div>
              <div className="space-y-1.5">
                {topic.screening.items.map((item, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs border-b border-slate-100 last:border-0 pb-1.5 last:pb-0">
                    <span className="font-semibold text-slate-700 w-28 shrink-0">{item.age}</span>
                    <span className="text-slate-600 flex-1">{item.vaccines}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quiz */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="w-4 h-4 text-clinical-teal" />
              <h3 className="font-heading font-bold text-sm text-slate-800">Knowledge Check</h3>
            </div>
            <p className="text-xs text-slate-700 mb-3 leading-relaxed">{topic.quiz.question}</p>
            <div className="space-y-2">
              {topic.quiz.options.map((opt, idx) => {
                const isSelected = quizAnswer === idx;
                const isCorrect = idx === topic.quiz.correctAnswer;
                const showState = showResult && (isSelected || isCorrect);
                return (
                  <button key={idx} onClick={() => handleAnswer(idx)} disabled={showResult}
                    className={`w-full text-left rounded-xl border p-3 text-xs transition-all ${
                      showState
                        ? isCorrect ? "border-clinical-green bg-clinical-green/5" : "border-clinical-red bg-clinical-red/5"
                        : "border-slate-200 bg-slate-50 hover:bg-slate-100"
                    } disabled:cursor-default`}>
                    <div className="flex items-center gap-2">
                      <span className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${showState ? (isCorrect ? "bg-clinical-green text-white" : "bg-clinical-red text-white") : "border border-slate-300"}`}>
                        {showState && (isCorrect ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />)}
                      </span>
                      <span className="text-slate-700">{opt}</span>
                    </div>
                  </button>
                );
              })}
            </div>
            <AnimatePresence>
              {showResult && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3">
                  <div className={`rounded-lg p-3 ${quizAnswer === topic.quiz.correctAnswer ? "bg-clinical-green/10 border border-clinical-green/30" : "bg-clinical-amber/10 border border-clinical-amber/30"}`}>
                    <p className="text-[11px] text-slate-700 leading-relaxed">
                      <strong>{quizAnswer === topic.quiz.correctAnswer ? "Correct. " : "Not quite. "}</strong>
                      {topic.quiz.rationale}
                    </p>
                  </div>
                  <button onClick={reset} className="mt-2 text-[11px] font-semibold text-clinical-teal hover:underline flex items-center gap-1">
                    <RotateCcw className="w-3 h-3" /> Try again
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
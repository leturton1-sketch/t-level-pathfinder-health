import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ListChecks, Hand, Activity, FlaskConical, Bed, ChevronUp, ChevronDown,
  CheckCircle2, XCircle, RotateCcw, BookOpen, Info,
} from "lucide-react";
import { SOP_PROCEDURES } from "@/lib/learningData";

const PROC_ICONS = { Hand, Activity, FlaskConical, Bed };

export default function SOPMaster() {
  const [selectedId, setSelectedId] = useState(SOP_PROCEDURES[0].id);
  const [shuffled, setShuffled] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  const procedure = SOP_PROCEDURES.find(p => p.id === selectedId);
  const current = shuffled || procedure.steps.map((step, i) => ({ text: step, correctIdx: i }));

  const shuffle = () => {
    const arr = procedure.steps.map((step, i) => ({ text: step, correctIdx: i }));
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    setShuffled(arr);
    setSubmitted(false);
  };

  const handleSelect = (id) => {
    setSelectedId(id);
    setShuffled(null);
    setSubmitted(false);
  };

  const moveStep = (idx, dir) => {
    if (submitted) return;
    const newOrder = [...current];
    const swap = dir === "up" ? idx - 1 : idx + 1;
    if (swap < 0 || swap >= newOrder.length) return;
    [newOrder[idx], newOrder[swap]] = [newOrder[swap], newOrder[idx]];
    setShuffled(newOrder);
  };

  const verify = () => setSubmitted(true);

  const reset = () => {
    setShuffled(null);
    setSubmitted(false);
  };

  const allCorrect = current.every((step, idx) => step.correctIdx === idx);
  const correctCount = current.filter((step, idx) => step.correctIdx === idx).length;
  const score = Math.round((correctCount / current.length) * 100);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-emerald-700 rounded-2xl p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center">
          <ListChecks className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="font-heading font-bold text-white text-lg">SOP Master</h2>
          <p className="text-xs text-emerald-100">Sequence the steps of standard operating procedures for core clinical tasks. Drag steps into the correct order, then verify.</p>
        </div>
      </div>

      {/* Procedure selector */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        {SOP_PROCEDURES.map(p => {
          const Icon = PROC_ICONS[p.icon] || ListChecks;
          return (
            <button key={p.id} onClick={() => handleSelect(p.id)}
              className={`text-left rounded-xl border p-3 transition-all ${selectedId === p.id ? "border-emerald-500 bg-emerald-50" : "border-slate-200 bg-white hover:bg-slate-50"}`}>
              <div className="flex items-center gap-2 mb-1">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${selectedId === p.id ? "bg-emerald-500" : "bg-slate-100"}`}>
                  <Icon className={`w-4 h-4 ${selectedId === p.id ? "text-white" : "text-slate-500"}`} />
                </div>
              </div>
              <p className="font-heading font-bold text-xs text-slate-800 leading-tight">{p.title}</p>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Rationale */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="w-4 h-4 text-emerald-500" />
            <h3 className="font-heading font-bold text-sm text-slate-800">Why this SOP matters</h3>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed mb-3">{procedure.rationale}</p>
          <div className="flex items-start gap-2 text-[11px] text-slate-500 bg-emerald-50 border border-emerald-200 rounded-lg p-2.5">
            <Info className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
            <span>Standard Operating Procedures reduce variability and ensure safe, evidence-based practice across the MDT.</span>
          </div>
        </div>

        {/* Step sequencer */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-heading font-bold text-sm text-slate-800">Step Sequence ({current.length} steps)</h3>
            <div className="flex gap-2">
              <button onClick={shuffle} disabled={submitted}
                className="text-[11px] font-semibold px-3 py-1.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 disabled:opacity-40">
                Shuffle
              </button>
              {!submitted ? (
                <button onClick={verify} disabled={shuffled === null}
                  className="text-[11px] font-semibold px-3 py-1.5 rounded-lg bg-emerald-600 text-white hover:opacity-90 disabled:opacity-40 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Verify
                </button>
              ) : (
                <button onClick={reset}
                  className="text-[11px] font-semibold px-3 py-1.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 flex items-center gap-1">
                  <RotateCcw className="w-3.5 h-3.5" /> Reset
                </button>
              )}
            </div>
          </div>

          <div className="space-y-2">
            {current.map((step, idx) => {
              const isCorrect = submitted && step.correctIdx === idx;
              const isWrong = submitted && step.correctIdx !== idx;
              return (
                <motion.div key={idx} layout
                  className={`flex items-center gap-2 rounded-xl border p-2.5 transition-all ${
                    submitted
                      ? isCorrect ? "border-clinical-green bg-clinical-green/5" : "border-clinical-red bg-clinical-red/5"
                      : "border-slate-200 bg-slate-50"
                  }`}>
                  <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-heading font-bold shrink-0 ${
                    submitted ? (isCorrect ? "bg-clinical-green text-white" : "bg-clinical-red text-white") : "bg-slate-200 text-slate-600"
                  }`}>
                    {submitted ? (isCorrect ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />) : idx + 1}
                  </span>
                  <p className="text-xs text-slate-700 flex-1 leading-relaxed">{step.text}</p>
                  {submitted ? (
                    <span className="text-[10px] text-slate-400 shrink-0">Should be: {step.correctIdx + 1}</span>
                  ) : (
                    <div className="flex flex-col gap-0.5 shrink-0">
                      <button onClick={() => moveStep(idx, "up")} disabled={idx === 0}
                        className="p-0.5 rounded hover:bg-slate-200 disabled:opacity-30">
                        <ChevronUp className="w-3.5 h-3.5 text-slate-500" />
                      </button>
                      <button onClick={() => moveStep(idx, "down")} disabled={idx === current.length - 1}
                        className="p-0.5 rounded hover:bg-slate-200 disabled:opacity-30">
                        <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                      </button>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>

          <AnimatePresence>
            {submitted && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4">
                <div className={`rounded-xl p-3 border ${allCorrect ? "bg-clinical-green/10 border-clinical-green/30" : "bg-clinical-amber/10 border-clinical-amber/30"}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {allCorrect ? <CheckCircle2 className="w-5 h-5 text-clinical-green" /> : <XCircle className="w-5 h-5 text-clinical-amber" />}
                      <p className="font-heading font-bold text-sm text-slate-800">{allCorrect ? "Perfect sequence!" : "Some steps out of order"}</p>
                    </div>
                    <p className={`text-2xl font-heading font-bold ${allCorrect ? "text-clinical-green" : "text-clinical-amber"}`}>{score}%</p>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1">{correctCount} of {current.length} steps in the correct position.</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldAlert, CheckCircle2, AlertTriangle, RefreshCw, ChevronUp, ChevronDown } from "lucide-react";
import { PPE_ITEMS } from "@/lib/learningData";

export default function PPESequencer() {
  const [mode, setMode] = useState("donning");
  const [items, setItems] = useState(() => [...PPE_ITEMS].sort(() => Math.random() - 0.5));
  const [verification, setVerification] = useState(null);

  const handleMove = useCallback((index, direction) => {
    setItems(prev => {
      const next = [...prev];
      const target = direction === "up" ? index - 1 : index + 1;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
    setVerification(null);
  }, []);

  const handleVerify = () => {
    const results = items.map((item, idx) => {
      const correctPos = mode === "donning" ? item.donningRank : item.doffingRank;
      const currentPos = idx + 1;
      return { itemId: item.id, correctPos, currentPos, isCorrect: correctPos === currentPos };
    });
    setVerification({ tested: true, allCorrect: results.every(r => r.isCorrect), results });
  };

  const handleReset = (newMode) => {
    const selectedMode = newMode || mode;
    setMode(selectedMode);
    setItems([...PPE_ITEMS].sort(() => Math.random() - 0.5));
    setVerification(null);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 sm:p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center">
          <ShieldAlert className="w-5 h-5 text-rose-600" />
        </div>
        <div>
          <span className="bg-rose-50 text-rose-700 text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider">Area 7 · IPC</span>
          <h2 className="text-lg sm:text-xl font-heading font-bold text-slate-800 mt-0.5">PPE Donning & Doffing Sequencer</h2>
        </div>
      </div>

      <p className="text-sm text-slate-500 mb-4">PPE is only effective if donned and doffed in the correct sequence. Arrange the items in order, then verify your answer.</p>

      <div className="flex gap-2 mb-4">
        {["donning", "doffing"].map(m => (
          <button key={m} onClick={() => handleReset(m)}
            className={`flex-1 py-2 rounded-lg text-xs font-heading font-semibold uppercase tracking-wide transition-all ${mode === m ? "bg-slate-800 text-white shadow-sm" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}>
            {m === "donning" ? "🧤 Putting On (Donning)" : "🗑️ Taking Off (Doffing)"}
          </button>
        ))}
      </div>

      <div className="space-y-2 mb-4">
        <AnimatePresence>
          {items.map((item, idx) => {
            const result = verification?.results.find(r => r.itemId === item.id);
            const desc = mode === "donning" ? item.donningDesc : item.doffingDesc;
            return (
              <motion.div key={item.id} layout
                className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                  verification?.tested ? (result?.isCorrect ? "border-clinical-green/40 bg-clinical-green/5" : "border-clinical-red/40 bg-clinical-red/5")
                  : "border-slate-200 bg-slate-50"
                }`}>
                <div className={`flex flex-col gap-0.5`}>
                  <button onClick={() => handleMove(idx, "up")} disabled={idx === 0}
                    className="p-1 rounded hover:bg-slate-200 disabled:opacity-20 transition-colors"><ChevronUp className="w-4 h-4 text-slate-500" /></button>
                  <button onClick={() => handleMove(idx, "down")} disabled={idx === items.length - 1}
                    className="p-1 rounded hover:bg-slate-200 disabled:opacity-20 transition-colors"><ChevronDown className="w-4 h-4 text-slate-500" /></button>
                </div>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${verification?.tested ? (result?.isCorrect ? "bg-clinical-green text-white" : "bg-clinical-red text-white") : "bg-slate-200 text-slate-600"}`}>
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800">{item.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
                </div>
                {verification?.tested && (
                  result?.isCorrect
                    ? <CheckCircle2 className="w-5 h-5 text-clinical-green shrink-0" />
                    : <AlertTriangle className="w-5 h-5 text-clinical-red shrink-0" />
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {verification?.tested && !verification.allCorrect && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
          <p className="text-xs text-amber-800 font-medium">⚠️ Some items are out of order. The correct {mode} sequence is shown in green/red indicators. Re-arrange and try again.</p>
        </div>
      )}
      {verification?.tested && verification.allCorrect && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="bg-clinical-green/10 border border-clinical-green/30 rounded-lg p-3 mb-4">
          <p className="text-xs text-clinical-green font-bold flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4" /> Perfect sequence! You understand the correct {mode} order for PPE.</p>
        </motion.div>
      )}

      <div className="flex gap-2">
        <button onClick={handleVerify} className="flex-1 py-2.5 rounded-xl bg-clinical-teal text-white text-sm font-heading font-semibold hover:opacity-90 transition-opacity">
          Verify Sequence
        </button>
        <button onClick={() => handleReset()} className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-600 text-sm font-heading font-semibold hover:bg-slate-200 transition-colors flex items-center gap-1.5">
          <RefreshCw className="w-4 h-4" /> Reset
        </button>
      </div>
    </div>
  );
}
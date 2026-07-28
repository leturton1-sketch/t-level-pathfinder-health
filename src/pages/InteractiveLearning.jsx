import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, PersonStanding, Shield, AlertTriangle, Stethoscope, FlaskConical, Award, CheckCircle2 } from "lucide-react";
import { LEARNING_MODULES } from "@/lib/learningData";
import InteractiveAtlas from "@/components/learning/InteractiveAtlas";
import PPESequencer from "@/components/learning/PPESequencer";
import HazardHunt from "@/components/learning/HazardHunt";
import PathophysiologyMatcher from "@/components/learning/PathophysiologyMatcher";
import SciHealthDeck from "@/components/learning/SciHealthDeck";

const MODULE_ICONS = { Body: PersonStanding, Shield, AlertTriangle, Stethoscope, FlaskConical };
const MODULE_COMPONENTS = { atlas: InteractiveAtlas, ppe: PPESequencer, hazard: HazardHunt, patho: PathophysiologyMatcher, sciencedeck: SciHealthDeck };
const MODULE_COLORS = {
  atlas: { bg: "bg-rose-50", text: "text-rose-600", border: "border-rose-200", icon: "bg-rose-100" },
  ppe: { bg: "bg-amber-50", text: "text-amber-600", border: "border-amber-200", icon: "bg-amber-100" },
  hazard: { bg: "bg-orange-50", text: "text-orange-600", border: "border-orange-200", icon: "bg-orange-100" },
  patho: { bg: "bg-violet-50", text: "text-violet-600", border: "border-violet-200", icon: "bg-violet-100" },
  sciencedeck: { bg: "bg-teal-50", text: "text-teal-600", border: "border-teal-200", icon: "bg-teal-100" },
};

export default function InteractiveLearning() {
  const [activeModule, setActiveModule] = useState(null);
  const [completed, setCompleted] = useState([]);

  const handleComplete = (id) => {
    if (!completed.includes(id)) setCompleted(prev => [...prev, id]);
  };

  const handleSelect = (id) => {
    setActiveModule(id);
    handleComplete(id);
  };

  if (activeModule) {
    const Module = MODULE_COMPONENTS[activeModule];
    if (!Module) return null;
    return (
      <div className="px-4 py-4 sm:px-6 max-w-5xl mx-auto pb-24">
        <button onClick={() => setActiveModule(null)}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Modules
        </button>
        <Module />
      </div>
    );
  }

  return (
    <div className="px-4 py-4 sm:px-6 max-w-5xl mx-auto pb-24">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-2xl bg-clinical-teal/10 flex items-center justify-center">
            <Award className="w-6 h-6 text-clinical-teal" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-clinical-teal uppercase tracking-wider">Interactive Learning</span>
            <h1 className="text-xl sm:text-2xl font-display font-bold text-slate-800">Clinical Skills Lab</h1>
          </div>
        </div>
        <p className="text-sm text-slate-500 leading-relaxed max-w-2xl">
          Interactive modules mapped to the Pearson T Level Health specification. Each activity develops core clinical knowledge
          and skills, with explicit links to spec areas, skill codes (SK), and performance outcomes (PO) for Ofsted compliance tracking.
        </p>
      </div>

      {/* Progress summary */}
      <div className="bg-slate-800 rounded-2xl p-4 mb-6 flex items-center justify-between">
        <div>
          <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Modules Completed</p>
          <p className="text-2xl font-heading font-bold text-white">{completed.length}<span className="text-slate-500 text-base">/{LEARNING_MODULES.length}</span></p>
        </div>
        <div className="flex-1 mx-6">
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
            <motion.div className="h-full bg-clinical-teal rounded-full"
              animate={{ width: `${(completed.length / LEARNING_MODULES.length) * 100}%` }}
              transition={{ duration: 0.4 }} />
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Coverage</p>
          <p className="text-sm font-bold text-clinical-teal">{Math.round((completed.length / LEARNING_MODULES.length) * 100)}%</p>
        </div>
      </div>

      {/* Module grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {LEARNING_MODULES.map((mod, idx) => {
          const Icon = MODULE_ICONS[mod.icon] || Award;
          const colors = MODULE_COLORS[mod.id] || MODULE_COLORS.atlas;
          const isCompleted = completed.includes(mod.id);
          return (
            <motion.button key={mod.id} onClick={() => handleSelect(mod.id)}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.08 }}
              className={`group text-left p-5 rounded-2xl border transition-all hover:shadow-md ${colors.border} ${colors.bg} hover:scale-[1.02]`}>
              <div className="flex items-start justify-between mb-3">
                <div className={`w-12 h-12 rounded-xl ${colors.icon} flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 ${colors.text}`} />
                </div>
                {isCompleted && (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-clinical-green bg-clinical-green/10 px-2 py-1 rounded-full">
                    <CheckCircle2 className="w-3 h-3" /> Done
                  </span>
                )}
              </div>
              <h3 className="font-heading font-bold text-slate-800 mb-1">{mod.title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed mb-3">{mod.description}</p>
              <div className="flex flex-wrap gap-1">
                <span className="text-[9px] font-semibold text-slate-600 bg-white/60 px-1.5 py-0.5 rounded">{mod.specArea}</span>
                {mod.skCodes.map(code => (
                  <span key={code} className="text-[9px] font-semibold text-slate-600 bg-white/60 px-1.5 py-0.5 rounded">{code}</span>
                ))}
                {mod.poCodes.map(code => (
                  <span key={code} className="text-[9px] font-semibold text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">{code}</span>
                ))}
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
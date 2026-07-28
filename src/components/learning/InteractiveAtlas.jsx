import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HeartPulse, Activity, Eye, ShieldCheck, RefreshCw, BookOpen } from "lucide-react";
import { ANATOMY_SYSTEMS } from "@/lib/learningData";

const SYSTEM_ICONS = { cardio: HeartPulse, respiratory: Activity, urinary: Eye, nervous: ShieldCheck, digestive: BookOpen };

export default function InteractiveAtlas() {
  const [systemIdx, setSystemIdx] = useState(0);
  const [selectedOrgan, setSelectedOrgan] = useState(null);
  const system = ANATOMY_SYSTEMS[systemIdx];
  const Icon = SYSTEM_ICONS[system.id] || BookOpen;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 sm:p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-10 h-10 rounded-xl ${system.bg} flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${system.color}`} />
        </div>
        <div>
          <span className="bg-slate-100 text-slate-600 text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider">{system.specArea}</span>
          <h2 className="text-lg sm:text-xl font-heading font-bold text-slate-800 mt-0.5">Interactive Anatomy Atlas</h2>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-4">
        {ANATOMY_SYSTEMS.map((s, i) => {
          const SysIcon = SYSTEM_ICONS[s.id] || BookOpen;
          return (
            <button key={s.id} onClick={() => { setSystemIdx(i); setSelectedOrgan(null); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${i === systemIdx ? `${s.bg} ${s.color} ${s.border} border` : "bg-slate-50 text-slate-500 hover:bg-slate-100"}`}>
              <SysIcon className="w-3.5 h-3.5" /> {s.name}
            </button>
          );
        })}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="relative bg-gradient-to-b from-slate-50 to-slate-100 rounded-xl border border-slate-200 p-4 min-h-[340px] flex items-center justify-center">
          <svg viewBox="0 0 200 240" className="w-full max-w-[280px] h-auto" style={{ maxHeight: 340 }}>
            {/* Body outline */}
            <path d="M 100 15 C 85 15 75 25 75 40 C 75 50 78 55 80 58 C 65 62 55 75 55 95 C 55 115 60 130 65 140 C 55 160 50 180 50 200 C 50 220 60 235 70 235 L 130 235 C 140 235 150 220 150 200 C 150 180 145 160 135 140 C 140 130 145 115 145 95 C 145 75 135 62 120 58 C 122 55 125 50 125 40 C 125 25 115 15 100 15 Z"
              fill="#FAFAFA" stroke="#CBD5E1" strokeWidth="1.5" />
            {/* Organs */}
            {system.organs.map((organ) => {
              const isSelected = selectedOrgan?.id === organ.id;
              return (
                <g key={organ.id} onClick={() => setSelectedOrgan(organ)} className="cursor-pointer">
                  <path d={organ.path}
                    fill={isSelected ? "currentColor" : "rgba(148,163,184,0.25)"}
                    stroke={isSelected ? "currentColor" : "#94A3B8"} strokeWidth="1.5"
                    className={isSelected ? system.color : ""} />
                  <circle cx={organ.cx} cy={organ.cy} r={organ.r}
                    fill="transparent" stroke="transparent" />
                  {isSelected && (
                    <motion.circle cx={organ.cx} cy={organ.cy} r={organ.r + 4}
                      fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="4 3"
                      className={system.color}
                      initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3 }} />
                  )}
                </g>
              );
            })}
          </svg>
          <div className="absolute bottom-2 left-2 text-[9px] text-slate-400 uppercase tracking-wider">Click organs to explore</div>
        </div>

        <div className="min-h-[340px]">
          <AnimatePresence mode="wait">
            {selectedOrgan ? (
              <motion.div key={selectedOrgan.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                className="h-full flex flex-col">
                <div className={`px-4 py-3 rounded-t-xl ${system.bg} border ${system.border} border-b-0`}>
                  <h3 className={`font-heading font-bold ${system.color}`}>{selectedOrgan.name}</h3>
                </div>
                <div className="flex-1 border border-slate-200 rounded-b-xl p-4 space-y-3 overflow-y-auto scrollbar-thin">
                  <div>
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Function</p>
                    <p className="text-sm text-slate-700 leading-relaxed">{selectedOrgan.function}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Clinical Nursing Note</p>
                    <p className="text-sm text-slate-700 leading-relaxed">{selectedOrgan.clinicalNote}</p>
                  </div>
                  <div className="pt-2 border-t border-slate-100">
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">System</p>
                    <p className="text-xs text-slate-600">{system.description}</p>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="h-full flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-slate-200 rounded-xl">
                <div className={`w-12 h-12 rounded-full ${system.bg} flex items-center justify-center mb-3`}>
                  <Icon className={`w-6 h-6 ${system.color}`} />
                </div>
                <p className="text-sm font-semibold text-slate-700">{system.name}</p>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed max-w-[240px]">{system.description}</p>
                <p className="text-[10px] text-slate-400 mt-3">Select an organ on the diagram →</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
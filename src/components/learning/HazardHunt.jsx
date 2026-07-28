import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldAlert, CheckCircle2, AlertTriangle, RefreshCw, Search } from "lucide-react";
import { CLINICAL_HAZARDS } from "@/lib/learningData";

const REG_STYLES = {
  HASAWA: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", label: "HASAWA 1974" },
  COSHH: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200", label: "COSHH 2002" },
  RIDDOR: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200", label: "RIDDOR 2013" },
  IPC: { bg: "bg-sky-50", text: "text-sky-700", border: "border-sky-200", label: "IPC Protocol" },
};

export default function HazardHunt() {
  const [found, setFound] = useState([]);
  const [selected, setSelected] = useState(null);
  const total = CLINICAL_HAZARDS.length;

  const handleClick = (hazard) => {
    if (!found.includes(hazard.id)) {
      setFound(prev => [...prev, hazard.id]);
    }
    setSelected(hazard);
  };

  const handleReset = () => { setFound([]); setSelected(null); };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 sm:p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
          <ShieldAlert className="w-5 h-5 text-amber-600" />
        </div>
        <div className="flex-1">
          <span className="bg-amber-50 text-amber-700 text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider">Area 3 · Clinical Safety</span>
          <h2 className="text-lg sm:text-xl font-heading font-bold text-slate-800 mt-0.5">Clinical Hazard Hunt</h2>
        </div>
        <div className="text-right">
          <div className="text-2xl font-heading font-bold text-slate-800">{found.length}<span className="text-slate-400 text-sm">/{total}</span></div>
          <div className="text-[10px] text-slate-400 uppercase">Found</div>
        </div>
      </div>

      <p className="text-sm text-slate-500 mb-4">Click on the highlighted hazard zones in the clinical scene below to identify each safety issue and learn the correct remediation.</p>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Clinical scene */}
        <div className="relative bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl border border-slate-200 overflow-hidden" style={{ minHeight: 340 }}>
          <svg viewBox="0 0 100 90" className="w-full h-auto" style={{ minHeight: 340 }}>
            {/* Room outline */}
            <rect x="2" y="2" width="96" height="86" fill="#F8FAFC" stroke="#94A3B8" strokeWidth="0.5" rx="1" />
            {/* Corridor line */}
            <line x1="50" y1="2" x2="50" y2="88" stroke="#CBD5E1" strokeWidth="0.4" strokeDasharray="2 1" />
            {/* Sink area */}
            <rect x="3" y="10" width="14" height="10" fill="#E0F2FE" stroke="#0284C7" strokeWidth="0.3" rx="0.5" />
            <text x="10" y="16" fontSize="2.5" fill="#0284C7" textAnchor="middle" fontWeight="bold">Sink</text>
            {/* Med trolley */}
            <rect x="52" y="12" width="16" height="12" fill="#FEF3C7" stroke="#D97706" strokeWidth="0.3" rx="0.5" />
            <text x="60" y="19" fontSize="2.2" fill="#92400E" textAnchor="middle">Trolley</text>
            {/* Bed */}
            <rect x="20" y="30" width="20" height="12" fill="#F1F5F9" stroke="#64748B" strokeWidth="0.3" rx="0.5" />
            <text x="30" y="37" fontSize="2.2" fill="#475569" textAnchor="middle">Bed Bay</text>
            {/* Fire exit */}
            <rect x="82" y="68" width="14" height="16" fill="#FEE2E2" stroke="#DC2626" strokeWidth="0.3" />
            <text x="89" y="77" fontSize="2.5" fill="#991B1B" textAnchor="middle" fontWeight="bold">EXIT</text>
            {/* Waste area */}
            <rect x="30" y="65" width="14" height="12" fill="#FEF3C7" stroke="#D97706" strokeWidth="0.3" rx="0.5" />

            {/* Hazard hotspots */}
            {CLINICAL_HAZARDS.map((hazard) => {
              const isFound = found.includes(hazard.id);
              const isSelected = selected?.id === hazard.id;
              const reg = REG_STYLES[hazard.regulation] || REG_STYLES.HASAWA;
              return (
                <g key={hazard.id} onClick={() => handleClick(hazard)} className="cursor-pointer">
                  <rect x={hazard.x} y={hazard.y} width={hazard.w} height={hazard.h}
                    fill={isFound ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.08)"}
                    stroke={isFound ? "#22C55E" : isSelected ? "#EF4444" : "#FCA5A5"}
                    strokeWidth={isSelected ? 0.6 : 0.4} strokeDasharray={isFound ? "none" : "1.5 1"} rx="0.5" />
                  {!isFound && (
                    <motion.g initial={{ opacity: 0.4 }} animate={{ opacity: [0.4, 0.9, 0.4] }} transition={{ duration: 2, repeat: Infinity }}>
                      <circle cx={hazard.x + hazard.w / 2} cy={hazard.y + hazard.h / 2} r="2" fill="none" stroke="#EF4444" strokeWidth="0.4" />
                    </motion.g>
                  )}
                  {isFound && (
                    <circle cx={hazard.x + hazard.w / 2} cy={hazard.y + hazard.h / 2} r="1.5" fill="#22C55E" />
                  )}
                </g>
              );
            })}
          </svg>
          <div className="absolute top-2 left-2 flex items-center gap-1.5 text-[10px] text-slate-500 bg-white/80 backdrop-blur-sm rounded-md px-2 py-1">
            <Search className="w-3 h-3" /> Click red zones to identify hazards
          </div>
        </div>

        {/* Hazard detail panel */}
        <div className="min-h-[340px]">
          <AnimatePresence mode="wait">
            {selected ? (
              <motion.div key={selected.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                {(() => {
                  const reg = REG_STYLES[selected.regulation] || REG_STYLES.HASAWA;
                  return (
                    <div className="h-full flex flex-col">
                      <div className={`px-4 py-3 rounded-t-xl ${reg.bg} border ${reg.border} border-b-0`}>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold ${reg.text} uppercase tracking-wider ${reg.bg} px-2 py-0.5 rounded-full border ${reg.border}`}>{reg.label}</span>
                          {found.includes(selected.id) && <CheckCircle2 className="w-4 h-4 text-clinical-green" />}
                        </div>
                        <h3 className="font-heading font-bold text-slate-800 mt-1.5">{selected.name}</h3>
                      </div>
                      <div className="flex-1 border border-slate-200 rounded-b-xl p-4 space-y-3 overflow-y-auto scrollbar-thin">
                        <div>
                          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Description</p>
                          <p className="text-sm text-slate-700 leading-relaxed">{selected.description}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Correct Remediation</p>
                          <p className="text-sm text-slate-700 leading-relaxed">{selected.remedy}</p>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </motion.div>
            ) : (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="h-full flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-slate-200 rounded-xl">
                <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center mb-3">
                  <ShieldAlert className="w-6 h-6 text-amber-600" />
                </div>
                <p className="text-sm font-semibold text-slate-700">Hazard Identification</p>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed max-w-[240px]">Click the pulsing red zones in the clinical scene to identify hazards and learn the correct remediation procedure.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {found.length === total && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="mt-4 bg-clinical-green/10 border border-clinical-green/30 rounded-lg p-3 flex items-center justify-between">
          <p className="text-xs text-clinical-green font-bold flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4" /> All hazards identified! You have a strong understanding of clinical safety.</p>
          <button onClick={handleReset} className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1"><RefreshCw className="w-3 h-3" /> Reset</button>
        </motion.div>
      )}
    </div>
  );
}
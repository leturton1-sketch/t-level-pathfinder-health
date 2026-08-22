import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  HeartPulse, Activity, Eye, BookOpen, Users, Brain, Baby,
  Bone, RotateCcw, Focus, Boxes, Layers, User, X, Info,
} from "lucide-react";
import Anatomy3DViewer from "@/components/anatomy/Anatomy3DViewer";
import { ANATOMY_STRUCTURES, SYSTEM_META, SYSTEM_ORDER } from "@/lib/anatomy3D";
import { SKBadgeGroup } from "@/components/SKBadge";

const SYSTEM_ICONS = {
  skeletal: Bone, cardiovascular: HeartPulse, respiratory: Activity,
  digestive: BookOpen, urinary: Eye, nervous: Brain, reproductive: Baby,
};

const SK_MAP = {
  skeletal: ["SK1", "SK17"], cardiovascular: ["SK1", "SK17"], respiratory: ["SK1", "SK2", "SK17"],
  digestive: ["SK15", "SK17"], urinary: ["SK5", "SK17"], nervous: ["SK2", "SK17"], reproductive: ["SK5", "SK17"],
};
const PO_MAP = { skeletal: ["PO8"], cardiovascular: ["PO4", "PO8"], respiratory: ["PO4", "PO8"], digestive: ["PO4", "PO8"], urinary: ["PO4", "PO8"], nervous: ["PO4", "PO8"], reproductive: ["PO4", "PO8"] };

export default function InteractiveAtlas() {
  const [gender, setGender] = useState("male");
  const [activeSystems, setActiveSystems] = useState(["skeletal", "cardiovascular", "respiratory", "digestive", "urinary", "nervous", "reproductive"]);
  const [selectedId, setSelectedId] = useState(null);
  const [isolatedId, setIsolatedId] = useState(null);
  const [reconstructId, setReconstructId] = useState(null);
  const [resetNonce, setResetNonce] = useState(0);

  const toggleSystem = (sys) => {
    setActiveSystems((prev) => (prev.includes(sys) ? prev.filter((s) => s !== sys) : [...prev, sys]));
    setIsolatedId(null);
    setSelectedId(null);
  };

  const structuresForGender = useMemo(
    () => ANATOMY_STRUCTURES.filter((s) => s.genders === "both" || s.genders === gender),
    [gender]
  );

  const visibleBySystem = useMemo(() => {
    const map = {};
    SYSTEM_ORDER.forEach((s) => (map[s] = []));
    structuresForGender.forEach((s) => {
      if (activeSystems.includes(s.system)) map[s.system].push(s);
    });
    return map;
  }, [structuresForGender, activeSystems]);

  const selected = ANATOMY_STRUCTURES.find((s) => s.id === selectedId) || null;
  const selectedSystem = selected ? SYSTEM_META[selected.system] : null;

  const handleSelect = (id) => {
    setSelectedId(id);
    if (reconstructId) setReconstructId(null);
  };

  const handleIsolate = (id) => {
    setIsolatedId((cur) => (cur === id ? null : id));
    setSelectedId(id);
  };

  const handleReconstruct = (id) => {
    setIsolatedId(id);
    setSelectedId(id);
    setReconstructId(id);
  };

  const resetView = () => {
    setResetNonce((n) => n + 1);
    setIsolatedId(null);
    setSelectedId(null);
    setReconstructId(null);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 sm:px-6 pt-4 pb-3 border-b border-slate-100">
        <div className="w-10 h-10 rounded-xl bg-clinical-teal/10 flex items-center justify-center">
          <Layers className="w-5 h-5 text-clinical-teal" />
        </div>
        <div className="flex-1 min-w-0">
          <span className="bg-slate-100 text-slate-600 text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider">Area 8-9</span>
          <h2 className="text-lg sm:text-xl font-heading font-bold text-slate-800 mt-0.5">3D Segmented Anatomy Atlas</h2>
          <p className="text-xs text-slate-500 leading-snug">Fully segmented male & female anatomy — visualise structures exactly as on a physical cadaver.</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 px-4 sm:px-6 py-2.5 border-b border-slate-100 bg-slate-50/50">
        {/* Gender toggle */}
        <div className="flex items-center bg-white rounded-lg border border-slate-200 p-0.5">
          <button onClick={() => { setGender("male"); setIsolatedId(null); setSelectedId(null); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-heading font-semibold transition-all ${gender === "male" ? "bg-sky-600 text-white" : "text-slate-500 hover:bg-slate-50"}`}>
            <User className="w-3.5 h-3.5" /> Male
          </button>
          <button onClick={() => { setGender("female"); setIsolatedId(null); setSelectedId(null); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-heading font-semibold transition-all ${gender === "female" ? "bg-pink-500 text-white" : "text-slate-500 hover:bg-slate-50"}`}>
            <Users className="w-3.5 h-3.5" /> Female
          </button>
        </div>

        {/* System filters */}
        <div className="flex items-center gap-1 flex-wrap">
          {SYSTEM_ORDER.map((sys) => {
            const meta = SYSTEM_META[sys];
            const Icon = SYSTEM_ICONS[sys] || Boxes;
            const active = activeSystems.includes(sys);
            return (
              <button key={sys} onClick={() => toggleSystem(sys)}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-heading font-semibold border transition-all ${active ? "text-white border-transparent" : "bg-white text-slate-400 border-slate-200 hover:bg-slate-50"}`}
                style={active ? { backgroundColor: meta.hex } : {}}>
                <Icon className="w-3 h-3" /> {meta.name.split(" ")[0]}
              </button>
            );
          })}
        </div>

        <div className="flex-1" />

        <button onClick={resetView} className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-heading font-medium text-slate-600 hover:bg-slate-50">
          <RotateCcw className="w-3.5 h-3.5" /> Reset View
        </button>
      </div>

      {/* Main: 3D viewer + side panel */}
      <div className="grid lg:grid-cols-[1fr_320px] gap-0">
        {/* 3D viewer */}
        <div className="relative bg-slate-900 h-[420px] lg:h-[560px]">
          <Anatomy3DViewer
            gender={gender}
            activeSystems={activeSystems}
            selectedId={selectedId}
            isolatedId={isolatedId}
            reconstructId={reconstructId}
            onSelectStructure={handleSelect}
            resetNonce={resetNonce}
          />
          {/* Hint */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-lg bg-slate-950/70 backdrop-blur px-3 py-1.5 text-[10px] text-slate-300 border border-slate-700 whitespace-nowrap">
            Drag to rotate · Scroll to zoom · Shift+drag to pan · Click a structure to select
          </div>
          {isolatedId && (
            <button onClick={() => { setIsolatedId(null); setReconstructId(null); }}
              className="absolute top-2 left-2 flex items-center gap-1.5 rounded-lg bg-slate-950/70 backdrop-blur px-2.5 py-1.5 text-[11px] text-white border border-slate-700 hover:bg-slate-800">
              <X className="w-3.5 h-3.5" /> Exit Isolate
            </button>
          )}
        </div>

        {/* Side panel: structure list + selected detail */}
        <div className="border-l border-slate-100 flex flex-col max-h-[420px] lg:max-h-[560px]">
          <AnimatePresence mode="wait">
            {selected ? (
              <motion.div key={selected.id} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }}
                className="flex flex-col h-full">
                {/* Selected header */}
                <div className="px-4 py-3 border-b border-slate-100" style={{ backgroundColor: `${selectedSystem.hex}14` }}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: selectedSystem.hex }} />
                    <span className="text-[10px] font-heading font-semibold uppercase tracking-wider" style={{ color: selectedSystem.hex }}>{selectedSystem.name}</span>
                  </div>
                  <h3 className="font-heading font-bold text-sm text-slate-800">{selected.name}</h3>
                </div>
                {/* Body */}
                <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-3">
                  <div>
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Function</p>
                    <p className="text-xs text-slate-700 leading-relaxed">{selected.function}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Clinical Nursing Note</p>
                    <p className="text-xs text-slate-700 leading-relaxed">{selected.clinicalNote}</p>
                  </div>
                  <div className="pt-2">
                    <SKBadgeGroup skCodes={SK_MAP[selected.system]} poCodes={PO_MAP[selected.system]} />
                  </div>
                </div>
                {/* Actions */}
                <div className="p-3 border-t border-slate-100 space-y-2">
                  <button onClick={() => handleReconstruct(selected.id)}
                    className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-clinical-teal text-white px-3 py-2 text-xs font-heading font-semibold hover:opacity-90">
                    <Boxes className="w-3.5 h-3.5" /> Reconstruct in 3D
                  </button>
                  <button onClick={() => handleIsolate(selected.id)}
                    className="w-full flex items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-heading font-semibold text-slate-600 hover:bg-slate-50">
                    <Focus className="w-3.5 h-3.5" /> {isolatedId === selected.id ? "Show All" : "Isolate Structure"}
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex flex-col h-full">
                <div className="px-4 py-2.5 border-b border-slate-100 flex items-center gap-1.5">
                  <Boxes className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-[11px] font-heading font-bold text-slate-700 uppercase tracking-wide">Structures</span>
                  <span className="text-[10px] text-slate-400">({structuresForGender.length})</span>
                </div>
                <div className="flex-1 overflow-y-auto scrollbar-thin p-2 space-y-3">
                  {SYSTEM_ORDER.filter((s) => visibleBySystem[s]?.length > 0).map((sys) => {
                    const meta = SYSTEM_META[sys];
                    const Icon = SYSTEM_ICONS[sys] || Boxes;
                    return (
                      <div key={sys}>
                        <div className="flex items-center gap-1.5 px-1.5 mb-1">
                          <Icon className="w-3 h-3" style={{ color: meta.hex }} />
                          <span className="text-[10px] font-heading font-bold uppercase tracking-wider" style={{ color: meta.hex }}>{meta.name}</span>
                        </div>
                        <div className="space-y-0.5">
                          {visibleBySystem[sys].map((s) => (
                            <button key={s.id} onClick={() => handleSelect(s.id)}
                              className={`w-full text-left flex items-center gap-2 rounded-md px-2 py-1.5 text-xs transition-all ${selectedId === s.id ? "bg-slate-100 text-slate-800 font-semibold" : "text-slate-600 hover:bg-slate-50"}`}>
                              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: s.color ?? meta.hex }} />
                              <span className="truncate">{s.name}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                  {structuresForGender.length === 0 && (
                    <div className="text-center py-8 px-4">
                      <Info className="w-6 h-6 text-slate-300 mx-auto mb-2" />
                      <p className="text-xs text-slate-400">Enable a system above to view structures.</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
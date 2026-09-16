import { Link } from "react-router-dom";
import { GraduationCap, ExternalLink, X } from "lucide-react";
import { ANATOMY_STRUCTURES, SYSTEM_META } from "@/lib/anatomy3D";

// Maps an anatomical system to the most relevant Clinical Skills Academy
// pathway so the deep-link lands the learner on related practical modules.
const SYSTEM_TO_PATHWAY = {
  cardiovascular: "assessment",
  respiratory: "assessment",
  nervous: "assessment",
  digestive: "person-centred",
  urinary: "person-centred",
  reproductive: "person-centred",
  integumentary: "assessment",
  muscular: "assessment",
  skeletal: "assessment",
  lymphatic: "assessment",
  endocrine: "reasoning",
};

export default function OrganLinkOverlay({ selectedId, onClose }) {
  if (!selectedId) return null;
  const structure = ANATOMY_STRUCTURES.find((s) => s.id === selectedId);
  if (!structure) return null;
  const meta = SYSTEM_META[structure.system];
  const pathway = SYSTEM_TO_PATHWAY[structure.system] || "reasoning";
  return (
    <div className="pointer-events-auto absolute bottom-3 left-1/2 z-30 w-[min(94%,22rem)] -translate-x-1/2 animate-slide-up">
      <div className="polished-glass-edge flex items-center gap-2.5 rounded-2xl border border-white/90 bg-white/95 p-2.5 shadow-xl backdrop-blur-xl">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-white shadow" style={{ backgroundColor: meta.hex }}>
          <GraduationCap className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[9px] font-black uppercase tracking-wider" style={{ color: meta.hex }}>{meta.name}</p>
          <p className="truncate text-sm font-black text-slate-900">{structure.name}</p>
        </div>
        <Link
          to={`/clinical-skills-academy?pathway=${pathway}`}
          className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-sky-600 to-cyan-600 px-3 py-2 text-[11px] font-black text-white shadow-md transition hover:opacity-90"
        >
          Theory <ExternalLink className="h-3 w-3" />
        </Link>
        <button
          type="button"
          onClick={onClose}
          className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:text-rose-600"
          aria-label="Dismiss organ link"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
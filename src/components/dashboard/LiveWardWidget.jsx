import { ALL_BEDS, bedOf, newsTone } from "@/lib/wardBoard";
import Widget3DGraphic from "./Widget3DGraphic";

/**
 * Live 3D-styled ward map — each bed is a glossy 3D tile whose colour reflects
 * the occupant's NEWS2 band. Clicking a bed selects that patient.
 */
export default function LiveWardWidget({ patients, selectedId, onSelect }) {
  const byBed = {};
  patients.forEach((p) => { byBed[bedOf(p)] = p; });

  return (
    <div className="rounded-2xl border border-sky-200/70 bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Widget3DGraphic type="ward" tone="sky" size="sm" />
          <div>
            <h3 className="text-sm font-heading font-bold text-foreground">Live Ward Map</h3>
            <p className="text-[10px] text-muted-foreground">Suite A · Suite B — real-time occupancy</p>
          </div>
        </div>
        <span className="flex items-center gap-1 text-[9px] font-heading uppercase tracking-wider text-clinical-teal">
          <span className="w-1.5 h-1.5 rounded-full bg-clinical-green animate-pulse" /> Live
        </span>
      </div>

      <div className="grid grid-cols-4 gap-2.5">
        {ALL_BEDS.map((bed) => {
          const p = byBed[bed];
          const tone = p ? newsTone(p.initial_news2) : null;
          const occupied = !!p;
          const isSelected = p && p.id === selectedId;
          return (
            <button
              key={bed}
              onClick={() => occupied && onSelect(p.id)}
              className={`group relative rounded-xl p-2 text-left transition-all overflow-hidden border ${
                occupied ? `${tone.border} ${tone.bg} hover:-translate-y-0.5 hover:shadow-md` : "border-dashed border-slate-200 bg-slate-50/60"
              } ${isSelected ? "ring-2 ring-sky-400" : ""}`}
            >
              <div className="absolute inset-0 bg-gradient-to-b from-white/50 to-transparent pointer-events-none" />
              <div className="relative flex items-center justify-between">
                <span className="text-[10px] font-heading font-bold text-foreground">{bed}</span>
                {occupied && <span className={`w-1.5 h-1.5 rounded-full ${tone.dot} animate-pulse`} />}
              </div>
              <div className="relative mt-1.5 h-8 flex items-center">
                {occupied ? (
                  <div className="flex items-center gap-1.5">
                    <div className={`w-7 h-5 rounded-md bg-gradient-to-br ${p.initial_news2 >= 7 ? "from-rose-300 to-rose-400" : p.initial_news2 >= 5 ? "from-amber-300 to-amber-400" : p.initial_news2 >= 1 ? "from-amber-200 to-amber-300" : "from-emerald-200 to-emerald-300"} shadow-sm`} />
                    <span className="text-[10px] font-semibold text-foreground truncate">{p.name.split(" ")[0]}</span>
                  </div>
                ) : (
                  <span className="text-[10px] text-muted-foreground/60">Empty</span>
                )}
              </div>
              {occupied && (
                <span className={`relative mt-1 inline-block text-[9px] font-bold ${tone.text}`}>NEWS2 {p.initial_news2}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
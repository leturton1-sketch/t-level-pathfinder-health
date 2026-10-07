import { SK_CODES, PERFORMANCE_OUTCOMES } from "@/lib/specData";
import { CheckCircle2, Circle } from "lucide-react";

const CONTEXT_LABELS = {
  theory: { label: "Theory", cls: "bg-tl-blue/15 text-tl-blue" },
  interactive: { label: "Interactive", cls: "bg-emerald-100 text-emerald-700" },
  simulation: { label: "Sim", cls: "bg-amber-100 text-amber-700" },
  carePlan: { label: "Care Plan", cls: "bg-cyan-100 text-cyan-700" },
  esp: { label: "ESP", cls: "bg-violet-100 text-violet-700" },
};

function ContextChips({ code, contexts = {} }) {
  const active = Object.entries(contexts)
    .filter(([, ctx]) => ctx.sk.has(code) || ctx.po.has(code))
    .map(([name]) => CONTEXT_LABELS[name])
    .filter(Boolean);
  if (active.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1 shrink-0">
      {active.map((c) => (
        <span key={c.label} className={`text-[8px] font-bold px-1 py-0.5 rounded ${c.cls}`}>{c.label}</span>
      ))}
    </div>
  );
}

export default function SKCoverageMatrix({ coveredSK = new Set(), coveredPO = new Set(), contexts = {} }) {
  const skEntries = Object.entries(SK_CODES);
  const poEntries = Object.entries(PERFORMANCE_OUTCOMES);
  const skPct = Math.round((coveredSK.size / skEntries.length) * 100);
  const poPct = Math.round((coveredPO.size / poEntries.length) * 100);

  return (
    <div className="space-y-4">
      {/* SK coverage */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-foreground">Skill Codes (SK1–SK18)</p>
          <span className="text-xs font-bold text-tl-blue">{coveredSK.size}/{skEntries.length} · {skPct}%</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          {skEntries.map(([code, desc]) => {
            const covered = coveredSK.has(code);
            return (
              <div key={code} className="flex items-center gap-2 text-xs">
                {covered ? <CheckCircle2 className="w-3.5 h-3.5 text-clinical-green shrink-0" /> : <Circle className="w-3.5 h-3.5 text-muted-foreground/30 shrink-0" />}
                <span className="font-mono font-semibold text-tl-blue w-10 shrink-0">{code}</span>
                <span className="text-muted-foreground truncate flex-1">{desc}</span>
                {covered && <ContextChips code={code} contexts={contexts} />}
              </div>
            );
          })}
        </div>
      </div>

      {/* PO coverage */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-foreground">Performance Outcomes (PO1–PO10)</p>
          <span className="text-xs font-bold text-blue-500">{coveredPO.size}/{poEntries.length} · {poPct}%</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          {poEntries.map(([code, desc]) => {
            const covered = coveredPO.has(code);
            return (
              <div key={code} className="flex items-center gap-2 text-xs">
                {covered ? <CheckCircle2 className="w-3.5 h-3.5 text-clinical-green shrink-0" /> : <Circle className="w-3.5 h-3.5 text-muted-foreground/30 shrink-0" />}
                <span className="font-mono font-semibold text-blue-500 w-10 shrink-0">{code}</span>
                <span className="text-muted-foreground truncate flex-1">{desc}</span>
                {covered && <ContextChips code={code} contexts={contexts} />}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
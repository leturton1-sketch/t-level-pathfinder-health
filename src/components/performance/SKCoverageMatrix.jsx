import { SK_CODES, PERFORMANCE_OUTCOMES } from "@/lib/specData";
import { CheckCircle2, Circle } from "lucide-react";

export default function SKCoverageMatrix({ coveredSK = new Set(), coveredPO = new Set() }) {
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
          <span className="text-xs font-bold text-tl-purple">{coveredSK.size}/{skEntries.length} · {skPct}%</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          {skEntries.map(([code, desc]) => {
            const covered = coveredSK.has(code);
            return (
              <div key={code} className="flex items-center gap-2 text-xs">
                {covered ? <CheckCircle2 className="w-3.5 h-3.5 text-clinical-green shrink-0" /> : <Circle className="w-3.5 h-3.5 text-muted-foreground/30 shrink-0" />}
                <span className="font-mono font-semibold text-tl-purple w-10 shrink-0">{code}</span>
                <span className="text-muted-foreground truncate">{desc}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* PO coverage */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-foreground">Performance Outcomes (PO1–PO10)</p>
          <span className="text-xs font-bold text-purple-500">{coveredPO.size}/{poEntries.length} · {poPct}%</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          {poEntries.map(([code, desc]) => {
            const covered = coveredPO.has(code);
            return (
              <div key={code} className="flex items-center gap-2 text-xs">
                {covered ? <CheckCircle2 className="w-3.5 h-3.5 text-clinical-green shrink-0" /> : <Circle className="w-3.5 h-3.5 text-muted-foreground/30 shrink-0" />}
                <span className="font-mono font-semibold text-purple-500 w-10 shrink-0">{code}</span>
                <span className="text-muted-foreground truncate">{desc}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
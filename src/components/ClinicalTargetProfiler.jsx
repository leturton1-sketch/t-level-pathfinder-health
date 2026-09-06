import { useMemo } from "react";
import { scanEntry, TARGET_ORDER, TARGET_META } from "@/lib/clinicalTargets";
import { Activity, Footprints, ShieldCheck, Home, CheckCircle2, Circle, Target } from "lucide-react";

const ICONS = { physiological: Activity, physical: Footprints, safety: ShieldCheck, social_reablement: Home };

const COLOR_STYLES = {
  "clinical-teal": { active: "border-clinical-teal/50 bg-clinical-teal/10", inactive: "border-slate-200 bg-slate-50", text: "text-clinical-teal", dot: "bg-clinical-teal" },
  "clinical-amber": { active: "border-clinical-amber/50 bg-clinical-amber/10", inactive: "border-slate-200 bg-slate-50", text: "text-clinical-amber", dot: "bg-clinical-amber" },
  "clinical-red": { active: "border-clinical-red/50 bg-clinical-red/10", inactive: "border-slate-200 bg-slate-50", text: "text-clinical-red", dot: "bg-clinical-red" },
  "clinical-green": { active: "border-clinical-green/50 bg-clinical-green/10", inactive: "border-slate-200 bg-slate-50", text: "text-clinical-green", dot: "bg-clinical-green" },
};

/**
 * ClinicalTargetProfiler
 * Scans the combined student text in real time and renders a progress badge
 * ("Established: X of 4 targets met") plus interactive status-reflective
 * checklist cards for each release target.
 */
export default function ClinicalTargetProfiler({ caseId, combinedText }) {
  const result = useMemo(() => scanEntry(caseId, combinedText), [caseId, combinedText]);
  const pct = result.total > 0 ? Math.round((result.establishedCount / result.total) * 100) : 0;

  return (
    <div className="space-y-3">
      {/* Progress badge */}
      <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-clinical-teal" />
          <span className="text-sm font-heading font-bold text-slate-800">Clinical Release Targets</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            {TARGET_ORDER.map((key) => {
              const t = result.targets[key];
              const colorKey = TARGET_META[key].color;
              const style = COLOR_STYLES[colorKey];
              return (
                <span
                  key={key}
                  title={TARGET_META[key].short}
                  className={`w-2.5 h-2.5 rounded-full ${t?.established ? style.dot : "bg-slate-300"}`}
                />
              );
            })}
          </div>
          <span className={`text-sm font-heading font-bold ${pct === 100 ? "text-clinical-green" : "text-slate-700"}`}>
            Established: {result.establishedCount} of {result.total} targets met
          </span>
        </div>
      </div>

      {/* Checklist cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {TARGET_ORDER.map((key) => {
          const meta = TARGET_META[key];
          const t = result.targets[key];
          const style = COLOR_STYLES[meta.color];
          const Icon = ICONS[key];
          const established = t?.established;

          return (
            <div
              key={key}
              className={`rounded-xl border p-3 transition-all ${established ? style.active : style.inactive}`}
            >
              <div className="flex items-start gap-2 mb-1.5">
                <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${established ? style.text : "text-slate-400"}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    {established ? <CheckCircle2 className="w-3.5 h-3.5 text-clinical-green shrink-0" /> : <Circle className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                    <span className="text-xs font-heading font-bold text-slate-800">{meta.label}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{meta.description}</p>
                </div>
              </div>
              {t && (
                <>
                  <p className="text-[11px] text-slate-600 mb-1.5 italic leading-snug">{t.summary}</p>
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-semibold ${established ? style.text : "text-slate-400"}`}>
                      {t.matchedCount}/{t.minKeywords} keywords matched
                    </span>
                    {t.matchedKeywords.length > 0 && (
                      <div className="flex flex-wrap gap-1 justify-end">
                        {t.matchedKeywords.slice(0, 4).map((kw) => (
                          <span key={kw} className="text-[9px] bg-white border border-slate-200 rounded px-1 py-0.5 text-slate-500">{kw}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
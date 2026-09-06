import { useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { getCurrentUser } from "@/lib/clinicalAuth";
import { SPEC_AREAS } from "@/lib/specData";
import { THEORY_MODULES } from "@/lib/theoryContent";
import { readinessBand } from "@/lib/pathfinderOperatingModel";
import { Target, ClipboardCheck, BookOpen, Stethoscope } from "lucide-react";

export default function CurriculumReadiness() {
  const user = getCurrentUser();
  const [results, setResults] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [portfolio, setPortfolio] = useState([]);

  useEffect(() => {
    (async () => {
      try { setResults(await base44.entities.SimulationResult.filter({ student_id: user?.id }) || []); } catch {}
      try { setSubmissions(await base44.entities.CarePlanSubmission.filter({ student_id: user?.id }) || []); } catch {}
      try { setPortfolio(await base44.entities.ESPPortfolio.filter({ student_id: user?.id }) || []); } catch {}
    })();
  }, [user?.id]);

  const theory = JSON.parse(localStorage.getItem("theory_progress") || "{}");
  const quizzes = JSON.parse(localStorage.getItem("theory_quiz_scores") || "{}");

  const areas = useMemo(() => SPEC_AREAS.map((area) => {
    const quiz = quizzes[area.code]?.pct || 0;
    const complete = !!theory[area.code];
    const module = THEORY_MODULES.find((m) => m.spec_area === area.code);
    const skCodes = new Set(module?.sk_codes || []);
    const poCodes = new Set(module?.performance_outcomes || []);
    const evidenceCount = results.filter((r) => (r.sk_codes || []).some((c) => skCodes.has(c)) || (r.performance_outcomes || []).some((c) => poCodes.has(c))).length +
      submissions.filter((s) => ["submitted", "reviewed"].includes(s.status) && ((s.sk_codes || []).some((c) => skCodes.has(c)) || (s.performance_outcomes || []).some((c) => poCodes.has(c)))).length;
    const score = Math.min(100, Math.round((complete ? 30 : 0) + (quiz * 0.5) + Math.min(20, evidenceCount * 5)));
    return { ...area, score, quiz, complete, evidenceCount, band: readinessBand(score), title_full: module?.title };
  }), [results, submissions]);

  const avg = areas.length ? Math.round(areas.reduce((sum, a) => sum + a.score, 0) / areas.length) : 0;
  const espActive = portfolio.filter((p) => ["in_progress", "submitted", "reviewed"].includes(p.status)).length;
  const evidence = submissions.filter((s) => ["submitted", "reviewed"].includes(s.status)).length;

  return <div className="clinical-page-shell clinical-page-shell--narrow min-h-screen bg-background">
    <div className="mb-6"><p className="pf-eyebrow">Pearson / ESP</p><h1 className="text-2xl font-black">Curriculum Coverage & Readiness</h1><p className="mt-1 text-sm text-muted-foreground">Specification, performance outcome and ESP evidence translated into actionable readiness gaps.</p></div>
    <div className="grid gap-3 sm:grid-cols-4">
      {[["Overall readiness", `${avg}%`, Target], ["Theory areas", `${areas.filter((a) => a.complete).length}/${areas.length}`, BookOpen], ["Submitted evidence", evidence, Stethoscope], ["ESP portfolios", espActive, ClipboardCheck]].map(([label, value, Icon]) => <div key={label} className="rounded-2xl border bg-card p-4"><Icon className="h-5 w-5 text-purple-600"/><p className="mt-2 text-xs text-muted-foreground">{label}</p><p className="text-2xl font-black">{value}</p></div>)}
    </div>
    <div className="mt-5 grid gap-3 sm:grid-cols-2">
      {areas.map((area) => <article key={area.code} className="rounded-2xl border bg-card p-4">
        <div className="flex items-center justify-between gap-3"><div><p className="text-xs font-black text-purple-700">{area.code}</p><h2 className="font-bold">{area.title_full || area.title || "Specification area"}</h2></div><span className={`rounded-full px-2 py-1 text-xs font-bold ${area.band.tone === "emerald" ? "bg-emerald-50 text-emerald-700" : area.band.tone === "amber" ? "bg-amber-50 text-amber-700" : "bg-rose-50 text-rose-700"}`}>{area.score}% · {area.band.label}</span></div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full bg-purple-600" style={{ width: `${area.score}%` }}/></div>
        <p className="mt-2 text-xs text-muted-foreground">Knowledge check {area.quiz}% · Theory {area.complete ? "complete" : "not complete"} · {area.evidenceCount} evidence item{area.evidenceCount === 1 ? "" : "s"}</p>
      </article>)}
    </div>
  </div>;
}

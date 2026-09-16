import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { isLoggedIn } from "@/lib/clinicalAuth";
import { SPEC_AREAS, THEORY_MODULES } from "@/lib/specData";
import { SKBadgeGroup } from "@/components/SKBadge";
import { BookOpen, Clock, ChevronRight, CheckCircle, Circle, GraduationCap } from "lucide-react";

export default function Theory() {
  const navigate = useNavigate();
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [completedIds, setCompletedIds] = useState(new Set());

  useEffect(() => {
    if (!isLoggedIn()) {
      navigate("/login");
      return;
    }
    loadModules();
  }, [navigate]);

  const loadModules = async () => {
    setLoading(true);
    try {
      const existing = await base44.entities.TheoryModule.list("order_index", 50);
      setModules(existing.length > 0 ? existing : THEORY_MODULES.map((m, i) => ({ ...m, id: `local_${i}` })));
    } catch {
      setModules(THEORY_MODULES.map((m, i) => ({ ...m, id: `local_${i}` })));
    } finally {
      setLoading(false);
    }

    const progress = JSON.parse(localStorage.getItem("theory_progress") || "{}");
    setCompletedIds(new Set(Object.keys(progress).filter((key) => progress[key])));
  };

  const getAreaInfo = (areaCode) => SPEC_AREAS.find((area) => area.code === areaCode);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background" role="status" aria-label="Loading theory modules">
        <div className="h-9 w-9 animate-spin rounded-full border-2 border-tl-blue/25 border-t-tl-blue" />
      </div>
    );
  }

  return (
    <div className="clinical-page-shell min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(15,117,216,0.12),transparent_32%),radial-gradient(circle_at_top_right,rgba(39,181,168,0.10),transparent_28%)]">
      <main className="mx-auto max-w-4xl">
        <section className="polished-glass-edge mb-6 overflow-hidden rounded-[28px] border border-white/90 bg-white/85 p-6 shadow-[0_20px_45px_rgba(66,55,88,0.13),inset_0_1px_0_rgba(255,255,255,0.95)] backdrop-blur-xl sm:p-8">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-tl-blue to-sky-500 text-white shadow-[0_10px_20px_rgba(41,231,255,0.28),inset_0_1px_0_rgba(255,255,255,0.35)]">
              <BookOpen className="h-6 w-6" aria-hidden="true" />
            </div>
            <div>
              <p className="mb-1 text-xs font-bold uppercase tracking-[0.18em] text-tl-blue">T Level Health learning</p>
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">Theory Modules</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-700 sm:text-base">
                Core knowledge for specification Areas 1–9, presented in clear, focused reading sessions with progress checks.
              </p>
            </div>
          </div>
        </section>

        <section className="mb-7 rounded-[22px] border border-white/90 bg-white/75 p-4 shadow-[0_12px_28px_rgba(66,55,88,0.10),inset_0_1px_0_white] backdrop-blur-xl" aria-labelledby="curriculum-heading">
          <div className="mb-3 flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-tl-blue" aria-hidden="true" />
            <h2 id="curriculum-heading" className="text-sm font-bold text-slate-900">Curriculum areas</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {SPEC_AREAS.map((area) => (
              <span key={area.code} title={area.title} className="rounded-full border border-tl-blue/20 bg-tl-blue/10 px-3 py-1.5 text-xs font-bold text-tl-blue">
                {area.code}
              </span>
            ))}
          </div>
        </section>

        <div className="space-y-4" aria-label="Theory module list">
          {modules.map((module, idx) => {
            const isComplete = completedIds.has(module.spec_area);
            const area = getAreaInfo(module.spec_area);
            return (
              <button
                key={module.id}
                onClick={() => navigate(`/theory/${module.id}`, { state: { module } })}
                className="group polished-glass-edge w-full animate-slide-up rounded-[24px] border border-white/90 bg-white/88 p-6 text-left shadow-[0_12px_28px_rgba(66,55,88,0.10),inset_0_1px_0_white] transition-all duration-300 hover:-translate-y-1 hover:border-tl-blue/35 hover:shadow-[0_18px_38px_rgba(83,65,120,0.16),inset_0_1px_0_white] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-tl-blue/25"
                style={{ animationDelay: `${idx * 50}ms` }}
                aria-label={`Open ${module.title}${isComplete ? ", completed" : ""}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      {isComplete ? (
                        <CheckCircle className="h-5 w-5 shrink-0 text-emerald-600" aria-hidden="true" />
                      ) : (
                        <Circle className="h-5 w-5 shrink-0 text-slate-400" aria-hidden="true" />
                      )}
                      <span className="text-xs font-bold uppercase tracking-[0.12em] text-tl-blue">
                        {module.volume} · {module.spec_area}
                      </span>
                      {isComplete && <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800">Complete</span>}
                    </div>
                    <h3 className="mb-1 text-base font-extrabold leading-snug text-slate-950 sm:text-lg">{module.title}</h3>
                    {area && <p className="mb-3 text-sm leading-5 text-slate-700">{area.title}</p>}
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="flex items-center gap-1.5 text-sm font-medium text-slate-600">
                        <Clock className="h-4 w-4" aria-hidden="true" /> {module.estimated_duration} min
                      </span>
                      <SKBadgeGroup skCodes={module.sk_codes || []} poCodes={module.performance_outcomes || []} />
                    </div>
                  </div>
                  <span className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition-all group-hover:border-tl-blue/30 group-hover:bg-tl-blue group-hover:text-white">
                    <ChevronRight className="h-5 w-5" aria-hidden="true" />
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </main>
    </div>
  );
}

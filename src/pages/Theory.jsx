import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { isLoggedIn } from "@/lib/clinicalAuth";
import { SPEC_AREAS, THEORY_MODULES } from "@/lib/specData";
import { SKBadgeGroup } from "@/components/SKBadge";
import { BookOpen, Clock, ChevronRight, CheckCircle, Circle } from "lucide-react";

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
      if (existing.length > 0) {
        setModules(existing);
      } else {
        // Seeded locally if DB is empty
        setModules(THEORY_MODULES.map((m, i) => ({ ...m, id: `local_${i}` })));
      }
    } catch {
      setModules(THEORY_MODULES.map((m, i) => ({ ...m, id: `local_${i}` })));
    } finally {
      setLoading(false);
    }

    // Load completion from localStorage
    const progress = JSON.parse(localStorage.getItem("theory_progress") || "{}");
    setCompletedIds(new Set(Object.keys(progress).filter((k) => progress[k])));
  };

  const getAreaInfo = (areaCode) => SPEC_AREAS.find((a) => a.code === areaCode);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-clinical-navy">
        <div className="w-8 h-8 border-2 border-clinical-teal/30 border-t-clinical-teal rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-clinical-navy px-4 pt-6 pb-24 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-clinical-teal" />
          Theory Modules
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          T Level Health Specification — Core Component (Areas 1–9)
        </p>
      </div>

      {/* Spec areas overview */}
      <div className="mb-6 rounded-xl border border-border bg-card/40 p-3">
        <p className="text-xs font-semibold text-muted-foreground mb-2">CURRICULUM AREAS</p>
        <div className="flex flex-wrap gap-1.5">
          {SPEC_AREAS.map((area) => (
            <span key={area.code} className="text-[10px] rounded-md bg-muted/60 border border-border px-2 py-0.5 text-muted-foreground">
              {area.code}
            </span>
          ))}
        </div>
      </div>

      {/* Module list */}
      <div className="space-y-3">
        {modules.map((module, idx) => {
          const isComplete = completedIds.has(module.id);
          const area = getAreaInfo(module.spec_area);
          return (
            <button
              key={module.id}
              onClick={() => navigate(`/theory/${module.id}`, { state: { module } })}
              className="group w-full text-left rounded-xl border border-border bg-card/60 hover:bg-card/80 hover:border-clinical-teal/40 transition-all p-4 animate-slide-up"
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {isComplete ? (
                      <CheckCircle className="w-4 h-4 text-clinical-green shrink-0" />
                    ) : (
                      <Circle className="w-4 h-4 text-muted-foreground shrink-0" />
                    )}
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                      {module.volume} · {module.spec_area}
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-foreground mb-1">{module.title}</h3>
                  {area && <p className="text-xs text-muted-foreground mb-2">{area.title}</p>}
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" /> {module.estimated_duration} min
                    </span>
                    <SKBadgeGroup skCodes={module.sk_codes || []} poCodes={module.performance_outcomes || []} />
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-clinical-teal transition-colors shrink-0 mt-1" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
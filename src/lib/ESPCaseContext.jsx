import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";

const STORAGE_KEY = "pathfinder_active_esp_case_v1";
const ESPCaseContext = createContext(null);

export const DEFAULT_ESP_CASE = {
  case_id: "practice-amira-khan",
  case_name: "Amira Khan",
  case_summary: "A connected formative case spanning research, person-centred communication, care-plan review and professional handover.",
  status: "in_progress",
  active_task: "task-1",
  active_section: "brief",
  section_progress: "{}",
};

function readLocal() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "null"); } catch { return null; }
}

export function ESPCaseProvider({ children }) {
  const { user, isAuthenticated } = useAuth();
  const [portfolio, setPortfolio] = useState(readLocal);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const rows = await base44.entities.ESPPortfolio.filter({ student_id: user.id, status: "in_progress" }, "-updated_date", 1);
        if (alive && rows?.[0]) {
          setPortfolio(rows[0]);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(rows[0]));
        }
      } catch {
        // The local session keeps the experience usable if the remote portfolio is unavailable.
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [isAuthenticated, user?.id]);

  const persist = async (next) => {
    setPortfolio(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    if (!user?.id) return next;
    try {
      let saved;
      if (next.id) saved = await base44.entities.ESPPortfolio.update(next.id, next);
      else saved = await base44.entities.ESPPortfolio.create({ ...next, student_id: user.id, student_name: user.full_name || user.username || "Learner" });
      const merged = { ...next, ...saved };
      setPortfolio(merged);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      return merged;
    } catch {
      return next;
    }
  };

  const startCase = () => persist({ ...DEFAULT_ESP_CASE, ...(portfolio || {}), status: "in_progress" });

  const enterSection = (taskId, sectionId) => {
    const base = portfolio || DEFAULT_ESP_CASE;
    return persist({ ...base, active_task: taskId, active_section: sectionId, status: "in_progress" });
  };

  const setSectionComplete = (sectionId, complete) => {
    const base = portfolio || DEFAULT_ESP_CASE;
    let progress = {};
    try { progress = JSON.parse(base.section_progress || "{}"); } catch {}
    progress[sectionId] = complete;
    return persist({ ...base, section_progress: JSON.stringify(progress) });
  };

  const exitCase = () => {
    setPortfolio(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const value = useMemo(() => ({ portfolio, loading, startCase, enterSection, setSectionComplete, exitCase }), [portfolio, loading]);
  return <ESPCaseContext.Provider value={value}>{children}</ESPCaseContext.Provider>;
}

export function useESPCase() {
  const value = useContext(ESPCaseContext);
  if (!value) throw new Error("useESPCase must be used within ESPCaseProvider");
  return value;
}

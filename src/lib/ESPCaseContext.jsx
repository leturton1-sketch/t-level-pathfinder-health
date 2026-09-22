import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { getCurrentUser, isLoggedIn } from "@/lib/clinicalAuth";
import { createPortfolioForCase, getESPCase } from "@/lib/espCaseData";

import { getModuleGeneration } from "./moduleSession";

const STORAGE_KEY = "pathfinder_active_esp_case_v1";
const ESPCaseContext = createContext(null);

export const DEFAULT_ESP_CASE = createPortfolioForCase(getESPCase("practice-amira-khan"));



export function ESPCaseProvider({ children }) {
  const user = getCurrentUser();
  const isAuthenticated = isLoggedIn();
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => { setPortfolio(null); }, [isAuthenticated, user?.id]);

  const persist = async (next) => {
    if (!portfolio) return null;
    const generation = getModuleGeneration();
    setPortfolio(next);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
    if (!user?.id) return next;
    try {
      let saved;
      if (next.id) {
        const payload = { ...next };
        delete payload.id;
        delete payload.created_date;
        delete payload.updated_date;
        delete payload.created_by_id;
        saved = await base44.entities.ESPPortfolio.update(next.id, payload);
      } else saved = await base44.entities.ESPPortfolio.create({ ...next, student_id: user.id, student_name: user.full_name || user.username || "Learner" });
      const merged = { ...next, ...saved };
      if (generation !== getModuleGeneration()) return null;
      setPortfolio(merged);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      return merged;
    } catch {
      return next;
    }
  };

  const startCase = async (caseId = DEFAULT_ESP_CASE.case_id) => {
    const generation = getModuleGeneration();
    const caseData = getESPCase(caseId);
    setLoading(true);
    try {
      let next = portfolio?.case_id === caseData.id ? portfolio : null;
      if (!next && user?.id) {
        const rows = await base44.entities.ESPPortfolio.filter({ student_id: user.id, case_id: caseData.id }, "-updated_date", 1);
        next = rows?.[0] || null;
      }
      if (!next) {
        try {
          const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
          if (saved?.student_id === user?.id && saved?.case_id === caseData.id) next = saved;
        } catch {}
      }
      if (!next) {
        next = { ...createPortfolioForCase(caseData), student_id: user?.id };
        if (user?.id && generation === getModuleGeneration()) {
          next = await base44.entities.ESPPortfolio.create({ ...next, student_name: user.full_name || user.username || "Learner" });
        }
      }
      if (generation !== getModuleGeneration()) return null;
      setPortfolio(next);
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
      return next;
    } finally {
      if (generation === getModuleGeneration()) setLoading(false);
    }
  };

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

  const updatePortfolio = (patch) => persist({ ...(portfolio || DEFAULT_ESP_CASE), ...patch });

  const resetProgress = () => {
    const base = portfolio || DEFAULT_ESP_CASE;
    return persist({ ...base, section_progress: "{}" });
  };

  const exitCase = () => {
    setPortfolio(null);
    // Keep saved evidence available for an explicit Start or resume action.
  };

  const value = useMemo(() => ({ portfolio, loading, startCase, enterSection, setSectionComplete, updatePortfolio, resetProgress, exitCase }), [portfolio, loading]);
  return <ESPCaseContext.Provider value={value}>{children}</ESPCaseContext.Provider>;
}

export function useESPCase() {
  const value = useContext(ESPCaseContext);
  if (!value) throw new Error("useESPCase must be used within ESPCaseProvider");
  return value;
}

import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { THEORY_MODULES, getKnowledgeChecks } from "@/lib/theoryContent";
import { base44 } from "@/api/base44Client";

/**
 * buildTheoryModuleContext — formats the active theory module into a
 * system-prompt section so the AI assistant can answer questions using
 * the exact content the student is currently studying.
 */
export function buildTheoryModuleContext(module) {
  if (!module) return "";
  const checks = getKnowledgeChecks(module);
  const checkSummary = checks.length > 0
    ? checks.slice(0, 10).map((c, i) => `Q${i + 1}: ${c.question}`).join("\n")
    : "No knowledge checks available.";
  return `
CURRENT THEORY MODULE — the student is studying this module right now
Title: ${module.title}
Specification area: ${module.spec_area}
Section: ${module.section || "N/A"}
Volume: ${module.volume || "N/A"}
Skill codes: ${(module.sk_codes || []).join(", ") || "N/A"}
Performance outcomes: ${(module.performance_outcomes || []).join(", ") || "N/A"}

Module content:
${module.content || "No content available."}

Knowledge check questions:
${checkSummary}

When answering, draw on the module content above. Help the student understand the concepts, prepare for the knowledge checks, and connect the theory to clinical practice. Stay within the scope of this module unless the student explicitly asks about other topics.`;
}

/**
 * useTheoryContext — tracks the current route and returns the theory
 * module the student is viewing, or null when not on a theory page.
 * Handles both local modules (local_0 … local_26) and database modules.
 */
export function useTheoryContext() {
  const location = useLocation();
  const [activeModule, setActiveModule] = useState(null);

  useEffect(() => {
    const path = location.pathname;
    const match = path.match(/^\/theory\/(.+)$/);
    if (!match) {
      setActiveModule(null);
      return;
    }
    const moduleId = decodeURIComponent(match[1]);

    // Local modules use local_<index> IDs.
    if (moduleId.startsWith("local_")) {
      const idx = parseInt(moduleId.replace("local_", ""), 10);
      setActiveModule(THEORY_MODULES[idx] || null);
      return;
    }

    // Database modules: fetch the full record so the AI has the content.
    let cancelled = false;
    base44.entities.TheoryModule.get(moduleId)
      .then((m) => { if (!cancelled) setActiveModule(m); })
      .catch(() => { if (!cancelled) setActiveModule(null); });
    return () => { cancelled = true; };
  }, [location.pathname]);

  return activeModule;
}
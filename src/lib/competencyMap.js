import { SK_CODES, PERFORMANCE_OUTCOMES } from "@/lib/specData";
import { THEORY_MODULES } from "@/lib/theoryContent";
import { LEARNING_MODULES } from "@/lib/learningData";

/**
 * Unified SK/PO competency map across every learning context in Pathfinder.
 *
 * Aggregates skill-code and performance-outcome coverage from:
 *  - Theory modules (browser-saved completion)
 *  - Interactive learning modules (LearningProgress records)
 *  - Ward simulations (SimulationResult records)
 *  - Care plan submissions (CarePlanSubmission records)
 *  - ESP portfolios (ESPPortfolio records)
 *
 * Returns a single shape consumed by the Performance and Curriculum Readiness
 * pages so both views share one source of truth for competency coverage.
 */
export function buildCompetencyMap({
  theoryProgress = {},
  learningProgress = [],
  simulationResults = [],
  carePlanSubmissions = [],
  espPortfolios = [],
} = {}) {
  const contexts = {
    theory: { sk: new Set(), po: new Set(), items: [] },
    interactive: { sk: new Set(), po: new Set(), items: [] },
    simulation: { sk: new Set(), po: new Set(), items: [] },
    carePlan: { sk: new Set(), po: new Set(), items: [] },
    esp: { sk: new Set(), po: new Set(), items: [] },
  };

  // Theory — local completion flags mapped to module SK/PO codes.
  THEORY_MODULES.forEach((m) => {
    if (theoryProgress[m.spec_area]) {
      (m.sk_codes || []).forEach((c) => contexts.theory.sk.add(c));
      (m.performance_outcomes || []).forEach((c) => contexts.theory.po.add(c));
      contexts.theory.items.push(m.title || m.spec_area);
    }
  });

  // Interactive learning modules — persisted LearningProgress records.
  learningProgress.forEach((r) => {
    if (!r.completed) return;
    (r.sk_codes || []).forEach((c) => contexts.interactive.sk.add(c));
    (r.performance_outcomes || []).forEach((c) => contexts.interactive.po.add(c));
    contexts.interactive.items.push(r.module_title || r.module_id);
  });

  // Ward simulations.
  simulationResults.forEach((r) => {
    (r.sk_codes || []).forEach((c) => contexts.simulation.sk.add(c));
    (r.performance_outcomes || []).forEach((c) => contexts.simulation.po.add(c));
    contexts.simulation.items.push(r.scenario_name || r.scenario_id);
  });

  // Care plan submissions — only submitted/revised evidence counts.
  carePlanSubmissions
    .filter((s) => ["submitted", "reviewed", "revised"].includes(s.status))
    .forEach((s) => {
      (s.sk_codes || []).forEach((c) => contexts.carePlan.sk.add(c));
      (s.performance_outcomes || []).forEach((c) => contexts.carePlan.po.add(c));
      contexts.carePlan.items.push(s.title || s.type);
    });

  // ESP portfolio evidence — skills and performance outcomes evidenced.
  espPortfolios.forEach((p) => {
    (p.skills_evidenced || []).forEach((c) => contexts.esp.sk.add(c));
    (p.performance_outcomes_evidenced || []).forEach((c) => contexts.esp.po.add(c));
    if (p.case_name) contexts.esp.items.push(p.case_name);
  });

  // Unified totals.
  const coveredSK = new Set();
  const coveredPO = new Set();
  Object.values(contexts).forEach((ctx) => {
    ctx.sk.forEach((c) => coveredSK.add(c));
    ctx.po.forEach((c) => coveredPO.add(c));
  });

  const skTotal = Object.keys(SK_CODES).length;
  const poTotal = Object.keys(PERFORMANCE_OUTCOMES).length;

  return {
    coveredSK,
    coveredPO,
    contexts,
    stats: {
      skCovered: coveredSK.size,
      skTotal,
      skPct: skTotal ? Math.round((coveredSK.size / skTotal) * 100) : 0,
      poCovered: coveredPO.size,
      poTotal,
      poPct: poTotal ? Math.round((coveredPO.size / poTotal) * 100) : 0,
    },
  };
}

/**
 * Returns, for a given SK or PO code, the list of contexts that have evidenced it.
 * Useful for drill-down views in the competency matrix.
 */
export function evidenceSourcesFor(code, contexts) {
  const sources = [];
  Object.entries(contexts).forEach(([name, ctx]) => {
    if (ctx.sk.has(code) || ctx.po.has(code)) sources.push(name);
  });
  return sources;
}
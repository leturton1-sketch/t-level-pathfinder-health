import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * buildScenarioContext — formats the active clinical scenario into a
 * system-prompt section so the AI assistant can explain clinical reasoning
 * using the patient's details, vitals, and decision history.
 */
export function buildScenarioContext(state) {
  if (!state?.scenario) return "";
  const { scenario: s, vitals, decisions = [], currentPrompt } = state;
  const decisionLog = decisions.length > 0
    ? decisions.map((d, i) =>
        `  Step ${i + 1}: "${d.prompt}" → "${d.choice}" (${d.correct ? "Correct" : "Incorrect"}). Feedback: ${d.feedback}`
      ).join("\n")
    : "  No decisions made yet.";
  return `
ACTIVE CLINICAL SCENARIO — the student is working through this now
Scenario: ${s.name}
Patient: ${s.patient_name || "N/A"}, Age: ${s.patient_age ?? "N/A"}
Condition: ${s.patient_condition || "N/A"}
Comorbidities: ${s.patient_comorbidities || "None documented"}
Medications: ${s.patient_medications || "None documented"}
Allergies: ${s.patient_allergies || "None documented"}
NEWS2: ${s.initial_news2 ?? "N/A"}
Current vitals: RR ${vitals?.rr ?? "—"}, SpO₂ ${vitals?.spo2 ?? "—"}, SBP ${vitals?.sbp ?? "—"}, HR ${vitals?.hr ?? "—"}, Temp ${vitals?.temp ?? "—"}, AVPU ${vitals?.avpu ?? "—"}
Current prompt: ${currentPrompt || "Scenario complete — awaiting debrief"}

Decision log:
${decisionLog}

You are actively guiding the student through this clinical scenario. Explain the clinical reasoning behind each decision, connecting it to the patient's condition, vitals, and the ABCDE, NEWS2, and SBAR frameworks. Help the student develop clinical judgement by explaining why a choice is correct or incorrect, not just what the right answer is.`;
}

/**
 * useScenarioContext — listens for scenario-decision events broadcast by
 * the ScenarioDecisionPanel and returns the latest scenario state so the
 * AI assistant stays context-aware throughout the scenario. Clears when
 * the student navigates away from the ward simulation.
 */
export function useScenarioContext() {
  const location = useLocation();
  const [scenarioState, setScenarioState] = useState(null);

  useEffect(() => {
    if (location.pathname !== "/ward-simulation") {
      setScenarioState(null);
    }
  }, [location.pathname]);

  useEffect(() => {
    const handler = (e) => setScenarioState(e.detail);
    window.addEventListener("scenario-decision", handler);
    return () => window.removeEventListener("scenario-decision", handler);
  }, []);

  return scenarioState;
}
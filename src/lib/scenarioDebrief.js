import { getDecisionTree } from "@/lib/scenarioDecisionTrees";

/**
 * Reconstruct the optimal (correct) pathway through a scenario's decision
 * tree — the sequence of correct choices from the entry node to the end,
 * capturing each step's prompt, the correct action, and the teaching rationale.
 *
 * The authored trees are linear (every option at a node advances to the same
 * `next`), so following the correct option's `next` walks the full intended
 * pathway. A visited-guard prevents any malformed loop from running forever.
 */
export function getCorrectPathway(scenario) {
  const tree = getDecisionTree(scenario);
  const steps = [];
  let nodeId = tree.entry;
  const visited = new Set();
  while (nodeId && tree.nodes[nodeId] && !visited.has(nodeId)) {
    visited.add(nodeId);
    const node = tree.nodes[nodeId];
    const correctOption = (node.options || []).find((o) => o.correct) || (node.options || [])[0];
    if (!correctOption) break;
    steps.push({
      nodeId,
      prompt: node.prompt,
      correctChoice: correctOption.label,
      feedback: correctOption.feedback,
    });
    nodeId = correctOption.next;
  }
  return steps;
}

/**
 * Derive patient-specific key learning points from the scenario's patient
 * details (allergies, medications, comorbidities, presentation, NEWS2) plus
 * targeted reminders for any steps the learner answered incorrectly. These
 * tie the generic clinical principles in the tree to THIS patient.
 */
export function getPatientLearningPoints(scenario, decisions = []) {
  const points = [];
  const name = scenario?.patient_name || "the patient";
  const allergies = String(scenario?.patient_allergies || "").trim();
  const medications = String(scenario?.patient_medications || "").trim();
  const comorbidities = String(scenario?.patient_comorbidities || "").trim();
  const condition = String(scenario?.patient_condition || "").trim();
  const news2 = scenario?.initial_news2;

  if (allergies && !/^(no known|nil|none|nkda|nka|no known drug allergies|no known allergies)$/i.test(allergies)) {
    points.push(`${name} is allergic to ${allergies}. Confirm allergy status before any medication administration and record it clearly in the drug chart and handover.`);
  }
  if (medications) {
    points.push(`${name}'s current medications (${medications}) may contribute to the presentation. Review the prescription, timing and side-effect profile before acting, and check for interactions.`);
  }
  if (comorbidities) {
    points.push(`${name} has comorbidities (${comorbidities}). These shape assessment priorities, escalation thresholds and the care plan — tailor your approach rather than applying generic care.`);
  }
  if (condition) {
    points.push(`Presentation: ${condition}. Use this to interpret ${name}'s vital signs and prioritise the right assessments.`);
  }
  if (Number.isFinite(news2)) {
    const tier = news2 >= 7
      ? "emergency response — continuous monitoring and urgent senior review now"
      : news2 >= 5
        ? "urgent response — at least hourly monitoring and prompt clinician assessment"
        : news2 >= 3
          ? "increased monitoring frequency and registered nurse review"
          : "routine monitoring, reassessing as clinically indicated";
    points.push(`NEWS2 ${news2} triggers a ${tier}. Match your escalation to the correct threshold for ${name}.`);
  }

  const wrong = (decisions || []).filter((d) => !d.correct);
  if (wrong.length) {
    points.push(`You answered ${wrong.length} step${wrong.length > 1 ? "s" : ""} incorrectly. Revisit the correct pathway below and re-attempt the scenario to consolidate ${name}'s care priorities.`);
  } else if (decisions.length) {
    points.push(`You completed every step correctly for ${name}. Rehearse this pathway until the escalation thresholds and SBAR handover are automatic.`);
  }

  return points;
}
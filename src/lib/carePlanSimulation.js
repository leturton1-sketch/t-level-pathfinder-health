export const CARE_PLAN_SIMULATIONS = {
  elvis: {
    briefing: "Prioritise respiratory deterioration, diabetes, constipation, medicines safety and timely escalation.",
    expected: ["recognise NEWS2 8 and urgent escalation", "use COPD oxygen target 88–92% and avoid unprescribed high-flow oxygen", "address CBG 15.2 mmol/L", "document constipation and fluid status", "use SBAR and person-centred consent"],
    tools: [
      { id: "admission", label: "Admission & immediate priorities" },
      { id: "fluid", label: "Fluid balance" },
      { id: "medicines", label: "Medicine safety review" },
      { id: "careNote", label: "Care plan continuation" },
    ],
  },
  dolly: {
    briefing: "Plan post-operative care with pressure prevention, safe mobility, pain review and supported independence.",
    expected: ["identify very high pressure-ulcer risk", "apply SSKIN and two-hourly repositioning", "assess pain before and after movement", "use safe moving and handling", "preserve dignity and independence"],
    tools: [
      { id: "waterlow", label: "Waterlow risk record" },
      { id: "skinCheck", label: "Pressure-area daily check" },
      { id: "movingHandling", label: "Moving & handling plan" },
      { id: "careNote", label: "Person-centred care plan" },
    ],
  },
  gordon: {
    briefing: "Assess malnutrition and dehydration during an acute Crohn’s flare and make appropriate referrals.",
    expected: ["recognise likely high malnutrition risk", "record severe recent unplanned weight loss", "identify negative fluid balance risk", "refer to dietetics", "document stool losses and escalation"],
    tools: [
      { id: "must", label: "MUST recording worksheet" },
      { id: "fluid", label: "Fluid balance" },
      { id: "bmi", label: "BMI and clinical context" },
      { id: "mdt", label: "Dietitian / MDT referral" },
    ],
  },
  ozzy: {
    briefing: "Plan safe care following a fall with Parkinson’s disease, delirium and postural hypotension.",
    expected: ["recognise acute delirium and falls risk", "protect on-time Parkinson’s medication", "use TILE moving-and-handling principles", "apply decision-specific capacity assessment", "implement a falls prevention bundle"],
    tools: [
      { id: "mobility", label: "Mobility & falls assessment" },
      { id: "capacity", label: "Mental capacity assessment" },
      { id: "movingHandling", label: "Moving & handling plan" },
      { id: "incident", label: "Post-fall incident learning record" },
    ],
  },
  ladygaga: {
    briefing: "Provide trauma-informed, consent-led pain and skin care while managing a severe latex allergy.",
    expected: ["identify latex anaphylaxis risk and use nitrile gloves", "use dynamic consent before every touch", "assess pain before and after care", "document eczema and skin breakdown objectively", "apply emollient in hair-growth direction and avoid adhesive dressings"],
    tools: [
      { id: "wound", label: "Wound assessment" },
      { id: "skinCheck", label: "Skin integrity record" },
      { id: "careNote", label: "Person-centred care plan" },
      { id: "medicines", label: "Topical medicines review" },
    ],
  },
};

export function getCarePlanSimulation(patient) {
  if (!patient) return null;
  const configuration = CARE_PLAN_SIMULATIONS[patient.id] || {
    briefing: "Review the patient record, identify priorities and complete a person-centred care plan.",
    expected: ["use verified patient information", "identify immediate risks", "plan person-centred interventions", "document review and escalation"],
    tools: [{ id: "careNote", label: "Person-centred care plan" }, { id: "generalRisk", label: "General risk assessment" }],
  };
  return { ...configuration, patient };
}

export function storeCarePlanSimulation(patient, toolId) {
  const simulation = getCarePlanSimulation(patient);
  localStorage.setItem("active_care_plan_simulation", JSON.stringify({
    patient,
    toolId,
    briefing: simulation.briefing,
    expected: simulation.expected,
    startedAt: new Date().toISOString(),
  }));
}

export function loadCarePlanSimulation(toolId) {
  try {
    const stored = JSON.parse(localStorage.getItem("active_care_plan_simulation") || "null");
    return stored?.toolId === toolId ? stored : null;
  } catch {
    return null;
  }
}

function formatVitals(vitals = {}) {
  return [
    vitals.rr != null && `RR ${vitals.rr}`,
    vitals.spo2 != null && `SpO₂ ${vitals.spo2}%`,
    vitals.sbp != null && `BP ${vitals.sbp}/${vitals.dbp || "–"}`,
    vitals.hr != null && `HR ${vitals.hr}`,
    vitals.temp != null && `Temp ${vitals.temp}°C`,
    vitals.cbg != null && `CBG ${vitals.cbg} mmol/L`,
    vitals.avpu && `AVPU ${vitals.avpu}`,
  ].filter(Boolean).join(", ");
}

export function buildSimulationPrefill(template, simulation) {
  if (!simulation?.patient) return {};
  const patient = simulation.patient;
  const known = {
    patientId: `${patient.name} · NHS ${patient.nhs_number}`,
    dateTime: new Date().toISOString().slice(0, 16),
    preferredName: `${patient.name} (${patient.pronouns})`,
    dob: patient.dob?.split("/").reverse().join("-"),
    reason: patient.admission_reason,
    allergies: patient.allergies,
    history: `${patient.condition}. Comorbidities: ${patient.comorbidities}`,
    medicines: patient.medications,
    baseline: `${formatVitals(patient.initial_vitals)}; NEWS2 ${patient.initial_news2}`,
    currentMobility: patient.falls_risk ? "Mobility requires assessment; falls-risk flag present in record." : "",
    falls: patient.falls_risk ? "Falls-risk flag present in the EHR." : "",
    concerns: patient.condition,
  };

  return Object.fromEntries(
    template.fields
      .filter((field) => known[field.id] != null && known[field.id] !== "")
      .map((field) => [field.id, known[field.id]])
  );
}

const safetyTerms = /escalat|urgent|call|report|registered|senior|emergency|red flag|review|monitor/i;
const personTerms = /consent|choice|preference|dignity|independen|person.centred|explain|privacy/i;
const evidenceTerms = /because|evidence|result|score|observation|trend|risk|assessment|history/i;
const actionTerms = /plan|intervention|action|refer|reposition|support|administer|record|review/i;

export function localFormativeFeedback(template, values, simulation) {
  const required = template.fields.filter((field) => field.required);
  const completed = required.filter((field) => String(values[field.id] ?? "").trim() || (Array.isArray(values[field.id]) && values[field.id].length));
  const text = Object.values(values).flat().join(" ");
  const categories = {
    completeness: Math.round((completed.length / Math.max(required.length, 1)) * 100),
    clinicalReasoning: evidenceTerms.test(text) ? 70 : 45,
    safetyEscalation: safetyTerms.test(text) ? 75 : 40,
    personCentredCare: personTerms.test(text) ? 75 : 40,
    documentation: actionTerms.test(text) && text.length > 180 ? 75 : text.length > 80 ? 60 : 40,
  };
  const overall = Math.round(Object.values(categories).reduce((sum, value) => sum + value, 0) / Object.keys(categories).length);
  const strengths = [
    categories.completeness >= 80 ? "You completed the required sections consistently." : "You have started to organise the patient information into the correct clinical record.",
    evidenceTerms.test(text) ? "Your entry includes assessment evidence or observable clinical information." : "The record identifies the patient and creates a foundation for clinical reasoning.",
  ];
  const improvements = [
    !safetyTerms.test(text) && "State exactly what would trigger escalation, who you would contact and how urgently.",
    !personTerms.test(text) && "Show how consent, dignity, preferences and independence shape the plan.",
    !evidenceTerms.test(text) && "Link each intervention to an observation, risk, assessment result or patient-reported need.",
    text.length <= 180 && "Add measurable actions, review times and expected outcomes rather than brief general statements.",
  ].filter(Boolean);
  const nextSteps = (simulation?.expected || []).slice(0, 3);
  return {
    overallScore: overall,
    band: overall >= 80 ? "Secure" : overall >= 65 ? "Developing securely" : overall >= 50 ? "Developing" : "Needs further development",
    summary: "This is formative learning feedback. Compare it with tutor feedback and local clinical policy before applying learning in practice.",
    categoryScores: categories,
    strengths,
    improvements: improvements.length ? improvements : ["Add a final review statement showing how the patient response will change the plan."],
    nextSteps,
    safetyNote: "Simulation feedback does not replace supervision, authorised assessment tools or local escalation policy.",
  };
}

export const FORMATIVE_FEEDBACK_SCHEMA = {
  type: "object",
  properties: {
    overallScore: { type: "number" },
    band: { type: "string", enum: ["Secure", "Developing securely", "Developing", "Needs further development"] },
    summary: { type: "string" },
    categoryScores: {
      type: "object",
      properties: {
        completeness: { type: "number" },
        clinicalReasoning: { type: "number" },
        safetyEscalation: { type: "number" },
        personCentredCare: { type: "number" },
        documentation: { type: "number" },
      },
    },
    strengths: { type: "array", items: { type: "string" } },
    improvements: { type: "array", items: { type: "string" } },
    nextSteps: { type: "array", items: { type: "string" } },
    safetyNote: { type: "string" },
  },
  required: ["overallScore", "band", "summary", "categoryScores", "strengths", "improvements", "nextSteps", "safetyNote"],
};

export function buildFeedbackPrompt(template, values, simulation, deterministicFeedback) {
  const labelledAnswers = template.fields.map((field) => ({
    field: field.label,
    required: Boolean(field.required),
    answer: values[field.id] ?? "",
  }));
  return `Act as a formative T Level Health tutor. Assess this learner's simulated clinical documentation only; do not provide a diagnosis or claim clinical approval.

Record: ${template.title}
Pearson mapping: ${template.pearson.join("; ")}
Simulated patient: ${simulation?.patient?.name || "practice patient"}
Brief: ${simulation?.briefing || template.description}
Expected priorities: ${(simulation?.expected || []).join("; ")}
Clinical source guidance: ${template.guidance.join("; ")}
Learner entries: ${JSON.stringify(labelledAnswers)}
Baseline rubric result: ${JSON.stringify(deterministicFeedback.categoryScores)}

Score each category 0–100. Reward accurate, specific, measurable, person-centred and safety-conscious documentation. Do not reward invented facts. Flag omitted red flags or missing escalation. Give 2–4 specific strengths, 2–4 constructive improvements and 2–4 actionable next steps. Use supportive British English. State that feedback is formative and subject to tutor/local-policy review.`;
}

export const BODY_LAYER_ORDER = [
  "integumentary", "muscular", "skeletal", "nervous", "cardiovascular",
  "respiratory", "digestive", "urinary", "endocrine", "lymphatic", "reproductive",
];

export const PATHOPHYSIOLOGY_CONDITIONS = [
  {
    id: "asthma", name: "Acute asthma", system: "respiratory", structureId: "lungs",
    summary: "Inflamed, hyper-responsive bronchi constrict and produce mucus, increasing airway resistance and trapping air.",
    animation: "Bronchi narrow while the lungs pulse rapidly; cyan oxygen light falls as obstruction increases.",
    signs: ["Wheeze", "Tachypnoea", "Reduced SpO₂", "Difficulty speaking"],
    priorities: ["Sit upright", "ABCDE assessment", "Prescribed bronchodilator", "Oxygen to prescribed target", "Escalate if silent chest or exhaustion"],
  },
  {
    id: "myocardial_infarction", name: "Myocardial infarction", system: "cardiovascular", structureId: "heart",
    summary: "Coronary artery occlusion interrupts oxygen delivery to myocardium, causing ischaemia and cell death.",
    animation: "A focal heart segment darkens while compensatory rate and contractility rise.",
    signs: ["Central chest pressure", "Diaphoresis", "Nausea", "ECG change"],
    priorities: ["ABCDE assessment", "12-lead ECG", "Urgent escalation", "Prescribed antiplatelet treatment", "Monitor rhythm"],
  },
  {
    id: "stroke", name: "Acute stroke", system: "nervous", structureId: "brain",
    summary: "Cerebral blood flow is interrupted by thrombus or haemorrhage, producing focal neurological deficit.",
    animation: "One cerebral hemisphere loses perfusion and affected neural signalling fades.",
    signs: ["Facial weakness", "Arm drift", "Speech disturbance", "Sudden onset"],
    priorities: ["FAST assessment", "Record last known well", "Check glucose", "Urgent stroke pathway", "Keep nil by mouth until swallow screen"],
  },
  {
    id: "sepsis", name: "Sepsis", system: "lymphatic", structureId: "lymph_nodes",
    summary: "A dysregulated response to infection causes vasodilation, capillary leak, impaired perfusion and organ dysfunction.",
    animation: "Immune nodes flare while vascular tone falls and organ warning lights spread.",
    signs: ["Fever or hypothermia", "Tachycardia", "Confusion", "Hypotension"],
    priorities: ["Recognise deterioration", "Urgent escalation", "Blood cultures/lactate as directed", "Antimicrobials and fluids as prescribed", "Monitor urine output"],
  },
  {
    id: "diabetes", name: "Diabetic hyperglycaemia", system: "endocrine", structureId: "pancreas_endocrine",
    summary: "Insufficient insulin action prevents glucose entering cells, causing hyperglycaemia, osmotic diuresis and dehydration.",
    animation: "Pancreatic signal reduces while glucose particles accumulate in the circulation.",
    signs: ["Polyuria", "Polydipsia", "Fatigue", "Raised capillary glucose"],
    priorities: ["Check glucose and ketones", "Assess hydration", "Follow prescribed insulin plan", "Monitor neurological state", "Escalate suspected DKA/HHS"],
  },
  {
    id: "aki", name: "Acute kidney injury", system: "urinary", structureId: "kidneys",
    summary: "A sudden fall in renal filtration causes retention of fluid, electrolytes and metabolic waste.",
    animation: "Kidney filtration glow slows and fluid accumulates around the body.",
    signs: ["Oliguria", "Rising creatinine", "Oedema", "Confusion"],
    priorities: ["Strict fluid balance", "Review nephrotoxic medicines", "Assess volume status", "Repeat observations", "Escalate oliguria or hyperkalaemia"],
  },
  {
    id: "pressure_injury", name: "Pressure injury", system: "integumentary", structureId: "skin",
    summary: "Sustained pressure and shear compromise capillary perfusion, causing local tissue ischaemia and breakdown.",
    animation: "A pressure point changes from blanching pink to deeper red-purple tissue damage.",
    signs: ["Non-blanching erythema", "Pain", "Skin warmth", "Tissue breakdown"],
    priorities: ["Relieve pressure", "Reposition safely", "Skin inspection", "Pressure-risk assessment", "Nutrition and hydration review"],
  },
];

export const STANDARDISED_PATIENTS = [
  {
    id: "asthma-amina", conditionId: "asthma", name: "Amina Yusuf", age: 19, pronouns: "she/her",
    history: "Asthma; symptoms worsened after cleaning-spray exposure.",
    baseline: { rr: 30, spo2: 91, hr: 118, sbp: 132, temp: 37.1, avpu: "A", pain: 2 },
    required: ["rr", "spo2", "hr", "sbp", "temp", "avpu"],
    choices: [
      { id: "upright", label: "Sit Amina upright and begin ABCDE", effect: 2, rationale: "Improves ventilation and establishes a safe structured assessment." },
      { id: "bronchodilator", label: "Support prescribed bronchodilator administration", effect: 3, rationale: "Treats reversible bronchoconstriction; reassess response." },
      { id: "leave", label: "Leave flat and recheck in 30 minutes", effect: -4, rationale: "Delays treatment during hypoxaemia and risks exhaustion." },
      { id: "escalate", label: "Escalate urgently if speech or air entry worsens", effect: 3, rationale: "Recognises life-threatening features and activates senior support." },
    ],
  },
  {
    id: "sepsis-arthur", conditionId: "sepsis", name: "Arthur Bennett", age: 72, pronouns: "he/him",
    history: "Two-day urinary symptoms; now confused and shivering.",
    baseline: { rr: 26, spo2: 94, hr: 124, sbp: 86, temp: 39.1, avpu: "V", pain: 4 },
    required: ["rr", "spo2", "hr", "sbp", "temp", "avpu"],
    choices: [
      { id: "escalate", label: "Recognise possible sepsis and escalate immediately", effect: 4, rationale: "Hypotension and new confusion require urgent senior review." },
      { id: "cultures", label: "Prepare cultures, lactate and prescribed treatment", effect: 3, rationale: "Supports time-critical diagnosis and treatment without delaying escalation." },
      { id: "oral", label: "Offer oral fluids and wait for the next routine round", effect: -4, rationale: "Unsafe in altered consciousness and inadequate for shock." },
      { id: "output", label: "Start strict fluid balance and monitor urine output", effect: 2, rationale: "Urine output is a key marker of renal perfusion and deterioration." },
    ],
  },
  {
    id: "stroke-lee", conditionId: "stroke", name: "Lee Morgan", age: 64, pronouns: "they/them",
    history: "Sudden right facial weakness and slurred speech 25 minutes ago.",
    baseline: { rr: 18, spo2: 96, hr: 88, sbp: 178, temp: 36.8, avpu: "A", pain: 1 },
    required: ["rr", "spo2", "hr", "sbp", "temp", "avpu"],
    choices: [
      { id: "fast", label: "Complete FAST and record last known well", effect: 4, rationale: "Supports rapid stroke identification and treatment eligibility." },
      { id: "glucose", label: "Check capillary blood glucose", effect: 2, rationale: "Hypoglycaemia can mimic acute stroke." },
      { id: "drink", label: "Give a drink to test swallowing", effect: -4, rationale: "Creates aspiration risk before a formal swallow screen." },
      { id: "pathway", label: "Activate the urgent stroke pathway", effect: 4, rationale: "Time-critical imaging and specialist assessment improve outcomes." },
    ],
  },
];

export function calculateScenarioFeedback(patient, observations, selectedChoices) {
  const missing = patient.required.filter((key) => observations[key] === "" || observations[key] == null);
  const expected = patient.baseline;
  const tolerance = { rr: 3, spo2: 2, hr: 8, sbp: 10, temp: 0.5 };
  const measured = patient.required.filter((key) => observations[key] !== "" && observations[key] != null);
  const accurate = measured.filter((key) => key === "avpu" ? observations[key] === expected[key] : Math.abs(Number(observations[key]) - expected[key]) <= tolerance[key]).length;
  const decisions = patient.choices.filter((choice) => selectedChoices.includes(choice.id));
  const decisionScore = decisions.reduce((sum, choice) => sum + choice.effect, 0);
  const score = Math.max(0, Math.min(100, Math.round((accurate / patient.required.length) * 45 + (Math.max(0, decisionScore) / 10) * 45 + (missing.length ? 0 : 10))));
  const outcome = decisionScore >= 7 ? "improving" : decisionScore >= 3 ? "stable" : "deteriorating";
  return {
    score, outcome, missing, accurate, decisionScore,
    strengths: [
      ...(accurate >= 5 ? ["Recorded a complete and clinically plausible observation set."] : []),
      ...(decisionScore >= 7 ? ["Selected timely interventions that address the underlying pathophysiology."] : []),
      ...(selectedChoices.some((id) => id === "escalate" || id === "pathway") ? ["Recognised the need for prompt escalation."] : []),
    ],
    improvements: [
      ...(missing.length ? [`Complete every required observation: ${missing.join(", ").toUpperCase()}.`] : []),
      ...(accurate < 4 ? ["Recheck measurements against the patient presentation and identify abnormal trends."] : []),
      ...(decisionScore < 7 ? ["Prioritise ABCDE, time-critical treatment and escalation before non-urgent care."] : []),
    ],
  };
}

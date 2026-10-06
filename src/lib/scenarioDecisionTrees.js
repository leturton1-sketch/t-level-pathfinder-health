/**
 * Scenario decision-tree resolution.
 *
 * Custom scenarios (authored in ScenarioAuthoring) store a branching tree as a
 * JSON string in `scenario.decision_tree` using the shape produced by
 * DecisionTreeEditor:
 *   { entry: "n1", nodes: { n1: { id, prompt, options: [{ id, label, correct, feedback, next }] } } }
 *
 * Prebuilt scenarios and ward patients do not carry a tree, so we fall back to
 * a category-specific default tree (or a generic ABCDE tree) so every clinical
 * scenario still plays a tailored, meaningful decision pathway.
 */

const GENERIC_TREE = {
  entry: "n1",
  nodes: {
    n1: {
      id: "n1",
      prompt: "The patient is on the ward and looks unwell. What is your first action?",
      options: [
        { id: "o1", label: "Perform a full structured ABCDE assessment", correct: true, feedback: "Correct — systematic assessment is always the first priority.", next: "n2" },
        { id: "o2", label: "Administer prescribed medication", correct: false, feedback: "Assess before intervening — always follow the ABCDE approach.", next: "n2" },
        { id: "o3", label: "Call the doctor immediately", correct: false, feedback: "Assess the patient first — you need information to escalate effectively.", next: "n2" },
      ],
    },
    n2: {
      id: "n2",
      prompt: "NEWS2 is {news2}. What should you do?",
      options: [
        { id: "o1", label: "Escalate using SBAR at the correct threshold", correct: true, feedback: "Correct — appropriate escalation based on the NEWS2 score.", next: "n3" },
        { id: "o2", label: "Document only and continue", correct: false, feedback: "Escalation is required — documenting alone is insufficient.", next: "n3" },
        { id: "o3", label: "Reassess in 1 hour", correct: false, feedback: "Do not delay — escalate now.", next: "n3" },
      ],
    },
    n3: {
      id: "n3",
      prompt: "The patient needs ongoing care. Which intervention is appropriate?",
      options: [
        { id: "o1", label: "Implement a person-centred care plan", correct: true, feedback: "Correct — care should always be person-centred and evidence-based.", next: null },
        { id: "o2", label: "Apply standard care without assessment", correct: false, feedback: "All care must be individualised.", next: null },
        { id: "o3", label: "Wait for doctor's orders before any action", correct: false, feedback: "Nursing care continues independently.", next: null },
      ],
    },
  },
};

const CATEGORY_TREES = {
  deterioration: {
    entry: "d1",
    nodes: {
      d1: {
        id: "d1",
        prompt: "{patient} is deteriorating — RR elevated, SpO₂ reduced, tachycardic. What is your first action?",
        options: [
          { id: "o1", label: "Perform a structured ABCDE assessment", correct: true, feedback: "Correct — recognise deterioration early and assess systematically before intervening.", next: "d2" },
          { id: "o2", label: "Increase oxygen to high-flow immediately", correct: false, feedback: "Assess first — oxygen must be prescribed and titrated to the target range.", next: "d2" },
          { id: "o3", label: "Give the next prescribed analgesia", correct: false, feedback: "Assess before administering medication — the cause of deterioration is not yet established.", next: "d2" },
        ],
      },
      d2: {
        id: "d2",
        prompt: "NEWS2 is {news2}. What is the correct response?",
        options: [
          { id: "o1", label: "Emergency response — continuous monitoring and senior review now", correct: true, feedback: "Correct — a NEWS2 of 7 or more triggers an emergency response with continuous monitoring.", next: "d3" },
          { id: "o2", label: "Reassess in one hour", correct: false, feedback: "Do not delay — a high NEWS2 requires urgent escalation.", next: "d3" },
          { id: "o3", label: "Document and continue routine observations", correct: false, feedback: "Routine monitoring is insufficient at this score.", next: "d3" },
        ],
      },
      d3: {
        id: "d3",
        prompt: "Escalation is required. How will you communicate with the medical team?",
        options: [
          { id: "o1", label: "Use SBAR — Situation, Background, Assessment, Recommendation", correct: true, feedback: "Correct — SBAR delivers a concise, structured escalation.", next: "d4" },
          { id: "o2", label: "Describe everything you can see without a clear ask", correct: false, feedback: "A clear recommendation and timeframe are essential.", next: "d4" },
          { id: "o3", label: "Ask a colleague to call later", correct: false, feedback: "Escalate personally and promptly.", next: "d4" },
        ],
      },
      d4: {
        id: "d4",
        prompt: "While awaiting review, what ongoing care is priority?",
        options: [
          { id: "o1", label: "Maintain observations, check VTE prophylaxis, wound site, fluid balance and comfort", correct: true, feedback: "Correct — continue holistic post-operative monitoring while the patient is deteriorating.", next: null },
          { id: "o2", label: "Only recheck the wound dressing", correct: false, feedback: "Monitor the whole patient — fluid balance, VTE prophylaxis and pain matter too.", next: null },
          { id: "o3", label: "Nothing until the doctor reviews", correct: false, feedback: "Nursing care continues independently while awaiting review.", next: null },
        ],
      },
    },
  },
  infection_control: {
    entry: "i1",
    nodes: {
      i1: {
        id: "i1",
        prompt: "{patient} is a new admission with a confirmed transmissible infection. What is your first action?",
        options: [
          { id: "o1", label: "Allocate a side room and initiate contact precautions", correct: true, feedback: "Correct — source isolation protects other patients immediately.", next: "i2" },
          { id: "o2", label: "Place the patient in the main bay", correct: false, feedback: "A confirmed transmissible infection requires isolation, not open-bay care.", next: "i2" },
          { id: "o3", label: "Begin antibiotics before any isolation", correct: false, feedback: "Isolation comes first to prevent cross-infection.", next: "i2" },
        ],
      },
      i2: {
        id: "i2",
        prompt: "Which PPE and hand hygiene is appropriate for contact precautions?",
        options: [
          { id: "o1", label: "Gloves and apron, with hand hygiene before and after every episode of care", correct: true, feedback: "Correct — standard contact precautions plus rigorous hand hygiene.", next: "i3" },
          { id: "o2", label: "Full sterile theatre gown for all contact", correct: false, feedback: "Sterile gowns are not required for standard contact precautions.", next: "i3" },
          { id: "o3", label: "No PPE if the patient is asymptomatic", correct: false, feedback: "PPE is required regardless of symptoms once the infection is confirmed.", next: "i3" },
        ],
      },
      i3: {
        id: "i3",
        prompt: "How will you manage equipment and waste for this patient?",
        options: [
          { id: "o1", label: "Dedicate equipment where possible, decontaminate shared items, segregate waste correctly", correct: true, feedback: "Correct — dedicated equipment and correct waste streams limit environmental contamination.", next: "i4" },
          { id: "o2", label: "Share all equipment without cleaning", correct: false, feedback: "Shared equipment must be decontaminated between patients.", next: "i4" },
          { id: "o3", label: "Place all waste in the general domestic stream", correct: false, feedback: "Infectious waste must be segregated into the correct stream.", next: "i4" },
        ],
      },
      i4: {
        id: "i4",
        prompt: "How will you maintain the patient's dignity while in isolation?",
        options: [
          { id: "o1", label: "Explain the reason for isolation, ensure call bell, TV and regular meaningful interaction", correct: true, feedback: "Correct — isolation must not become social deprivation.", next: null },
          { id: "o2", label: "Keep the door closed and minimise all visits", correct: false, feedback: "Dignity and interaction must be preserved during isolation.", next: null },
          { id: "o3", label: "Restrict all activities of daily living to the side room only", correct: false, feedback: "ADLs continue — restriction is not the goal, safe care is.", next: null },
        ],
      },
    },
  },
  fluid_management: {
    entry: "f1",
    nodes: {
      f1: {
        id: "f1",
        prompt: "{patient} is breathless with fluid overload — RR raised, SpO₂ low on oxygen, hypertensive. What is your first action?",
        options: [
          { id: "o1", label: "ABCDE assessment and sit the patient upright", correct: true, feedback: "Correct — upright positioning eases breathing while you assess.", next: "f2" },
          { id: "o2", label: "Lie the patient flat to rest", correct: false, feedback: "Lying flat worsens pulmonary congestion and breathlessness.", next: "f2" },
          { id: "o3", label: "Offer a drink of water", correct: false, feedback: "Fluid intake may worsen overload — assess first.", next: "f2" },
        ],
      },
      f2: {
        id: "f2",
        prompt: "Which monitoring must you initiate for this patient?",
        options: [
          { id: "o1", label: "Accurate fluid balance chart, daily weight and strict intake–output recording", correct: true, feedback: "Correct — fluid balance and daily weight are central to managing overload.", next: "f3" },
          { id: "o2", label: "Record urine output only", correct: false, feedback: "All intake and output must be charted, not only urine.", next: "f3" },
          { id: "o3", label: "No fluid monitoring — the diuretic handles it", correct: false, feedback: "Monitoring is still required to assess response and detect imbalance.", next: "f3" },
        ],
      },
      f3: {
        id: "f3",
        prompt: "The doctor prescribes IV furosemide. What is your role?",
        options: [
          { id: "o1", label: "Administer as prescribed, monitor response, check U&Es and escalate deterioration", correct: true, feedback: "Correct — administer, monitor effect and electrolytes, and escalate.", next: "f4" },
          { id: "o2", label: "Refuse — it is not a nursing role", correct: false, feedback: "Administration within competence and prescription is a supported nursing role.", next: "f4" },
          { id: "o3", label: "Give it without checking the prescription", correct: false, feedback: "Always check the prescription and allergy status before administration.", next: "f4" },
        ],
      },
      f4: {
        id: "f4",
        prompt: "What person-centred explanation will you give the patient?",
        options: [
          { id: "o1", label: "Explain the plan, agree a comfortable position and a fluid target, and reassure", correct: true, feedback: "Correct — person-centred communication supports adherence and dignity.", next: null },
          { id: "o2", label: "Tell the patient nothing to avoid worry", correct: false, feedback: "Honest, accessible explanation is part of consent and care.", next: null },
          { id: "o3", label: "Restrict all fluids without explanation", correct: false, feedback: "Restriction must be explained and agreed, not imposed silently.", next: null },
        ],
      },
    },
  },
  falls_risk: {
    entry: "fa1",
    nodes: {
      fa1: {
        id: "fa1",
        prompt: "{patient} is confused and at high risk of falls. What is your first action?",
        options: [
          { id: "o1", label: "Complete a structured falls risk assessment (Morse / FRAT)", correct: true, feedback: "Correct — a validated tool identifies risk and guides prevention.", next: "fa2" },
          { id: "o2", label: "Restrain the patient to the bed", correct: false, feedback: "Restraint is a last resort and must be justified — assess first.", next: "fa2" },
          { id: "o3", label: "Only document that a fall occurred", correct: false, feedback: "Assessment and prevention are required, not documentation alone.", next: "fa2" },
        ],
      },
      fa2: {
        id: "fa2",
        prompt: "The patient is confused with an elevated temperature. What could this indicate?",
        options: [
          { id: "o1", label: "Possible delirium due to infection (e.g. UTI) — escalate for investigation", correct: true, feedback: "Correct — acute confusion with fever suggests delirium and needs investigation.", next: "fa3" },
          { id: "o2", label: "Normal ageing", correct: false, feedback: "Acute confusion is not normal ageing and must be investigated.", next: "fa3" },
          { id: "o3", label: "Nothing to worry about", correct: false, feedback: "Acute change is always clinically significant.", next: "fa3" },
        ],
      },
      fa3: {
        id: "fa3",
        prompt: "Which falls prevention bundle should you implement?",
        options: [
          { id: "o1", label: "Bed low, call bell in reach, non-slip footwear, remove trip hazards, regular checks", correct: true, feedback: "Correct — a multifactorial bundle reduces fall risk.", next: "fa4" },
          { id: "o2", label: "Bed rails only", correct: false, feedback: "Bed rails alone can increase harm and are not a complete plan.", next: "fa4" },
          { id: "o3", label: "Nothing — the patient is already in bed", correct: false, feedback: "Prevention is still required even when in bed.", next: "fa4" },
        ],
      },
      fa4: {
        id: "fa4",
        prompt: "Are there safeguarding considerations for this patient?",
        options: [
          { id: "o1", label: "Consider safeguarding and escalate concerns under the Care Act 2014", correct: true, feedback: "Correct — recurrent falls in a vulnerable adult may warrant a safeguarding referral.", next: null },
          { id: "o2", label: "No — falls are never a safeguarding matter", correct: false, feedback: "Some falls in vulnerable adults do require safeguarding consideration.", next: null },
          { id: "o3", label: "Only if the patient asks", correct: false, feedback: "Safeguarding duties apply regardless of the patient's request.", next: null },
        ],
      },
    },
  },
};

function fill(template, scenario) {
  if (!template) return "";
  return template
    .replace(/\{patient\}/g, scenario?.patient_name || "The patient")
    .replace(/\{news2\}/g, scenario?.initial_news2 ?? "raised");
}

function interpolateTree(tree, scenario) {
  const nodes = {};
  for (const node of Object.values(tree.nodes)) {
    nodes[node.id] = {
      ...node,
      prompt: fill(node.prompt, scenario),
      options: (node.options || []).map((o) => ({ ...o, feedback: fill(o.feedback, scenario) })),
    };
  }
  return { entry: tree.entry, nodes };
}

function isValidTree(parsed) {
  return parsed && typeof parsed === "object" && parsed.nodes &&
    typeof parsed.nodes === "object" && parsed.nodes[parsed.entry];
}

/**
 * Resolve the decision tree for a scenario object. Returns a normalised
 * { entry, nodes } tree with prompts interpolated for the patient.
 */
export function getDecisionTree(scenario) {
  if (scenario?.decision_tree) {
    try {
      const parsed = typeof scenario.decision_tree === "string"
        ? JSON.parse(scenario.decision_tree)
        : scenario.decision_tree;
      if (isValidTree(parsed)) return interpolateTree(parsed, scenario);
    } catch { /* fall through to default */ }
  }
  const category = scenario?.category;
  const base = CATEGORY_TREES[category] || GENERIC_TREE;
  return interpolateTree(base, scenario);
}

/** Total number of decision nodes — used as the max score denominator. */
export function getDecisionTreeSize(scenario) {
  const tree = getDecisionTree(scenario);
  return Object.keys(tree.nodes).length;
}

/**
 * Build a tailored decision tree for a celebrity ward patient, driven by the
 * patient's assessment focus, risk flags and NEWS2 score.
 */
export function buildPatientDecisionTree(patient) {
  const name = patient?.name || "The patient";
  const news2 = patient?.initial_news2 ?? 0;
  const focus = Array.isArray(patient?.assessment_focus) ? patient.assessment_focus : [];
  const primaryFocus = focus[0]?.label || "a structured clinical assessment";
  const secondaryFocus = focus[1]?.label || "person-centred care";
  const safeguarding = !!patient?.safeguarding_flag;

  const escalate = news2 >= 7
    ? "Start an emergency response with continuous monitoring and senior review now"
    : news2 >= 5
      ? "Start an urgent response with at least hourly monitoring and clinician assessment"
      : news2 >= 3
        ? "Increase monitoring frequency and seek registered nurse review"
        : "Continue routine monitoring and reassess as clinically indicated";

  const nodes = {
    p1: {
      id: "p1",
      prompt: `${name} is in bed ${patient?.bedDesignation || "?"}. ${patient?.condition || "Assess the patient."}. What is your first action?`,
      options: [
        { id: "o1", label: "Introduce yourself, confirm identity and consent, then perform a structured ABCDE assessment", correct: true, feedback: "Correct — identity, consent and a systematic ABCDE assessment come first.", next: "p2" },
        { id: "o2", label: "Begin observations without introducing yourself or checking consent", correct: false, feedback: "Consent and identity must be confirmed before any assessment.", next: "p2" },
        { id: "o3", label: "Wait for the doctor before assessing the patient", correct: false, feedback: "Nursing assessment is independent and should not be delayed.", next: "p2" },
      ],
    },
    p2: {
      id: "p2",
      prompt: `NEWS2 is ${news2}. What is the correct response?`,
      options: [
        { id: "o1", label: escalate, correct: true, feedback: "Correct — escalation matches the NEWS2 threshold.", next: "p3" },
        { id: "o2", label: "Document only and continue", correct: false, feedback: "Escalation is required at this score.", next: "p3" },
        { id: "o3", label: "Reassess in an hour", correct: false, feedback: "Do not delay — act on the score now.", next: "p3" },
      ],
    },
    p3: {
      id: "p3",
      prompt: `Which assessment is the priority for ${name}?`,
      options: [
        { id: "o1", label: primaryFocus, correct: true, feedback: `Correct — ${primaryFocus} is a priority assessment for this patient.`, next: safeguarding ? "p4" : null },
        { id: "o2", label: "No specific assessment — apply generic care", correct: false, feedback: "Assessment must be tailored to this patient's presentation.", next: safeguarding ? "p4" : null },
        { id: "o3", label: secondaryFocus, correct: false, feedback: `Important, but complete ${primaryFocus} first.`, next: safeguarding ? "p4" : null },
      ],
    },
  };

  if (safeguarding) {
    nodes.p4 = {
      id: "p4",
      prompt: `${name} may be a vulnerable adult. What is your safeguarding responsibility?`,
      options: [
        { id: "o1", label: "Recognise, respond and report concerns under the Care Act 2014", correct: true, feedback: "Correct — safeguarding duties apply and must be acted on.", next: null },
        { id: "o2", label: "Do nothing unless the patient asks", correct: false, feedback: "Safeguarding duties apply regardless of the patient's request.", next: null },
        { id: "o3", label: "Only document the concern", correct: false, feedback: "Reporting and escalation are required, not documentation alone.", next: null },
      ],
    };
  }

  return { entry: "p1", nodes };
}
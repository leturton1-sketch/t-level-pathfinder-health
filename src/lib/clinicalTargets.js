/**
 * Clinical Targets Auto-Profiler
 * Real-time keyword auditing engine for the Shared Care Plan workspace.
 *
 * Four release targets (physiological, physical, safety, social reablement)
 * are defined per celebrity case with clinically valid keyword databases.
 * scanEntry() checks student text against each target's keyword set and
 * returns which targets are "Established".
 */

export const TARGET_ORDER = [
  "physiological",
  "physical",
  "safety",
  "social_reablement",
];

export const TARGET_META = {
  physiological: {
    label: "Physiological",
    short: "Physiological Stability",
    description: "Vital signs within safe range, acute condition monitored and treated.",
    color: "clinical-teal",
    icon: "Activity",
  },
  physical: {
    label: "Physical",
    short: "Physical Recovery",
    description: "Mobility, ADLs, pain control and functional independence.",
    color: "clinical-amber",
    icon: "Footprints",
  },
  safety: {
    label: "Safety",
    short: "Safety & Risk Management",
    description: "Falls, pressure, infection and deterioration risks mitigated.",
    color: "clinical-red",
    icon: "ShieldCheck",
  },
  social_reablement: {
    label: "Social Reablement",
    short: "Social Reablement & Discharge",
    description: "Discharge planning, community support, self-care and reablement.",
    color: "clinical-green",
    icon: "Home",
  },
};

/**
 * Per-case keyword databases. Each case defines its 4 release targets with a
 * list of clinically valid keywords/phrases. A target is "Established" when
 * at least `minKeywords` distinct keywords are found across the student's
 * text entries.
 */
export const CASE_TARGETS = {
  dua_lipa: {
    physiological: {
      summary: "Asthma/bronchitis exacerbation controlled — SpO₂ ≥ 94%, RR 12–20, no wheeze, peak flow improving",
      keywords: [
        "spo2", "oxygen saturation", "respiratory rate", "rr", "asthma", "bronchitis", "wheeze",
        "salbutamol", "reliever", "inhaler", "nebuliser", "peak flow", "pef", "prednisolone",
        "steroid", "vaping", "vape", "smoking cessation", "bronchodilator", "hypoxia", "hypoxemic",
      ],
      minKeywords: 4,
    },
    physical: {
      summary: "Breathing effort reduced, able to mobilise to toilet, fatigue managed",
      keywords: [
        "mobilise", "mobilising", "mobility", "ambulate", "adl", "activities of daily living",
        "fatigue", "energy", "rest", "breathless", "exertion", "tolerance", "positioning",
        "upright", "paced activity", "reablement",
      ],
      minKeywords: 3,
    },
    safety: {
      summary: "Airway risk managed, vaping cessation advice given, escalation pathway documented",
      keywords: [
        "airway", "escalation", "sbar", "news2", "deterioration", "vaping cessation", "nicotine",
        "relapse", "trigger avoidance", "allergen", "action plan", "self-management", "inhaler technique",
      ],
      minKeywords: 3,
    },
    social_reablement: {
      summary: "Discharge with self-management plan, vocal rest, tour schedule review",
      keywords: [
        "discharge", "self-management", "self-management plan", "vocal rest", "tour", "schedule",
        "community", "follow-up", "gp", "respiratory team", "reablement", "independent",
        "patient education", "inhaler technique", "action plan",
      ],
      minKeywords: 3,
    },
  },
  harry_styles: {
    physiological: {
      summary: "Chest tightness resolved, potassium corrected, hydration restored, HR normal",
      keywords: [
        "chest tightness", "chest pain", "potassium", "hypokalemia", "hypokalaemia", "k+",
        "ecg", "cardiac", "heart rate", "hr", "dehydration", "iv fluids", "hartmann", "saline",
        "electrolyte", "rehydrate", "syncope", "collapse", "fatigue",
      ],
      minKeywords: 4,
    },
    physical: {
      summary: "Rehydrated, able to stand without presyncope, fatigue resolving",
      keywords: [
        "rehydrate", "rehydration", "hydration", "fluid", "stand", "orthostatic", "postural",
        "blood pressure", "bp", "presyncope", "dizzy", "dizziness", "fatigue", "rest",
        "tolerance", "mobilise", "gradual",
      ],
      minKeywords: 3,
    },
    safety: {
      summary: "Cardiac monitoring, electrolyte imbalance corrected, escalation if recurrent",
      keywords: [
        "cardiac monitor", "monitoring", "ecg", "telemetry", "electrolyte", "potassium",
        "recurrent", "escalation", "sbar", "news2", "rest", "tour fatigue", "exhaustion",
        "lifestyle", "overexertion",
      ],
      minKeywords: 3,
    },
    social_reablement: {
      summary: "Discharge with hydration plan, tour rest schedule, dietary review",
      keywords: [
        "discharge", "hydration plan", "oral rehydration", "fluid intake", "tour", "rest",
        "schedule", "dietary", "nutrition", "electrolyte", "banana", "potassium-rich",
        "community", "follow-up", "gp", "self-care", "reablement",
      ],
      minKeywords: 3,
    },
  },
  tom_holland: {
    physiological: {
      summary: "Acute pain controlled (NRS ≤ 3/10), sciatic symptoms stable, no neuro deficits",
      keywords: [
        "pain", "nrs", "pain score", "lumbago", "sciatica", "sciatic", "back pain", "mechanical",
        "paracetamol", "analgesia", "nsaid", "ibuprofen", "naproxen", "nerve", "neurological",
        "sensation", "motor", "reflex", "red flag", "cauda equina",
      ],
      minKeywords: 4,
    },
    physical: {
      summary: "Mobilising with assistance, posture advice, gentle stretches tolerated",
      keywords: [
        "mobilise", "mobilising", "mobility", "ambulate", "assistance", "aid", "posture",
        "ergonomics", "lifting technique", "stretch", "physiotherapy", "physio", "gentle",
        "gradual", "core", "exercise", "reablement", "adl",
      ],
      minKeywords: 3,
    },
    safety: {
      summary: "Moving & handling risk assessed (TILE), falls prevention, red flags excluded",
      keywords: [
        "tile", "moving and handling", "manual handling", "falls", "fall risk", "red flag",
        "cauda equina", "bowel", "bladder", "saddle", "numbness", "escalation", "sbar",
        "neurovascular", "sensation",
      ],
      minKeywords: 3,
    },
    social_reablement: {
      summary: "Discharge with physio referral, stunt modification advice, return-to-work plan",
      keywords: [
        "discharge", "physiotherapy", "physio", "referral", "stunt", "return to work",
        "graduated", "rehabilitation", "exercise", "core strength", "community", "self-management",
        "reablement", "follow-up", "ergonomics",
      ],
      minKeywords: 3,
    },
  },
  billie_eilish: {
    physiological: {
      summary: "Fracture immobilised, orthostatic hypotension managed, nutrition optimised",
      keywords: [
        "colles", "fracture", "cast", "splint", "immobilis", "orthostatic", "postural",
        "hypotension", "blood pressure", "bp", "vegan", "nutrition", "nutritional", "calcium",
        "vitamin d", "iron", "b12", "diet", "malnutrition",
      ],
      minKeywords: 4,
    },
    physical: {
      summary: "Arm elevated, circulatory checks, safe mobilising with cast",
      keywords: [
        "elevat", "arm", "circulation", "capillary refill", "neurovascular", "cast care",
        "mobilise", "mobility", "aid", "assistance", "adl", "dressing", "self-care",
        "one-handed",
      ],
      minKeywords: 3,
    },
    safety: {
      summary: "Falls prevention, orthostatic advice, cast neurovascular monitoring",
      keywords: [
        "falls", "fall risk", "orthostatic", "postural", "stand slowly", "hydration",
        "neurovascular", "capillary refill", "swelling", "circulation", "escalation",
        "compartment syndrome", "sbar", "cast care",
      ],
      minKeywords: 3,
    },
    social_reablement: {
      summary: "Discharge with dietitian referral, vegan nutrition plan, fracture clinic follow-up",
      keywords: [
        "discharge", "dietitian", "dietician", "nutrition", "vegan", "calcium", "vitamin d",
        "iron", "b12", "fracture clinic", "follow-up", "community", "self-management",
        "reablement", "rehabilitation", "physio",
      ],
      minKeywords: 3,
    },
  },
  pedro_pascal: {
    physiological: {
      summary: "Blood pressure controlled, pacing behaviour managed, rest enforced",
      keywords: [
        "blood pressure", "bp", "hypertension", "hypertensive", "urgency", "systolic",
        "diastolic", "heart rate", "hr", "pacing", "rest", "stress", "anxiety", "ramipril",
        "amlodipine", "antihypertensive",
      ],
      minKeywords: 4,
    },
    physical: {
      summary: "Resting, stress reduction, paced activity, sleep optimised",
      keywords: [
        "rest", "stress", "stress reduction", "relaxation", "sleep", "sleep hygiene",
        "paced", "activity", "fatigue", "burnout", "lifestyle", "mindfulness", "reablement",
      ],
      minKeywords: 3,
    },
    safety: {
      summary: "BP monitoring, stroke risk assessment, escalation for hypertensive emergency",
      keywords: [
        "bp monitoring", "blood pressure", "stroke", "tia", "symptoms", "headache",
        "visual", "chest pain", "escalation", "sbar", "news2", "hypertensive emergency",
        "organ damage", "target organ",
      ],
      minKeywords: 3,
    },
    social_reablement: {
      summary: "Discharge with stress management plan, BP monitoring, lifestyle advice",
      keywords: [
        "discharge", "stress management", "lifestyle", "diet", "low salt", "exercise",
        "alcohol", "smoking", "weight", "bp monitoring", "community", "follow-up", "gp",
        "self-management", "reablement", "filming schedule",
      ],
      minKeywords: 3,
    },
  },
  elton_john: {
    physiological: {
      summary: "COPD exacerbation treated, bradycardia reviewed, digoxin toxicity detected",
      keywords: [
        "copd", "exacerbation", "oxygen", "spo2", "nebuliser", "salbutamol", "ipratropium",
        "prednisolone", "steroid", "bradycardia", "heart rate", "digoxin", "toxicity",
        "halo", "visual", "yellow-green", "potassium", "digoxin level", "antidote",
      ],
      minKeywords: 4,
    },
    physical: {
      summary: "Breathing improved, able to mobilise, fatigue managed",
      keywords: [
        "mobilise", "mobility", "breathless", "breathing", "fatigue", "rest", "energy",
        "adl", "activities of daily living", "positioning", "upright", "paced", "reablement",
      ],
      minKeywords: 3,
    },
    safety: {
      summary: "Oxygen target 88–92%, digoxin held, cardiac monitoring, escalation",
      keywords: [
        "oxygen target", "88-92", "venturi", "hypoxic drive", "digoxin", "held", "withheld",
        "cardiac monitor", "ecg", "bradycardia", "escalation", "sbar", "news2", "toxicity",
        "medication review",
      ],
      minKeywords: 3,
    },
    social_reablement: {
      summary: "Discharge with medication review, COPD self-management, community follow-up",
      keywords: [
        "discharge", "medication review", "copd", "self-management", "action plan", "inhaler",
        "pulmonary rehabilitation", "community", "follow-up", "gp", "respiratory", "reablement",
        "digoxin", "alternative",
      ],
      minKeywords: 3,
    },
  },
};

/**
 * Normalise text for keyword matching: lowercase, strip punctuation.
 */
function normalise(text) {
  return String(text || "").toLowerCase().replace(/[^a-z0-9+\-\s%./]/g, " ").replace(/\s+/g, " ");
}

/**
 * Scan a combined text entry against a case's target keywords.
 * Returns per-target status with matched keywords and established flag.
 */
export function scanEntry(caseId, combinedText) {
  const caseTargets = CASE_TARGETS[caseId];
  if (!caseTargets) return { targets: {}, establishedCount: 0, total: 4 };
  const normalised = normalise(combinedText);
  const targets = {};
  let establishedCount = 0;

  for (const key of TARGET_ORDER) {
    const def = caseTargets[key];
    if (!def) continue;
    const matched = def.keywords.filter((kw) => {
      const n = normalise(kw);
      return n.length > 2 && normalised.includes(n);
    });
    const distinct = [...new Set(matched)];
    const established = distinct.length >= def.minKeywords;
    if (established) establishedCount++;
    targets[key] = {
      ...def,
      established,
      matchedKeywords: distinct,
      matchedCount: distinct.length,
    };
  }

  return { targets, establishedCount, total: TARGET_ORDER.length };
}
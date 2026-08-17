/**
 * Simulated Electronic Health Record (EHR) data — static defaults per celebrity ward patient.
 * Keyed by patient ID (elvis, dolly, gordon, ozzy, ladygaga).
 * ScenarioTemplate EHR overrides (JSON strings) merge on top of these when deployed.
 *
 * Lab reference ranges sourced from NHS / NICE standard adult values.
 */

export const LAB_REF_RANGES = {
  // Haematology (FBC)
  "Haemoglobin (Hb)": { low: 130, high: 180, unit: "g/L", note: "Male 130-180, Female 115-165" },
  "White Cell Count": { low: 4.0, high: 11.0, unit: "×10⁹/L" },
  "Platelets": { low: 150, high: 400, unit: "×10⁹/L" },
  // ABG
  "pH": { low: 7.35, high: 7.45, unit: "" },
  "pCO₂": { low: 4.7, high: 6.0, unit: "kPa" },
  "pO₂": { low: 11.0, high: 13.0, unit: "kPa" },
  "HCO₃⁻": { low: 22, high: 26, unit: "mmol/L" },
  "SpO₂ (ABG)": { low: 94, high: 100, unit: "%" },
  // Biochemistry
  "CRP": { low: 0, high: 5, unit: "mg/L" },
  "Sodium": { low: 135, high: 145, unit: "mmol/L" },
  "Potassium": { low: 3.5, high: 5.0, unit: "mmol/L" },
  "Urea": { low: 2.5, high: 7.0, unit: "mmol/L" },
  "Creatinine": { low: 60, high: 120, unit: "µmol/L" },
  "eGFR": { low: 60, high: 999, unit: "mL/min/1.73m²" },
  "Glucose": { low: 3.5, high: 7.8, unit: "mmol/L" },
};

const ADMIN_SLOTS = ["06:00", "14:00", "22:00", "PRN"];

function admin(...statuses) {
  return ADMIN_SLOTS.map((time, i) => ({ time, status: statuses[i] || "due" }));
}

export const EHR_RECORDS = {
  // ─── ELVIS — Acute severe COPD exacerbation, Type 2 Diabetes ───
  elvis: {
    drugChart: [
      { drug: "Salbutamol (nebulised)", dose: "5 mg", route: "Neb", frequency: "QDS + PRN", startDate: "14/08/2026", prescriber: "Dr Carter", admin: admin("given", "given", "given", "given") },
      { drug: "Tiotropium", dose: "18 µg", route: "Inhale", frequency: "OD", startDate: "14/08/2026", prescriber: "Dr Carter", admin: admin("given", "due", "due", "—") },
      { drug: "Prednisolone", dose: "30 mg", route: "PO", frequency: "OD", startDate: "14/08/2026", prescriber: "Dr Carter", admin: admin("given", "due", "due", "—") },
      { drug: "Metformin", dose: "1 g", route: "PO", frequency: "BD", startDate: "14/08/2026", prescriber: "Dr Sharma", admin: admin("given", "due", "given", "—") },
      { drug: "Enoxaparin", dose: "40 mg", route: "SC", frequency: "OD", startDate: "14/08/2026", prescriber: "Dr Carter", admin: admin("given", "due", "due", "—") },
      { drug: "Laxido (MACROGOL)", dose: "1 sachet", route: "PO", frequency: "PRN", startDate: "14/08/2026", prescriber: "Dr Carter", admin: admin("—", "—", "—", "due") },
      { drug: "⚠ Codeine", dose: "—", route: "—", frequency: "NEVER PRESCRIBE", startDate: "—", prescriber: "—", admin: admin("—", "—", "—", "—"), allergyFlag: true, note: "ALLERGY: Codeine — respiratory depression risk. DO NOT administer." },
    ],
    nursingNotes: [
      { type: "admission", timestamp: "14/08/2026 09:15", author: "Dr Carter, SpR", content: "42M admitted via A&E with 3-day history of worsening breathlessness, productive cough (green sputum), and wheeze. Hypoxic on air SpO₂ 89%. Known COPD (Gold Grade 3), Type 2 DM. No bowel movement for 5 days. Started on nebulised salbutamol, oral prednisolone 30mg, and prophylactic enoxaparin. Target SpO₂ 88–92%. Reviewed by respiratory team — conservative O₂ management due to hypercapnic risk." },
      { type: "handover", timestamp: "14/08/2026 20:00", author: "RN Patel, Night shift", content: "Elvis — Bed A1. COPD exac, Day 0. RR 26, SpO₂ 89% on air, sats target 88-92%. Pred given AM. Metformin given. CBG 15.2 — flag to Dr on rounds. Bowels not opened D5. Laxido offered, refused — encourage fluids. Anxious but alert. VS 2hrly." },
      { type: "observation", timestamp: "15/08/2026 06:00", author: "RN Jones", vitals: { rr: 24, spo2: 91, sbp: 148, hr: 104, temp: 37.6, avpu: "A" }, news2: 7 },
      { type: "observation", timestamp: "15/08/2026 14:00", author: "RN Jones", vitals: { rr: 26, spo2: 89, sbp: 145, hr: 102, temp: 37.8, avpu: "A" }, news2: 8 },
      { type: "handover", timestamp: "15/08/2026 14:30", author: "RN Jones, handover to PM", content: "Elvis A1 — NEWS2 8, deteriorating from 7. SpO₂ dropped to 89% from 91%. RR up to 26. Dr reviewed, continue current Mx. CBG still high. Patient due for ABG — result pending. Bowels still not opened. Monitor closely — if SpO₂ <88% or RR >30 escalate urgently." },
    ],
    labResults: {
      haematology: [
        { label: "Haemoglobin (Hb)", value: 168 },
        { label: "White Cell Count", value: 14.6 },
        { label: "Platelets", value: 238 },
      ],
      abg: [
        { label: "pH", value: 7.29 },
        { label: "pCO₂", value: 7.8 },
        { label: "pO₂", value: 7.9 },
        { label: "HCO₃⁻", value: 31 },
        { label: "SpO₂ (ABG)", value: 88 },
      ],
      biochemistry: [
        { label: "CRP", value: 48 },
        { label: "Sodium", value: 136 },
        { label: "Potassium", value: 4.2 },
        { label: "Urea", value: 6.8 },
        { label: "Creatinine", value: 95 },
        { label: "eGFR", value: 72 },
        { label: "Glucose", value: 15.2 },
      ],
    },
  },

  // ─── DOLLY — Post-op left hip repair, Day 1 ───
  dolly: {
    drugChart: [
      { drug: "Paracetamol", dose: "1 g", route: "PO", frequency: "QDS", startDate: "13/08/2026", prescriber: "Dr Evans", admin: admin("given", "given", "due", "—") },
      { drug: "Codeine phosphate", dose: "30 mg", route: "PO", frequency: "PRN", startDate: "13/08/2026", prescriber: "Dr Evans", admin: admin("—", "—", "—", "given") },
      { drug: "Methotrexate", dose: "7.5 mg", route: "PO", frequency: "OW", startDate: "HELD", prescriber: "Dr Evans", admin: admin("withheld", "—", "—", "—"), note: "Held post-op — resume on surgeon's instruction" },
      { drug: "Alendronate", dose: "70 mg", route: "PO", frequency: "OW", startDate: "HELD", prescriber: "Dr Evans", admin: admin("withheld", "—", "—", "—") },
      { drug: "Enoxaparin", dose: "40 mg", route: "SC", frequency: "OD", startDate: "13/08/2026", prescriber: "Dr Evans", admin: admin("given", "due", "due", "—") },
      { drug: "Omeprazole", dose: "20 mg", route: "PO", frequency: "OD", startDate: "13/08/2026", prescriber: "Dr Evans", admin: admin("given", "due", "due", "—") },
    ],
    nursingNotes: [
      { type: "admission", timestamp: "13/08/2026 11:30", author: "Dr Evans, Orthopaedic SpR", content: "78F admitted for elective L total hip replacement following fall at home 2 weeks ago. RA with fragile skin — high pressure ulcer risk. Op uneventful. Post-op Day 1. Methotrexate held. Pain NRS 6/10 at rest, 8/10 on movement. Waterlow assessment required — likely very high risk. 2-hourly repositioning. Handle RA joints gently." },
      { type: "handover", timestamp: "13/08/2026 19:00", author: "RN Taylor, Night shift", content: "Dolly A2 — Post-op Day 0. HR 72, SpO₂ 97%, BP 118/74, afebrile. Pain 6/10, codeine given PM. Repositioned 2hrly — skin intact but fragile, document body map. VC in situ, urine clear. Encouraging ankle pumps. Sleeps well between cares. 'Honey, could you bring my rhinestone pillow?'" },
      { type: "observation", timestamp: "14/08/2026 06:00", author: "RN Khan", vitals: { rr: 16, spo2: 97, sbp: 116, hr: 68, temp: 36.5, avpu: "A" }, news2: 0 },
      { type: "handover", timestamp: "14/08/2026 14:00", author: "RN Khan, handover to PM", content: "Dolly A2 — Day 1 post-op. NEWS2 0, stable. Pain 4/10 rest after analgesia. Mobilised to chair with frame — physio happy. Waterlow 21 (very high risk) — SSKIN bundle commenced, Air mattress ordered. Skin inspection q2h — heels intact. Methotrexate still held. Patient independent but needs encouragement to ask for help." },
    ],
    labResults: {
      haematology: [
        { label: "Haemoglobin (Hb)", value: 108 },
        { label: "White Cell Count", value: 9.2 },
        { label: "Platelets", value: 280 },
      ],
      biochemistry: [
        { label: "CRP", value: 22 },
        { label: "Sodium", value: 138 },
        { label: "Potassium", value: 4.0 },
        { label: "Urea", value: 5.1 },
        { label: "Creatinine", value: 78 },
        { label: "eGFR", value: 68 },
        { label: "Glucose", value: 5.6 },
      ],
    },
  },

  // ─── GORDON — Acute Crohn's flare ───
  gordon: {
    drugChart: [
      { drug: "Prednisolone", dose: "40 mg", route: "PO", frequency: "OD", startDate: "12/08/2026", prescriber: "Dr Singh", admin: admin("given", "due", "due", "—") },
      { drug: "Azathioprine", dose: "150 mg", route: "PO", frequency: "OD", startDate: "12/08/2026", prescriber: "Dr Singh", admin: admin("given", "due", "due", "—") },
      { drug: "Mesalazine", dose: "1 g", route: "PO", frequency: "QDS", startDate: "12/08/2026", prescriber: "Dr Singh", admin: admin("given", "given", "due", "—") },
      { drug: "Hartmann's Solution", dose: "125 mL/hr", route: "IV", frequency: "Continuous", startDate: "12/08/2026", prescriber: "Dr Singh", admin: admin("running", "running", "running", "—") },
      { drug: "Codeine phosphate", dose: "30 mg", route: "PO", frequency: "PRN", startDate: "12/08/2026", prescriber: "Dr Singh", admin: admin("—", "—", "—", "given") },
      { drug: "⚠ Metronidazole", dose: "—", route: "—", frequency: "NEVER PRESCRIBE", startDate: "—", prescriber: "—", admin: admin("—", "—", "—", "—"), allergyFlag: true, note: "ALLERGY: Metronidazole — severe nausea/vomiting. DO NOT administer." },
    ],
    nursingNotes: [
      { type: "admission", timestamp: "12/08/2026 15:00", author: "Dr Singh, Gastroenterology", content: "57M admitted with 10-day Crohn's flare — severe abdominal cramping, 8+ liquid stools/day (Bristol Type 7), nausea, 6kg weight loss in 5 weeks. CRP elevated. Dehydrated — SBP 105. IV Hartmann's commenced at 125mL/hr. NBM for potential scope. Stool specimen sent for MC&S and C. diff toxin. MUST score required. Patient anxious and irritable — maintain professional communication." },
      { type: "handover", timestamp: "12/08/2026 20:30", author: "RN Williams, Night shift", content: "Gordon A3 — Crohn's flare, Day 0. Abdo pain 7/10, codeine given. 9 liquid stools since admission. Fluid balance negative — input 1.5L, output 2.3L. IV site L hand — patent, check hourly. NBM — mouth care 2hrly. Patient frustrated, 'Are you having a laugh?' when offered only sips. Alert and oriented." },
      { type: "observation", timestamp: "13/08/2026 06:00", author: "RN Cooper", vitals: { rr: 20, spo2: 98, sbp: 108, hr: 96, temp: 37.3, avpu: "A" }, news2: 3 },
      { type: "handover", timestamp: "13/08/2026 14:00", author: "RN Cooper, handover to PM", content: "Gordon A3 — Day 1. NEWS2 3, SBP improved to 108 from 105. 11 liquid stools overnight. Fluid balance still negative. CRP back — 87. MUST score 2 (high risk) — dietitian referred. Infliximab infusion scheduled for tomorrow. Stool MC&S pending, C. diff negative. Abdo exam: soft but diffuse tenderness LIF. Patient calmer after analgesia." },
    ],
    labResults: {
      haematology: [
        { label: "Haemoglobin (Hb)", value: 112 },
        { label: "White Cell Count", value: 13.4 },
        { label: "Platelets", value: 390 },
      ],
      biochemistry: [
        { label: "CRP", value: 87 },
        { label: "Sodium", value: 134 },
        { label: "Potassium", value: 3.1 },
        { label: "Urea", value: 8.4 },
        { label: "Creatinine", value: 102 },
        { label: "eGFR", value: 58 },
        { label: "Glucose", value: 6.1 },
      ],
    },
  },

  // ─── OZZY — Post-fall, advanced Parkinson's, mild delirium ───
  ozzy: {
    drugChart: [
      { drug: "Co-careldopa (Sinemet)", dose: "25/100 mg", route: "PO", frequency: "TDS (ON TIME)", startDate: "13/08/2026", prescriber: "Dr Morris", admin: admin("given", "due", "due", "—"), note: "CRITICAL: must be administered on time. Delayed doses cause severe loss of motor control." },
      { drug: "Ropinirole", dose: "2 mg", route: "PO", frequency: "TDS", startDate: "13/08/2026", prescriber: "Dr Morris", admin: admin("given", "due", "due", "—") },
      { drug: "Omeprazole", dose: "20 mg", route: "PO", frequency: "OD", startDate: "13/08/2026", prescriber: "Dr Morris", admin: admin("given", "due", "due", "—") },
      { drug: "Paracetamol", dose: "1 g", route: "PO", frequency: "QDS", startDate: "13/08/2026", prescriber: "Dr Morris", admin: admin("given", "given", "due", "—") },
      { drug: "Thiamine", dose: "100 mg", route: "IV", frequency: "OD", startDate: "13/08/2026", prescriber: "Dr Morris", admin: admin("given", "due", "due", "—") },
    ],
    nursingNotes: [
      { type: "admission", timestamp: "13/08/2026 10:00", author: "Dr Morris, Care of Elderly", content: "75M found on floor at home by carer. Mechanical fall — no LOC. C-spine cleared. Mild acute delirium — confused re: place and time, thinks he is in Bel Air. Known advanced Parkinson's. Postural hypotension noted. Sinemet timing critical. FRAT required. Falls bundle in place. MCA assessment needed for treatment decisions." },
      { type: "handover", timestamp: "13/08/2026 19:00", author: "RN Ali, Night shift", content: "Ozzy A4 — Post-fall Day 0. AVPU = Confused, oriented to person only. Sinemet given 18:00 on time. BP 104/68 postural — encourage fluids. Bed low, call bell in reach. Non-slip footwear on. Sleeps fitfully, wakes confused. Responds to name 'Ozzy' — do NOT call him Mr Osbourne." },
      { type: "observation", timestamp: "14/08/2026 06:00", author: "RN Hughes", vitals: { rr: 18, spo2: 96, sbp: 112, hr: 66, temp: 36.4, avpu: "C" }, news2: 2 },
      { type: "handover", timestamp: "14/08/2026 14:00", author: "RN Hughes, handover to PM", content: "Ozzy A4 — Day 1. NEWS2 2. Less confused this AM — knows he's in hospital. Sinemet 06:00 given on time — tremor well controlled. FRAT completed: HIGH risk. TILE assessment done for all handling. Postural BP dip persists — monitor on standing. Continence: continent, uses urinal. Safeguarding referral submitted re: home circumstances." },
    ],
    labResults: {
      haematology: [
        { label: "Haemoglobin (Hb)", value: 142 },
        { label: "White Cell Count", value: 7.8 },
        { label: "Platelets", value: 210 },
      ],
      biochemistry: [
        { label: "CRP", value: 8 },
        { label: "Sodium", value: 131 },
        { label: "Potassium", value: 4.1 },
        { label: "Urea", value: 5.5 },
        { label: "Creatinine", value: 88 },
        { label: "eGFR", value: 62 },
        { label: "Glucose", value: 5.3 },
      ],
    },
  },

  // ─── LADY GAGA — Severe fibromyalgia flare, hyperalgesia, eczema ───
  ladygaga: {
    drugChart: [
      { drug: "Pregabalin", dose: "150 mg", route: "PO", frequency: "BD", startDate: "14/08/2026", prescriber: "Dr Bennett", admin: admin("given", "due", "given", "—") },
      { drug: "Duloxetine", dose: "60 mg", route: "PO", frequency: "OD", startDate: "14/08/2026", prescriber: "Dr Bennett", admin: admin("given", "due", "due", "—") },
      { drug: "Paracetamol", dose: "1 g", route: "PO", frequency: "QDS", startDate: "14/08/2026", prescriber: "Dr Bennett", admin: admin("given", "given", "due", "—") },
      { drug: "Ibuprofen", dose: "400 mg", route: "PO", frequency: "PRN", startDate: "14/08/2026", prescriber: "Dr Bennett", admin: admin("—", "—", "—", "given"), note: "Monitor renal function — check U&E" },
      { drug: "Dermovate cream", dose: "Apply thinly", route: "Topical", frequency: "BD", startDate: "14/08/2026", prescriber: "Dr Bennett", admin: admin("given", "—", "due", "—") },
      { drug: "Epaderm ointment", dose: "Apply liberally", route: "Topical", frequency: "TDS + PRN", startDate: "14/08/2026", prescriber: "Dr Bennett", admin: admin("given", "given", "due", "due") },
      { drug: "⚠ LATEX", dose: "—", route: "—", frequency: "NEVER USE", startDate: "—", prescriber: "—", admin: admin("—", "—", "—", "—"), allergyFlag: true, note: "ALLERGY: Latex — anaphylaxis. Use NITRILE gloves ONLY. Latex-free equipment mandatory." },
    ],
    nursingNotes: [
      { type: "admission", timestamp: "14/08/2026 13:00", author: "Dr Bennett, Rheumatology", content: "38F admitted with severe fibromyalgia flare — widespread pain NRS 9/10, hyperalgesia, bilateral lower limb eczema with skin breakdown. Unable to self-care at home. Latex anaphylaxis — nitrile gloves only. PTSD — trauma-informed approach. Announce every touch, approach slowly, minimal pressure. Emollient in direction of hair growth." },
      { type: "handover", timestamp: "14/08/2026 20:00", author: "RN Foster, Night shift", content: "Lady Gaga B1 — fibromyalgia flare Day 0. Pain 9/10 despite pregabalin + paracetamol. Hyperalgesia — flinches at light touch. All touch announced beforehand. Lower limbs: bilateral eczematous patches with breakdown — foam dressings applied, non-adherent. Epaderm applied TDS in hair direction. Nitrile gloves confirmed. Slept 2hr, restless. Anxious but grateful for person-centred approach." },
      { type: "observation", timestamp: "15/08/2026 06:00", author: "RN Green", vitals: { rr: 15, spo2: 99, sbp: 122, hr: 84, temp: 36.8, avpu: "A" }, news2: 0 },
      { type: "handover", timestamp: "15/08/2026 14:00", author: "RN Green, handover to PM", content: "Lady Gaga B1 — Day 1. NEWS2 0, stable. Pain 7/10 after pregabalin BD — improved. Lower limb dressings changed — skin healing well, no signs of infection. Emollient regimen maintained. Dynamic consent throughout — patient 'thank you for asking before you touch, it means everything'. Psych referral made re: PTSD/mental health support. Continue trauma-informed care." },
    ],
    labResults: {
      haematology: [
        { label: "Haemoglobin (Hb)", value: 134 },
        { label: "White Cell Count", value: 6.5 },
        { label: "Platelets", value: 255 },
      ],
      biochemistry: [
        { label: "CRP", value: 7 },
        { label: "Sodium", value: 139 },
        { label: "Potassium", value: 4.3 },
        { label: "Urea", value: 4.2 },
        { label: "Creatinine", value: 72 },
        { label: "eGFR", value: 85 },
        { label: "Glucose", value: 5.0 },
      ],
    },
  },
};

/** Merge static defaults with scenario template overrides (JSON strings). */
export function getMergedEHR(patientId, overrides = {}) {
  const base = EHR_RECORDS[patientId] || EHR_RECORDS.elvis;
  const merged = {
    drugChart: base.drugChart,
    nursingNotes: base.nursingNotes,
    labResults: base.labResults,
  };
  try {
    if (overrides.ehr_drug_chart) merged.drugChart = JSON.parse(overrides.ehr_drug_chart);
    if (overrides.ehr_nursing_notes) merged.nursingNotes = JSON.parse(overrides.ehr_nursing_notes);
    if (overrides.ehr_lab_results) merged.labResults = JSON.parse(overrides.ehr_lab_results);
  } catch (e) {
    // keep base if override parse fails
  }
  return merged;
}
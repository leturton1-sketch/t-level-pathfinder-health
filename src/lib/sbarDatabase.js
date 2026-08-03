/**
 * Multi-Character SBAR Handover Database
 * Bespoke clinically rigorous SBAR (Situation, Background, Assessment,
 * Recommendation) handover cards mapped to six celebrity patient profiles.
 *
 * Each celebrity also carries a custom Web Speech API voice profile (pitch,
 * rate, volume, preferred lang) used by the MDT Coordination Board to
 * simulate their unique speaking style.
 */

export const SBAR_PATIENTS = [
  {
    id: "dua_lipa",
    name: "Dua Lipa",
    age: 29,
    pronouns: "She/Her",
    condition: "Exacerbation of severe asthma / bronchitis with vaping history in a high-energy stadium touring environment",
    bed: "C1",
    voice: {
      label: "Fast-talking, energetic, high-pitch British pop star",
      lang: "en-GB",
      pitch: 1.35,
      rate: 1.25,
      volume: 1,
    },
    sbar: {
      situation: "Dua Lipa, 29, female, admitted to the ward with an acute exacerbation of severe asthma/bronchitis. She is a high-energy stadium touring artist with a significant vaping history. Currently complaining of increased wheeze, breathlessness and chest tightness. NEWS2 score is 6 (Medium — urgent ward-based review required).",
      background: "Known severe asthma since childhood, with documented bronchitis episodes. Long-term vaping history (5+ years) and exposure to stage fog/pyrotechnics. No known drug allergies. Medications: Salbutamol inhaler PRN, Clenil Modulite, Montelukast, combined oral contraceptive. Recent viral upper respiratory tract infection triggered deterioration. Smoker history through vaping only.",
      assessment: "Respiratory rate 24, SpO₂ 91% on air, wheeze bilateral on auscultation, able to speak in short sentences, using accessory muscles. Peak flow 180 L/min (best 450). No cyanosis. Chest X-ray clear. Arterial blood gas pending. NEWS2 = 6 — clinical concern for impending type 1 respiratory failure if SpO₂ drops below 90%.",
      recommendation: "Please review urgently. Commence nebulised Salbutamol 5mg, prescribe Prednisolone 40mg OD for 5 days, continuous SpO₂ monitoring, target SpO₂ 94–98%. Refer to respiratory team. Provide vaping cessation advice and written asthma action plan prior to discharge. Escalate to critical care if SpO₂ falls below 88% or RR exceeds 30.",
    },
  },
  {
    id: "harry_styles",
    name: "Harry Styles",
    age: 30,
    pronouns: "He/Him",
    condition: "Backstage collapse with acute chest tightness, severe touring dehydration/fatigue and hypokalaemia",
    bed: "C2",
    voice: {
      label: "Charismatic, warm, low-pitch, slow-tempo British artist",
      lang: "en-GB",
      pitch: 0.75,
      rate: 0.85,
      volume: 1,
    },
    sbar: {
      situation: "Harry Styles, 30, male, admitted after a backstage collapse during a world tour performance. Complaining of acute central chest tightness, dizziness and profound fatigue. Found to have hypokalaemia on bloods. NEWS2 score is 5 (Medium — urgent review).",
      background: "No significant cardiac history. Touring schedule has been relentless with poor oral intake, minimal sleep, and high physical exertion over 6 weeks. NKDA. Medications: none regular. Limited dietary intake — relying on energy drinks and limited catering. U&Es revealed potassium 2.9 mmol/L. ECG shows sinus rhythm with prominent U waves consistent with hypokalaemia. Cardiac troponin negative.",
      assessment: "HR 105, BP 98/62, RR 22, SpO₂ 96% on air, Temp 36.4, capillary refill 3 seconds, dry mucous membranes, reduced skin turgor. Chest tightness easing with rehydration. Conscious and oriented but visibly exhausted. NEWS2 = 5. Clinical picture: severe dehydration with hypokalaemia secondary to poor intake and overexertion — cardiac cause excluded.",
      recommendation: "Please review. Commence IV Hartmann's solution 1L over 4 hours, oral potassium supplementation (Sando-K 2 tablets BD), cardiac monitoring until K⁺ ≥ 3.5. Repeat U&Es in 6 hours. Enforce mandatory rest 24 hours, dietitian referral for nutrition and electrolyte-rich meal plan, and review tour schedule before discharge. Escalate if chest tightness recurs or K⁺ falls below 2.5.",
    },
  },
  {
    id: "tom_holland",
    name: "Tom Holland",
    age: 28,
    pronouns: "He/Him",
    condition: "Severe acute mechanical back pain (lumbago with sciatica) following his iconic acrobatic stunt moves",
    bed: "C3",
    voice: {
      label: "High-tempo, high-pitch British action star",
      lang: "en-GB",
      pitch: 1.2,
      rate: 1.3,
      volume: 1,
    },
    sbar: {
      situation: "Tom Holland, 28, male, admitted with severe acute mechanical back pain with left-sided sciatica following repeated acrobatic stunt sequences. Pain NRS 8/10, radiating to left leg. NEWS2 score is 1 (Low).",
      background: "No previous back surgery. History of minor back strain during stunt training but never this severity. Performs his own stunts with frequent inversions, flips and landings. NKDA. Medications: Paracetamol PRN, Ibuprofen PRN. Onset was acute after a rehearsal involving 12 consecutive backflips. No red flags reported — no bowel/bladder dysfunction, no saddle anaesthesia, no weight loss.",
      assessment: "HR 78, BP 128/80, RR 18, SpO₂ 98% on air, Temp 36.7. Guarding in lumbar paraspinals, reduced lumbar flexion, positive left straight leg raise at 45° reproducing sciatica. Neurological examination: intact sensation, power 5/5 all myotomes, reflexes present and symmetrical. No cauda equina red flags. NEWS2 = 1. Clinical picture: acute mechanical lumbago with left L5/S1 sciatica, no red flags.",
      recommendation: "Please review and prescribe analgesia ladder: regular Paracetamol 1g QDS, Naproxen 500mg BD with PPI, Codeine 30mg PRN. Refer to physiotherapy urgently for assessment and gentle mobilisation. Apply TILE moving and handling risk assessment. Falls prevention bundle. Bed rest discouraged beyond 48 hours. Escalate immediately if any red flag signs — bowel/bladder dysfunction, saddle anaesthesia, or progressive neurological deficit.",
    },
  },
  {
    id: "billie_eilish",
    name: "Billie Eilish",
    age: 22,
    pronouns: "She/Her",
    condition: "Colles' fracture from a stage fall, orthostatic hypotension, strict vegan nutritional plan",
    bed: "C4",
    voice: {
      label: "Low-key, soft, low-pitch, breathy American accent",
      lang: "en-US",
      pitch: 0.7,
      rate: 0.9,
      volume: 1,
    },
    sbar: {
      situation: "Billie Eilish, 22, female, admitted after a fall from the stage during a performance, sustaining a left Colles' fracture. Also reports recurrent dizziness on standing consistent with orthostatic hypotension. Maintains a strict vegan diet. NEWS2 score is 2 (Low).",
      background: "No significant medical history. Strict vegan for 8 years — limited dietary review suggests low calcium, iron and B12 intake. No prior fractures. NKDA. Medications: none. No hormone contraception. Reported lightheadedness on standing for several weeks, not previously investigated. Fell from stage height (~1.5m) onto outstretched left hand — FOOSH injury. X-ray confirmed undisplaced left Colles' fracture.",
      assessment: "HR 88, BP 102/64 lying / 86/56 standing (postural drop >20mmHg systolic), RR 16, SpO₂ 97% on air, Temp 36.6. Left wrist swollen, deformed, neurovascularly intact (capillary refill <2s, sensation intact). BMI 18.5. Pale conjunctivae. NEWS2 = 2. Clinical picture: orthostatic hypotension likely related to nutritional deficiencies (iron, B12) and low BMI; left Colles' fracture managed with backslab.",
      recommendation: "Please review. Immobilise with below-elbow backslab, elevate arm, analgesia Paracetamol 1g QDS, refer to fracture clinic within 48 hours for definitive cast. Neurovascular checks hourly. Investigate orthostatic hypotension: FBC, ferritin, B12, folate, U&Es, orthostatic BP series. Urgent dietitian referral for balanced vegan nutrition plan — calcium, iron, B12, vitamin D supplementation. Falls prevention advice. Escalate if neurovascular compromise or swelling increases.",
    },
  },
  {
    id: "pedro_pascal",
    name: "Pedro Pascal",
    age: 49,
    pronouns: "He/Him",
    condition: "Hypertensive urgency from Gladiator filming stress, pacing behaviour, requires rest",
    bed: "C5",
    voice: {
      label: "Warm, resonant, slow-paced American baritone",
      lang: "en-US",
      pitch: 0.8,
      rate: 0.85,
      volume: 1,
    },
    sbar: {
      situation: "Pedro Pascal, 49, male, admitted with hypertensive urgency — sustained high blood pressure during intense Gladiator filming. Exhibiting pacing behaviour and unable to rest. NEWS2 score is 4 (Low-Medium).",
      background: "Newly diagnosed hypertension 3 months ago, not yet optimised on medication. High-profile filming commitments with significant physical and emotional demands. NKDA. Medications: Amlodipine 5mg OD ( adherence inconsistent). Reports work-related stress, poor sleep, high caffeine intake. No prior cardiovascular events. Smoker (10/day), moderate alcohol. Father had MI aged 55.",
      assessment: "HR 92, BP 188/112 (repeat 184/108), RR 20, SpO₂ 98% on air, Temp 36.8. Patient pacing the bay, unable to settle, visibly anxious. No chest pain, no visual symptoms, no neurological deficit, no shortness of breath. Fundoscopy: no papilloedema. ECG: sinus rhythm, LV voltage criteria only. NEWS2 = 4. Clinical picture: hypertensive urgency without evidence of target organ damage — stress and lifestyle driven.",
      recommendation: "Please review. Confirm no target organ damage — troponin, renal function, urinalysis, fundoscopy documented. Prescribe Ramipril 2.5mg OD alongside Amlodipine, reinforce adherence. Enforce rest in a quiet bay, pacing behaviour addressed with reassurance and relaxation. Caffeine reduction, smoking cessation referral. Repeat BP every 30 minutes for 2 hours. Escalate to emergency if BP exceeds 200/120, or if any target organ symptoms develop — chest pain, visual disturbance, neurological signs.",
    },
  },
  {
    id: "elton_john",
    name: "Elton John",
    age: 77,
    pronouns: "He/Him",
    condition: "COPD exacerbation, bradycardia, visual green-yellow halos indicative of digoxin toxicity",
    bed: "C6",
    voice: {
      label: "Resonant, deep, traditional British music legend",
      lang: "en-GB",
      pitch: 0.7,
      rate: 0.8,
      volume: 1,
    },
    sbar: {
      situation: "Elton John, 77, male, admitted with an acute COPD exacerbation. Found to be bradycardic and reporting visual green-yellow halos — classic signs of digoxin toxicity. NEWS2 score is 7 (High — emergency assessment required).",
      background: "Known severe COPD (GOLD Grade 4), chronic atrial fibrillation rate-controlled with Digoxin 125mcg OD, heart failure (preserved EF). NKDA. Medications: Digoxin 125mcg OD, Furosemide 40mg OD, Ramipril 2.5mg OD, Atorvastatin, Salbutamol inhaler, Tiotropium, Salmeterol/Fluticasone. Recent chest infection treated with Clarithromycin by GP 5 days ago — known to increase digoxin levels. Reduced renal function (eGFR 38).",
      assessment: "HR 38 (bradycardic, irregular — AF with slow ventricular response), BP 142/88, RR 26, SpO₂ 88% on air (target 88–92% for COPD), Temp 37.9. Patient reports seeing green-yellow halos around lights, nausea, and fatigue. Bilateral wheeze and rhonchi on auscultation. ECG: AF with slow response, possible digoxin effect (scooped ST segments). NEWS2 = 7. Clinical picture: COPD exacerbation complicated by digoxin toxicity likely precipitated by Clarithromycin interaction and declining renal function.",
      recommendation: "Emergency assessment by senior clinician with critical care competencies. Hold Digoxin immediately. Send digoxin levels, U&Es (check potassium), magnesium. Treat bradycardia per protocol — atropine if symptomatic, consider Digoxin Fab antibody fragments if severe. Controlled oxygen via 28% Venturi mask targeting SpO₂ 88–92%. Nebulised Salbutamol, Prednisolone 30mg, IV antibiotics for infective exacerbation. Continuous cardiac monitoring. Escalate to ICU outreach immediately.",
    },
  },
];

export function getSBARPatient(id) {
  return SBAR_PATIENTS.find((p) => p.id === id) || null;
}

/**
 * Speak text using the Web Speech API with a celebrity's custom voice profile.
 * Falls back to default voice if the preferred lang is unavailable.
 */
export function speakAsCharacter(character, text, { onEnd } = {}) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    onEnd?.();
    return;
  }
  window.speechSynthesis.cancel();
  const clean = String(text || "").replace(/[*#`🔔]/g, "").trim();
  if (!clean) { onEnd?.(); return; }
  const u = new SpeechSynthesisUtterance(clean);
  u.pitch = character.voice.pitch;
  u.rate = character.voice.rate;
  u.volume = character.voice.volume;
  const voices = window.speechSynthesis.getVoices();
  const langPrefix = character.voice.lang.split("-")[0];
  const match =
    voices.find((v) => v.lang === character.voice.lang) ||
    voices.find((v) => new RegExp(`^${langPrefix}`, "i").test(v.lang)) ||
    voices.find((v) => /^en/i.test(v.lang));
  if (match) u.voice = match;
  u.onend = () => onEnd?.();
  u.onerror = () => onEnd?.();
  window.speechSynthesis.speak(u);
}

export function stopCharacterSpeech() {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}
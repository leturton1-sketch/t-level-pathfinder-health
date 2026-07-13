export function calculateNEWS2(vitals) {
  if (!vitals) return { score: 0, breakdown: {}, escalation: "none", color: "green", recommendation: "No assessment" };
  let score = 0;
  const breakdown = {};

  if (vitals.rr != null && vitals.rr > 0) {
    const rr = vitals.rr;
    if (rr <= 8) { breakdown.rr = { value: rr, points: 3 }; score += 3; }
    else if (rr >= 9 && rr <= 11) { breakdown.rr = { value: rr, points: 1 }; score += 1; }
    else if (rr >= 12 && rr <= 20) { breakdown.rr = { value: rr, points: 0 }; }
    else if (rr >= 21 && rr <= 24) { breakdown.rr = { value: rr, points: 2 }; score += 2; }
    else { breakdown.rr = { value: rr, points: 3 }; score += 3; }
  }

  if (vitals.spo2 != null && vitals.spo2 > 0) {
    const spo2 = vitals.spo2;
    if (spo2 >= 96) { breakdown.spo2 = { value: spo2, points: 0 }; }
    else if (spo2 >= 94 && spo2 <= 95) { breakdown.spo2 = { value: spo2, points: 1 }; score += 1; }
    else if (spo2 >= 92 && spo2 <= 93) { breakdown.spo2 = { value: spo2, points: 2 }; score += 2; }
    else { breakdown.spo2 = { value: spo2, points: 3 }; score += 3; }
  }

  if (vitals.supplemental_o2) { breakdown.supplemental_o2 = { value: "Yes", points: 2 }; score += 2; }
  else { breakdown.supplemental_o2 = { value: "No", points: 0 }; }

  if (vitals.sbp != null && vitals.sbp > 0) {
    const sbp = vitals.sbp;
    if (sbp <= 90) { breakdown.sbp = { value: sbp, points: 3 }; score += 3; }
    else if (sbp >= 91 && sbp <= 100) { breakdown.sbp = { value: sbp, points: 2 }; score += 2; }
    else if (sbp >= 101 && sbp <= 110) { breakdown.sbp = { value: sbp, points: 1 }; score += 1; }
    else if (sbp >= 111 && sbp <= 219) { breakdown.sbp = { value: sbp, points: 0 }; }
    else { breakdown.sbp = { value: sbp, points: 3 }; score += 3; }
  }

  if (vitals.hr != null && vitals.hr > 0) {
    const hr = vitals.hr;
    if (hr <= 40) { breakdown.hr = { value: hr, points: 3 }; score += 3; }
    else if (hr >= 41 && hr <= 50) { breakdown.hr = { value: hr, points: 1 }; score += 1; }
    else if (hr >= 51 && hr <= 90) { breakdown.hr = { value: hr, points: 0 }; }
    else if (hr >= 91 && hr <= 110) { breakdown.hr = { value: hr, points: 1 }; score += 1; }
    else if (hr >= 111 && hr <= 130) { breakdown.hr = { value: hr, points: 2 }; score += 2; }
    else { breakdown.hr = { value: hr, points: 3 }; score += 3; }
  }

  if (vitals.avpu) {
    if (vitals.avpu === "A") { breakdown.avpu = { value: "Alert", points: 0 }; }
    else { breakdown.avpu = { value: vitals.avpu, points: 3 }; score += 3; }
  }

  if (vitals.temp != null && vitals.temp > 0) {
    const temp = vitals.temp;
    if (temp <= 35.0) { breakdown.temp = { value: temp + "°C", points: 3 }; score += 3; }
    else if (temp >= 35.1 && temp <= 36.0) { breakdown.temp = { value: temp + "°C", points: 1 }; score += 1; }
    else if (temp >= 36.1 && temp <= 38.0) { breakdown.temp = { value: temp + "°C", points: 0 }; }
    else if (temp >= 38.1 && temp <= 39.0) { breakdown.temp = { value: temp + "°C", points: 1 }; score += 1; }
    else { breakdown.temp = { value: temp + "°C", points: 2 }; score += 2; }
  }

  let escalation, color, recommendation;
  if (score === 0) {
    escalation = "low"; color = "green";
    recommendation = "Routine clinical monitoring — minimum 12 hourly.";
  } else if (score >= 1 && score <= 4) {
    escalation = "low"; color = "green";
    recommendation = "Low score — informed registered nurse. Minimum 4-6 hourly monitoring.";
  } else if (score >= 5 && score <= 6) {
    escalation = "medium"; color = "amber";
    recommendation = "Medium score — urgent review by registered nurse/clinician. Consider escalation.";
  } else if (score >= 7) {
    escalation = "high"; color = "red";
    recommendation = "HIGH SCORE — Emergency assessment. Notify registrar/ICU outreach immediately.";
  }

  return { score, breakdown, escalation, color, recommendation };
}

export const NEWS2_PARAMS = [
  { key: "rr", label: "Respiratory Rate", unit: "breaths/min", placeholder: "12-20 normal" },
  { key: "spo2", label: "SpO₂", unit: "%", placeholder: "≥96 normal" },
  { key: "supplemental_o2", label: "Supplemental O₂", type: "toggle" },
  { key: "sbp", label: "Systolic BP", unit: "mmHg", placeholder: "111-219 normal" },
  { key: "hr", label: "Pulse Rate", unit: "bpm", placeholder: "51-90 normal" },
  { key: "avpu", label: "Consciousness", type: "select", options: ["A", "V", "P", "U"] },
  { key: "temp", label: "Temperature", unit: "°C", placeholder: "36.1-38.0 normal" },
];
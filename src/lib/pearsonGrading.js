/**
 * Pearson Formative Performance Assessment grading.
 * Scores compliance 0–100 and maps to technical grade bands used in the
 * T Level Health Core Component.
 */

export const PEARSON_GRADE_BANDS = [
  { min: 90, max: 100, band: "A*",  label: "Distinction (A*)",  description: "Outstanding — exceeds all performance outcomes with independent mastery." },
  { min: 80, max: 89,  band: "A",   label: "Distinction (A)",   description: "Excellent — confident, consistent demonstration across all outcomes." },
  { min: 70, max: 79,  band: "B",   label: "Merit (B)",         description: "Strong — consistent demonstration with minor gaps." },
  { min: 60, max: 69,  band: "C",   label: "Merit (C)",         description: "Good — sound demonstration, some support needed." },
  { min: 50, max: 59,  band: "D",   label: "Pass (D)",          description: "Satisfactory — meets threshold competence." },
  { min: 40, max: 49,  band: "E",   label: "Pass (E)",          description: "Borderline — just meets threshold, targeted support required." },
  { min: 0,  max: 39,  band: "U",   label: "Unclassified (U)",  description: "Not yet competent — further practice and reassessment required." },
];

export function pearsonGrade(score) {
  const s = Math.max(0, Math.min(100, Math.round(score)));
  return PEARSON_GRADE_BANDS.find((b) => s >= b.min && s <= b.max) || PEARSON_GRADE_BANDS[PEARSON_GRADE_BANDS.length - 1];
}

/**
 * Map a percentage (0–100) to a colour token reflecting the grade band.
 */
export function pearsonGradeColor(score) {
  const band = pearsonGrade(score).band;
  if (["A*", "A"].includes(band)) return { text: "text-clinical-green", bg: "bg-clinical-green/15", border: "border-clinical-green/30", ring: "text-clinical-green", bar: "bg-clinical-green" };
  if (["B", "C"].includes(band)) return { text: "text-clinical-teal", bg: "bg-clinical-teal/15", border: "border-clinical-teal/30", ring: "text-clinical-teal", bar: "bg-clinical-teal" };
  if (["D", "E"].includes(band)) return { text: "text-clinical-amber", bg: "bg-clinical-amber/15", border: "border-clinical-amber/30", ring: "text-clinical-amber", bar: "bg-clinical-amber" };
  return { text: "text-clinical-red", bg: "bg-clinical-red/15", border: "border-clinical-red/30", ring: "text-clinical-red", bar: "bg-clinical-red" };
}
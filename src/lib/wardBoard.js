import { WARD_PATIENTS } from "@/lib/wardPatients";

/** Standard NHS on-admission risk assessment schedule (hours from admission). */
export const RISK_ASSESSMENTS = [
  { id: "falls", label: "Falls Risk (FRAT)", dueWithinHours: 2 },
  { id: "pressure", label: "Pressure Ulcer (Waterlow)", dueWithinHours: 4 },
  { id: "vte", label: "VTE Risk Assessment", dueWithinHours: 14 },
  { id: "nutrition", label: "Nutrition (MUST)", dueWithinHours: 24 },
];

/** Pre-set time-on-ward for the existing celebrity patients (varied urgency). */
const ADMITTED_HOURS_AGO = { elvis: 6, dolly: 5, gordon: 3, ozzy: 2, ladygaga: 1 };

/** Patients waiting in the admissions queue — admitted on demand. */
export const INCOMING_PATIENTS = [
  { id: "tom", name: "Tom Hanks", age: 67, pronouns: "He/Him", nhs_number: "401 225 6610", condition: "Community-acquired pneumonia", allergies: "NKDA", initial_news2: 5, initial_vitals: { rr: 22, spo2: 93, supplemental_o2: true, sbp: 128, dbp: 80, hr: 96, avpu: "A", temp: 38.6 }, bed: "B2" },
  { id: "adele", name: "Adele", age: 36, pronouns: "She/Her", nhs_number: "552 778 1290", condition: "Acute migraine with vomiting", allergies: "Penicillin", initial_news2: 1, initial_vitals: { rr: 14, spo2: 98, supplemental_o2: false, sbp: 130, dbp: 82, hr: 78, avpu: "A", temp: 36.7 }, bed: "B3" },
  { id: "keanu", name: "Keanu Reeves", age: 59, pronouns: "He/Him", nhs_number: "673 980 4421", condition: "Post-op laparoscopic appendectomy (Day 0)", allergies: "NKDA", initial_news2: 2, initial_vitals: { rr: 16, spo2: 97, supplemental_o2: false, sbp: 116, dbp: 74, hr: 82, avpu: "A", temp: 37.1 }, bed: "B4" },
];

export const ALL_BEDS = ["A1", "A2", "A3", "A4", "B1", "B2", "B3", "B4"];

export function bedOf(p) { return p.bedDesignation || p.bed; }

/** Build the initial live ward board from the celebrity patients. */
export function initialBoard(now) {
  return WARD_PATIENTS.map((p) => ({
    ...p,
    admittedAt: now - (ADMITTED_HOURS_AGO[p.id] ?? 1) * 3600000,
  }));
}

/** Wrap an incoming patient as a newly-admitted board member. */
export function admitIncoming(patient, now) {
  return { ...patient, admittedAt: now };
}

/** Derive the scheduled risk assessments for a patient given admission time. */
export function scheduledRisks(admittedAt, now) {
  const elapsedH = (now - admittedAt) / 3600000;
  return RISK_ASSESSMENTS.map((r) => {
    const remainingH = r.dueWithinHours - elapsedH;
    const status = remainingH <= 0 ? "overdue" : remainingH < r.dueWithinHours * 0.25 ? "due-soon" : "scheduled";
    return { ...r, remainingH, status };
  });
}

export function formatCountdown(remainingH) {
  if (remainingH <= 0) return "Due now";
  const h = Math.floor(remainingH);
  const m = Math.max(0, Math.floor((remainingH - h) * 60));
  if (h <= 0) return `${m}m`;
  return `${h}h ${m}m`;
}

/** Live ward status label for a patient. */
export function patientStatus(patient, now) {
  const elapsedH = (now - patient.admittedAt) / 3600000;
  if (elapsedH < 2) return { label: "Admitted", tone: "blue" };
  const risks = scheduledRisks(patient.admittedAt, now);
  if (patient.initial_news2 >= 7) return { label: "Escalation", tone: "red" };
  if (risks.some((r) => r.status === "overdue")) return { label: "Action Due", tone: "amber" };
  if (patient.initial_news2 === 0 && elapsedH > 4) return { label: "Discharge Ready", tone: "green" };
  return { label: "Inpatient", tone: "slate" };
}

/** NEWS2 colour band. */
export function newsTone(score) {
  if (score >= 7) return { dot: "bg-clinical-red", text: "text-clinical-red", bg: "bg-clinical-red/10", border: "border-clinical-red/30", label: "HIGH" };
  if (score >= 5) return { dot: "bg-clinical-amber", text: "text-clinical-amber", bg: "bg-clinical-amber/10", border: "border-clinical-amber/30", label: "MEDIUM" };
  if (score >= 1) return { dot: "bg-clinical-amber", text: "text-clinical-amber", bg: "bg-clinical-amber/10", border: "border-clinical-amber/30", label: "LOW-MED" };
  return { dot: "bg-clinical-green", text: "text-clinical-green", bg: "bg-clinical-green/10", border: "border-clinical-green/30", label: "LOW" };
}

const STATUS_TONES = {
  blue: "bg-sky-100 text-sky-700 border-sky-200",
  red: "bg-clinical-red/10 text-clinical-red border-clinical-red/30",
  amber: "bg-clinical-amber/10 text-clinical-amber border-clinical-amber/30",
  green: "bg-clinical-green/10 text-clinical-green border-clinical-green/30",
  slate: "bg-slate-100 text-slate-600 border-slate-200",
};
export function statusToneClass(tone) { return STATUS_TONES[tone] || STATUS_TONES.slate; }
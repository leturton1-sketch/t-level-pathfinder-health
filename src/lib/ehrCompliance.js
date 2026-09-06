/**
 * EHR compliance gate — shared across all care planning submission handlers.
 * Reads the student's EHR tab read-state from sessionStorage and applies the
 * Pearson score penalty (-10 per unread tab, max -30) when submitting.
 */

const TAB_KEYS = ["drugChart", "nursingNotes", "labResults"];
const TAB_LABELS = { drugChart: "Drug Chart", nursingNotes: "Nursing Notes", labResults: "Lab Results" };

/** Read the EHR tab read-state for a patient from sessionStorage. */
export function getEhrReadState(patientId) {
  if (!patientId) return { drugChart: false, nursingNotes: false, labResults: false };
  try {
    const raw = sessionStorage.getItem(`ehr_read_${patientId}`);
    if (raw) return { ...{ drugChart: false, nursingNotes: false, labResults: false }, ...JSON.parse(raw) };
  } catch {}
  return { drugChart: false, nursingNotes: false, labResults: false };
}

/** Mark a tab as read (called by the EHR modal on scroll-to-bottom). */
export function markTabRead(patientId, tabKey) {
  if (!patientId || !TAB_KEYS.includes(tabKey)) return;
  const state = getEhrReadState(patientId);
  if (state[tabKey]) return;
  state[tabKey] = true;
  try { sessionStorage.setItem(`ehr_read_${patientId}`, JSON.stringify(state)); } catch {}
}

/** Returns array of unread tab labels, e.g. ["Nursing Notes", "Lab Results"]. */
export function getUnreadTabs(patientId) {
  const state = getEhrReadState(patientId);
  return TAB_KEYS.filter((k) => !state[k]).map((k) => TAB_LABELS[k]);
}

/** Returns the count of read tabs (0–3). */
export function getReadCount(patientId) {
  const state = getEhrReadState(patientId);
  return TAB_KEYS.filter((k) => state[k]).length;
}

/** Build the three compliance boolean fields for CarePlanSubmission. */
export function getComplianceFields(patientId) {
  const state = getEhrReadState(patientId);
  return {
    ehr_drug_chart_read: !!state.drugChart,
    ehr_nursing_notes_read: !!state.nursingNotes,
    ehr_lab_results_read: !!state.labResults,
  };
}

/** Apply the EHR penalty to a base Pearson score. Returns { score, penalty, unreadTabs }. */
export function applyEhrPenalty(patientId, baseScore) {
  const unread = getUnreadTabs(patientId);
  const penalty = Math.min(30, unread.length * 10);
  return {
    score: Math.max(0, baseScore - penalty),
    penalty,
    unreadTabs: unread,
    allRead: unread.length === 0,
  };
}

/** Store the active EHR patient when launching a care planning tool. */
export function setActiveEhrPatient(patientId) {
  try { sessionStorage.setItem("ehr_active_patient", patientId); } catch {}
}

/** Read the active EHR patient (set when launching from the EHR modal). */
export function getActiveEhrPatient() {
  try { return sessionStorage.getItem("ehr_active_patient") || null; } catch { return null; }
}
/**
 * Shared simulation & staffing state.
 *
 * A single source of truth for "is a simulation currently running, and who is
 * in control of it" plus "who is on duty in the ward". Both the dashboard and
 * the ward simulation page read/write this so summaries never disagree with
 * the detailed view, and nothing is populated until a user or tutor (or the
 * AI tutor, acting on their behalf) explicitly starts something.
 */

const STATE_KEY = "pf-simulation-state";
const STAFFING_KEY = "pf-staffing-roster";
const STATE_EVENT = "pf-simulation-change";
const STAFFING_EVENT = "pf-staffing-change";

function defaultSimulationState() {
  return {
    running: false,
    controller: null, // "user" | "ai" | null
    scenarioId: null,
    scenarioName: null,
    startedAt: null,
  };
}

export function getSimulationState() {
  if (typeof window === "undefined") return defaultSimulationState();
  try {
    const raw = window.localStorage.getItem(STATE_KEY);
    if (!raw) return defaultSimulationState();
    return { ...defaultSimulationState(), ...JSON.parse(raw) };
  } catch {
    return defaultSimulationState();
  }
}

function writeSimulationState(state) {
  if (typeof window === "undefined") return state;
  window.localStorage.setItem(STATE_KEY, JSON.stringify(state));
  window.dispatchEvent(new CustomEvent(STATE_EVENT, { detail: state }));
  return state;
}

/** Start a simulation. controller defaults to "user"; pass "ai" when the AI tutor initiates it. */
export function startSimulation({ controller = "user", scenarioId = null, scenarioName = null } = {}) {
  return writeSimulationState({ running: true, controller, scenarioId, scenarioName, startedAt: Date.now() });
}

/** End the active simulation and return to the empty, idle default. */
export function endSimulation() {
  return writeSimulationState(defaultSimulationState());
}

/** Hand control of the running simulation between the user and the AI tutor. */
export function setSimulationController(controller) {
  const current = getSimulationState();
  if (!current.running) return current;
  return writeSimulationState({ ...current, controller });
}

export function subscribeSimulationState(callback) {
  if (typeof window === "undefined") return () => {};
  const onChange = (event) => callback(event.detail ?? getSimulationState());
  const onStorage = (event) => { if (event.key === STATE_KEY) callback(getSimulationState()); };
  window.addEventListener(STATE_EVENT, onChange);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(STATE_EVENT, onChange);
    window.removeEventListener("storage", onStorage);
  };
}

/** Tutor-assigned staffing roster. Empty by default — nobody is "on shift" until a tutor assigns them. */
export function getStaffing() {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STAFFING_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function setStaffing(roster) {
  if (typeof window === "undefined") return roster;
  window.localStorage.setItem(STAFFING_KEY, JSON.stringify(roster));
  window.dispatchEvent(new CustomEvent(STAFFING_EVENT, { detail: roster }));
  return roster;
}

export function assignStaff(entry) {
  const roster = getStaffing();
  return setStaffing([...roster, { id: `staff_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, status: "Available", ...entry }]);
}

export function removeStaff(id) {
  return setStaffing(getStaffing().filter((entry) => entry.id !== id));
}

export function subscribeStaffing(callback) {
  if (typeof window === "undefined") return () => {};
  const onChange = (event) => callback(event.detail ?? getStaffing());
  const onStorage = (event) => { if (event.key === STAFFING_KEY) callback(getStaffing()); };
  window.addEventListener(STAFFING_EVENT, onChange);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(STAFFING_EVENT, onChange);
    window.removeEventListener("storage", onStorage);
  };
}

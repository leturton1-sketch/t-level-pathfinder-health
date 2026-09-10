// Activation is deliberately document-local: saved data never grants permission to run.
let generation = 0;
const active = new Set();
export const MODULE_RESET_EVENT = "pathfinder:modules-reset";
export function activateModule(name) { active.add(name); }
export function isModuleActive(name) { return active.has(name); }
export function getModuleGeneration() { return generation; }
export function resetModuleSession() {
  generation += 1;
  active.clear();
  if (typeof window !== "undefined") {
    window.speechSynthesis?.cancel();
    window.dispatchEvent(new Event(MODULE_RESET_EVENT));
  }
}

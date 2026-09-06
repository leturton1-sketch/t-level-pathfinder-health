export const RNN_POWER_SKILLS = [
  "Communication",
  "Creativity",
  "Critical thinking",
  "Decision making",
  "Leadership & adaptability",
  "Problem solving",
  "Proactivity & initiative",
  "Resilience",
  "Self-management",
  "Teamwork",
];

export const PATHFINDER_HUBS = ["LEARN", "DEVELOP", "PLACE", "EVIDENCE", "PROGRESS", "DESTINATION"];

export const MATCH_WEIGHTS = {
  aspiration: 0.25,
  technical: 0.18,
  travel: 0.12,
  attendance: 0.10,
  professionalism: 0.10,
  powerSkills: 0.12,
  digital: 0.06,
  requirements: 0.07,
};

export function weightedMatch(parts = {}) {
  const score =
    (parts.aspiration || 0) * MATCH_WEIGHTS.aspiration +
    (parts.technical || 0) * MATCH_WEIGHTS.technical +
    (parts.travel || 0) * MATCH_WEIGHTS.travel +
    (parts.attendance || 0) * MATCH_WEIGHTS.attendance +
    (parts.professionalism || 0) * MATCH_WEIGHTS.professionalism +
    (parts.powerSkills || 0) * MATCH_WEIGHTS.powerSkills +
    (parts.digital || 0) * MATCH_WEIGHTS.digital +
    (parts.requirements || 0) * MATCH_WEIGHTS.requirements;
  return Math.round(score);
}

export function readinessBand(value) {
  if (value >= 80) return { label: "Ready", tone: "emerald" };
  if (value >= 60) return { label: "Developing", tone: "amber" };
  return { label: "Priority gap", tone: "rose" };
}

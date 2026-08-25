export const ADL_TASKS = [
  { id: "personal_hygiene", title: "Personal hygiene and washing", staff: 1, prompt: "Support the patient with washing and personal hygiene while preserving dignity, privacy, choice and independence." },
  { id: "oral_care", title: "Oral care", staff: 1, prompt: "Support the patient with oral care, checking comfort and reporting any concerns." },
  { id: "dressing", title: "Dressing", staff: 1, prompt: "Support the patient to dress, encouraging independence and respecting their preferences." },
  { id: "nutrition", title: "Nutrition and hydration", staff: 1, prompt: "Support safe eating and drinking, check the care plan and record intake accurately." },
  { id: "continence", title: "Toileting and continence", staff: 1, prompt: "Support toileting and continence needs with privacy, infection prevention and accurate documentation." },
  { id: "mobility", title: "Mobility and transfer", staff: 2, prompt: "Support a safe transfer using the assessed mobility plan and approved equipment. This task requires two learners." },
  { id: "pressure_care", title: "Pressure-area care and repositioning", staff: 2, prompt: "Complete pressure-area care and repositioning in line with the care plan. This task requires two learners." },
  { id: "sleep_rest", title: "Comfort, sleep and rest", staff: 1, prompt: "Support comfort, positioning, sleep and rest while checking for unmet needs." },
  { id: "skin_integrity", title: "Skin integrity observation", staff: 2, prompt: "Support a skin inspection and safe repositioning, maintaining dignity and escalating concerns. This task requires two learners." },
  { id: "communication", title: "Communication and reassurance", staff: 1, prompt: "Use person-centred communication to understand the request, provide reassurance and confirm consent." },
];

export const CALL_BELL_INTERVALS = { slow: 90000, normal: 60000, fast: 30000 };

export function getAdlTaskPool(scenario) {
  const selected = Array.isArray(scenario?.adl_tasks) ? scenario.adl_tasks : [];
  if (!selected.length || scenario?.adl_task_source === "pregenerated") return ADL_TASKS;
  const specific = ADL_TASKS.filter((task) => selected.includes(task.id));
  if (!specific.length) return ADL_TASKS;
  return scenario?.adl_task_source === "mixed" ? [...specific, ...ADL_TASKS.filter((task) => !selected.includes(task.id))] : specific;
}

export function chooseRandom(list, previousId) {
  const candidates = list.filter((item) => item.id !== previousId);
  const pool = candidates.length ? candidates : list;
  return pool[Math.floor(Math.random() * pool.length)];
}

export function assignLearners(names, count) {
  const shuffled = [...names].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

// T Level Health theory modules — 9 specification areas, each split into 3 focused sub-modules (27 total).
// Each sub-module carries focused content and knowledge checks mapped to the Pearson specification.
// Aligned to: T Level Technical Qualification in Health (QN 610/7438/X), first teaching Sep 2026.

import { AREA1_MODULES } from "@/lib/theoryModules/area1";
import { AREA2_MODULES } from "@/lib/theoryModules/area2";
import { AREA3_MODULES } from "@/lib/theoryModules/area3";
import { AREA4_MODULES } from "@/lib/theoryModules/area4";
import { AREA5_MODULES } from "@/lib/theoryModules/area5";
import { AREA6_MODULES } from "@/lib/theoryModules/area6";
import { AREA7_MODULES } from "@/lib/theoryModules/area7";
import { AREA8_MODULES } from "@/lib/theoryModules/area8";
import { AREA9_MODULES } from "@/lib/theoryModules/area9";

export const THEORY_MODULES = [
  ...AREA1_MODULES,
  ...AREA2_MODULES,
  ...AREA3_MODULES,
  ...AREA4_MODULES,
  ...AREA5_MODULES,
  ...AREA6_MODULES,
  ...AREA7_MODULES,
  ...AREA8_MODULES,
  ...AREA9_MODULES,
];

// Normalise knowledge_checks for display (handles array or JSON string)
export function getKnowledgeChecks(module) {
  if (!module?.knowledge_checks) return [];
  if (Array.isArray(module.knowledge_checks)) return module.knowledge_checks;
  try {
    const parsed = JSON.parse(module.knowledge_checks);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
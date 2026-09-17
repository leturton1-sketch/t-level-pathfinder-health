/**
 * Permission-checked command dispatcher for the AI tutor.
 *
 * Gives Pathfinder AI a single, auditable entry point for acting on the ward
 * and the app on behalf of a tutor — placing/removing ward items, starting or
 * ending simulations, taking control of a running simulation, assigning
 * staffing, and creating or updating (never deleting) user accounts.
 *
 * Every command is checked against the acting user's role before anything
 * happens. Nothing here bypasses the existing UI permission model — it reuses
 * the same role checks and entity calls the manual controls use.
 */

import { base44 } from "@/api/base44Client";
import { startSimulation, endSimulation, setSimulationController, assignStaff, removeStaff } from "@/lib/simulationState";

const STAFF_ROLE = ["super_admin", "admin", "tutor"];

export const AI_MODULE_ROUTES = Object.freeze({
  dashboard: "/",
  theory: "/theory",
  care_planning: "/care-planning",
  ward_simulation: "/ward-simulation",
  knowledge_library: "/knowledge-library",
  interactive_learning: "/interactive-learning",
  anatomy_physiology: "/anatomy-physiology",
  health_hub: "/health-hub",
  clinical_skills: "/clinical-skills-academy",
  ai_models: "/ai-models",
  performance: "/performance",
  reflection: "/reflection",
  esp_practice: "/esp-practice",
  scenario_authoring: "/scenario-authoring",
  scenario_templates: "/scenario-templates",
  profile: "/profile",
  voice_assistant: "/voice-assistant",
  curriculum_readiness: "/curriculum-readiness",
  employer_portal: "/employer-portal",
  talent_card: "/talent-card",
});

const SCENARIO_DIFFICULTIES = ["guided", "intermediate", "independent"];
const SCENARIO_CATEGORIES = ["acute_care", "long_term_conditions", "mental_health", "end_of_life", "emergency", "community", "other"];

function canControl(user) {
  return STAFF_ROLE.includes(user?.role);
}

/**
 * Dispatch an AI-originated command.
 * @param {{type: string, [key: string]: any}} command
 * @param {{role?: string}} user - the acting user (tutor/admin), never a student.
 * @returns {{ok: boolean, message: string}}
 */
export async function dispatchAiCommand(command, user, { navigate } = {}) {
  if (!command || command.type === "none") return { ok: true, message: "" };
  if (!canControl(user)) {
    return { ok: false, message: "Only a tutor or admin (or the AI tutor acting on their behalf) can do that." };
  }

  switch (command.type) {
    case "navigate_module": {
      const path = AI_MODULE_ROUTES[command.module];
      if (!path) return { ok: false, message: "I could not find that Pathfinder module." };
      navigate?.(path);
      window.dispatchEvent(new CustomEvent("pathfinder:module-command", {
        detail: { module: command.module, action: "open", payload: command.payload || null, source: "clinical-educator" },
      }));
      return { ok: true, message: `Opened ${command.module.replaceAll("_", " ")}.` };
    }

    case "coordinate_module": {
      const path = AI_MODULE_ROUTES[command.module];
      if (!path || !command.moduleAction) return { ok: false, message: "A valid module and action are required." };
      if (command.openModule !== false) navigate?.(path);
      window.dispatchEvent(new CustomEvent("pathfinder:module-command", {
        detail: {
          module: command.module,
          action: command.moduleAction,
          payload: command.payload || null,
          source: "clinical-educator",
          requestedBy: user?.id,
        },
      }));
      return { ok: true, message: `Coordinating ${command.module.replaceAll("_", " ")}.` };
    }

    case "create_scenario": {
      if (!command.scenarioName || !command.patientName || !command.patientCondition) {
        return { ok: false, message: "A scenario name, patient name and patient condition are required." };
      }
      try {
        const created = await base44.entities.Scenario.create({
          name: command.scenarioName.trim(),
          description: command.description || "",
          difficulty: SCENARIO_DIFFICULTIES.includes(command.difficulty) ? command.difficulty : "guided",
          estimated_duration: Number(command.estimatedDuration) || 15,
          patient_name: command.patientName.trim(),
          patient_age: Number(command.patientAge) || null,
          patient_condition: command.patientCondition.trim(),
          comorbidities: command.comorbidities || "",
          medications: command.medications || "",
          allergies: command.allergies || "",
          bed_number: command.bedNumber || "",
          initial_vitals: command.initialVitals || {},
          initial_news2: Number(command.initialNews2) || 0,
          decision_tree: command.decisionTree || "[]",
          sk_codes: Array.isArray(command.skCodes) ? command.skCodes : [],
          performance_outcomes: Array.isArray(command.performanceOutcomes) ? command.performanceOutcomes : [],
          debrief_rationale: command.debriefRationale || "",
          assigned_cohorts: Array.isArray(command.assignedCohorts) ? command.assignedCohorts : [],
          is_custom: true,
          creator_id: user?.id,
          category: SCENARIO_CATEGORIES.includes(command.category) ? command.category : "other",
        });
        window.dispatchEvent(new CustomEvent("pathfinder:scenario-change", { detail: { action: "created", scenario: created } }));
        return { ok: true, message: `Scenario "${command.scenarioName}" created.`, data: created };
      } catch {
        return { ok: false, message: "I could not create that scenario. Please check the required clinical details." };
      }
    }

    case "update_scenario": {
      if (!command.scenarioId) return { ok: false, message: "A scenario id is required before I can modify it." };
      const allowed = {
        name: command.scenarioName,
        description: command.description,
        difficulty: SCENARIO_DIFFICULTIES.includes(command.difficulty) ? command.difficulty : undefined,
        estimated_duration: command.estimatedDuration ? Number(command.estimatedDuration) : undefined,
        patient_name: command.patientName,
        patient_age: command.patientAge ? Number(command.patientAge) : undefined,
        patient_condition: command.patientCondition,
        comorbidities: command.comorbidities,
        medications: command.medications,
        allergies: command.allergies,
        bed_number: command.bedNumber,
        initial_vitals: command.initialVitals,
        initial_news2: command.initialNews2 === undefined ? undefined : Number(command.initialNews2),
        decision_tree: command.decisionTree,
        sk_codes: command.skCodes,
        performance_outcomes: command.performanceOutcomes,
        debrief_rationale: command.debriefRationale,
        assigned_cohorts: command.assignedCohorts,
        category: SCENARIO_CATEGORIES.includes(command.category) ? command.category : undefined,
      };
      const changes = Object.fromEntries(Object.entries(allowed).filter(([, value]) => value !== undefined));
      if (!Object.keys(changes).length) return { ok: false, message: "Tell me which scenario details to change." };
      try {
        const updated = await base44.entities.Scenario.update(command.scenarioId, changes);
        window.dispatchEvent(new CustomEvent("pathfinder:scenario-change", { detail: { action: "updated", scenario: updated } }));
        return { ok: true, message: "Scenario updated.", data: updated };
      } catch {
        return { ok: false, message: "I could not update that scenario." };
      }
    }

    case "place_item":
    case "delete_item":
    case "rotate_item":
      // Ward layout edits are handled by WardSimulation's own ward-ai-command
      // listener; just forward them so both channels stay in sync.
      window.dispatchEvent(new CustomEvent("ward-ai-command", { detail: {
        action: command.type === "place_item" ? "place" : command.type === "delete_item" ? "delete" : "rotate",
        itemType: command.itemType, designation: command.designation, direction: command.direction,
      } }));
      return { ok: true, message: "Ward layout updated." };

    case "start_simulation":
      startSimulation({ controller: "ai", scenarioId: command.scenarioId, scenarioName: command.scenarioName });
      window.dispatchEvent(new CustomEvent("ward-ai-command", { detail: { action: "start-simulation", scenarioId: command.scenarioId, scenarioName: command.scenarioName } }));
      return { ok: true, message: `Simulation "${command.scenarioName || command.scenarioId}" started.` };

    case "end_simulation":
      endSimulation();
      window.dispatchEvent(new CustomEvent("ward-ai-command", { detail: { action: "end-simulation" } }));
      return { ok: true, message: "Simulation ended." };

    case "take_control":
      setSimulationController(command.controller === "user" ? "user" : "ai");
      return { ok: true, message: `Control handed to ${command.controller === "user" ? "the user" : "the AI tutor"}.` };

    case "assign_staff":
      if (!command.name || !command.dutyRole) return { ok: false, message: "A name and duty role are needed to assign staff." };
      assignStaff({ name: command.name, dutyRole: command.dutyRole, status: command.status || "Available" });
      return { ok: true, message: `${command.name} assigned as ${command.dutyRole}.` };

    case "remove_staff":
      if (!command.staffId) return { ok: false, message: "A staff entry id is needed to remove someone from duty." };
      removeStaff(command.staffId);
      return { ok: true, message: "Staff member removed from duty." };

    case "create_user":
      if (!command.username || !command.fullName) return { ok: false, message: "A username and full name are needed to create a user." };
      try {
        await base44.entities.AppUser.create({
          username: command.username.toLowerCase().trim(),
          pin: "0000",
          role: ["student", "tutor"].includes(command.role) ? command.role : "student",
          full_name: command.fullName,
          cohort: command.cohort || "",
          first_login: true,
          active: true,
          ai_voice: "honey",
          ai_persona: "female",
          is_protected: false,
        });
        return { ok: true, message: `Account created for ${command.fullName}.` };
      } catch {
        return { ok: false, message: "Could not create that account — the username may already be taken." };
      }

    case "update_user_role":
      if (!command.userId || !command.role) return { ok: false, message: "A user id and role are needed to update an account." };
      try {
        await base44.entities.AppUser.update(command.userId, { role: command.role });
        return { ok: true, message: "User role updated." };
      } catch {
        return { ok: false, message: "Could not update that account." };
      }

    default:
      // Deliberately unsupported: removing users. That stays a manual, confirmed
      // action in User Management so a chat instruction can never delete an account.
      return { ok: false, message: "That action isn't available for the AI tutor to perform." };
  }
}

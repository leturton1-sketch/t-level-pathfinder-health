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
import {
  getSimulationState, startSimulation, endSimulation, pauseSimulation, resumeSimulation,
  setSimulationController, setSimulationInputFrozen, setSimulationEvent, assignStaff, removeStaff,
} from "@/lib/simulationState";

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

function announceEducatorAction(message, level = "info") {
  window.dispatchEvent(new CustomEvent("pathfinder:educator-announcement", {
    detail: { message, level, source: "Pathfinder AI Clinical Educator", timestamp: Date.now() },
  }));
}

function completed(message, { announce = true, level = "info", data } = {}) {
  if (announce) announceEducatorAction(message, level);
  return { ok: true, message, ...(data === undefined ? {} : { data }) };
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
    return {
      ok: false,
      message: "I can help you learn, but this action changes the simulation environment and requires verified Educator or Administrator authorisation.",
    };
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
      return completed("The Clinical Educator has updated the ward layout.");

    case "start_simulation": {
      const label = command.scenarioName || command.scenarioId || "clinical";
      startSimulation({ controller: "ai", scenarioId: command.scenarioId, scenarioName: command.scenarioName });
      window.dispatchEvent(new CustomEvent("ward-ai-command", { detail: { action: "start-simulation", scenarioId: command.scenarioId, scenarioName: command.scenarioName } }));
      return completed(`The Clinical Educator has started the "${label}" simulation and now controls the ward.`);
    }

    case "pause_simulation":
      if (!getSimulationState().running) return { ok: false, message: "There is no active simulation to pause." };
      pauseSimulation();
      window.dispatchEvent(new CustomEvent("ward-ai-command", { detail: { action: "pause-simulation" } }));
      return completed("The Clinical Educator has paused the simulation. Student actions are temporarily held.", { level: "warning" });

    case "resume_simulation":
      if (!getSimulationState().running) return { ok: false, message: "There is no active simulation to resume." };
      resumeSimulation();
      window.dispatchEvent(new CustomEvent("ward-ai-command", { detail: { action: "resume-simulation" } }));
      return completed("The Clinical Educator has resumed the simulation.");

    case "end_simulation":
      endSimulation();
      window.dispatchEvent(new CustomEvent("ward-ai-command", { detail: { action: "end-simulation" } }));
      return completed("The Clinical Educator has ended the simulation and cleared the live simulation state.", { level: "warning" });

    case "take_control": {
      const controller = command.controller === "user" ? "user" : "ai";
      setSimulationController(controller);
      window.dispatchEvent(new CustomEvent("ward-ai-command", { detail: { action: "take-control", controller } }));
      return completed(controller === "user"
        ? "The Clinical Educator has handed ward control back to the user."
        : "The Clinical Educator has taken control of the ward.", { level: controller === "ai" ? "warning" : "info" });
    }

    case "freeze_inputs": {
      if (!getSimulationState().running) return { ok: false, message: "Start a simulation before freezing student controls." };
      const frozen = command.frozen !== false;
      setSimulationInputFrozen(frozen);
      return completed(frozen
        ? "The Clinical Educator has frozen student ward controls."
        : "The Clinical Educator has restored student ward controls.", { level: frozen ? "warning" : "info" });
    }

    case "trigger_ward_event": {
      if (!getSimulationState().running) return { ok: false, message: "Start a simulation before triggering a ward event." };
      const eventName = String(command.eventName || "clinical event").trim();
      setSimulationEvent({ name: eventName, bed: command.bed || null, payload: command.payload || null, triggeredAt: Date.now() });
      window.dispatchEvent(new CustomEvent("ward-ai-command", { detail: { action: "trigger-event", eventName, bed: command.bed, payload: command.payload } }));
      return completed(`Clinical Educator override: ${eventName} has been triggered${command.bed ? ` at ${command.bed}` : ""}.`, { level: "warning" });
    }

    case "focus_ward": {
      window.dispatchEvent(new CustomEvent("ward-ai-command", { detail: {
        action: "focus", designation: command.designation, x: command.x, z: command.z, suite: command.suite,
      } }));
      return completed("The Clinical Educator has focused the ward view on the requested clinical activity.");
    }

    case "update_vitals": {
      if (!command.vitals || typeof command.vitals !== "object") return { ok: false, message: "Provide the vital-sign values to apply." };
      window.dispatchEvent(new CustomEvent("ward-ai-command", { detail: {
        action: "update-vitals", bed: command.bed, vitals: command.vitals,
      } }));
      return completed(`The Clinical Educator has updated the live observations${command.bed ? ` for ${command.bed}` : ""}.`, { level: "warning" });
    }

    case "clear_ward":
      window.dispatchEvent(new CustomEvent("ward-ai-command", { detail: { action: "clear-ward" } }));
      return completed("The Clinical Educator has cleared user-generated ward items.", { level: "warning" });

    case "generate_resource": {
      if (!command.title || !command.instructions) {
        return { ok: false, message: "A title and clear content instructions are required to generate a learning resource." };
      }
      try {
        const resource = await base44.entities.KnowledgeArticle.create({
          title: command.title.trim(),
          category: "specification",
          content: command.instructions,
          sk_codes: Array.isArray(command.skCodes) ? command.skCodes : [],
          performance_outcomes: Array.isArray(command.performanceOutcomes) ? command.performanceOutcomes : [],
          references: [],
          source: "Pathfinder AI Clinical Educator",
        });
        window.dispatchEvent(new CustomEvent("pathfinder:module-command", { detail: {
          module: command.module || "knowledge_library",
          action: "resource-created",
          payload: { resourceType: command.resourceType, resource },
          source: "clinical-educator",
        } }));
        return completed(`The Clinical Educator has created "${command.title}" and saved it to the Knowledge Library.`, { data: resource });
      } catch {
        return { ok: false, message: "I could not save that learning resource. Please check the title and content." };
      }
    }

    case "delete_scenario":
      if (!command.scenarioId) return { ok: false, message: "A scenario id is required before I can remove it." };
      try {
        await base44.entities.Scenario.delete(command.scenarioId);
        window.dispatchEvent(new CustomEvent("pathfinder:scenario-change", { detail: { action: "deleted", scenarioId: command.scenarioId } }));
        return completed("The Clinical Educator has removed the selected scenario.", { level: "warning" });
      } catch {
        return { ok: false, message: "I could not remove that scenario. It may be protected or no longer available." };
      }

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

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

function canControl(user) {
  return STAFF_ROLE.includes(user?.role);
}

/**
 * Dispatch an AI-originated command.
 * @param {{type: string, [key: string]: any}} command
 * @param {{role?: string}} user - the acting user (tutor/admin), never a student.
 * @returns {{ok: boolean, message: string}}
 */
export async function dispatchAiCommand(command, user) {
  if (!command || command.type === "none") return { ok: true, message: "" };
  if (!canControl(user)) {
    return { ok: false, message: "Only a tutor or admin (or the AI tutor acting on their behalf) can do that." };
  }

  switch (command.type) {
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

import { createClientFromRequest } from "npm:@base44/sdk";
import {
  hashPinIfPresent, isStaff, isAdmin, isPlainObject,
  cleanQuery, cleanData, safeSort, safeNumber,
  readSessionToken, authenticate, sha256, json,
} from "../../shared/userAuth.ts";

const POLICIES = {
  TheoryModule: { read: "all", write: "staff" },
  Scenario: { read: "all", write: "staff" },
  ScenarioTemplate: { read: "all", write: "staff" },
  KnowledgeArticle: { read: "all", write: "staff" },
  CurriculumRequirement: { read: "all", write: "staff" },
  WardLayout: { read: "all", write: "staff" },
  EmployerProfile: { read: "all", write: "staff" },
  SimulationResult: { owner: "student_id", read: "owner", write: "owner" },
  CarePlanSubmission: { owner: "student_id", read: "owner", write: "owner" },
  ESPPortfolio: { owner: "student_id", read: "owner", write: "owner" },
  TalentCard: { owner: "student_id", read: "owner", write: "owner" },
  LearnerReadiness: { owner: "student_id", read: "owner", write: "staff" },
  HealthHubRecord: { owner: "recorded_by_id", read: "owner", write: "owner" },
  PlacementMatch: { owner: "student_id", read: "owner", write: "staff" },
  AuthAudit: { read: "staff", write: "none" },
};

// Record ownership does not grant permission to edit assessment outcomes.
// These fields are controlled by tutors/admins even when the learner owns the
// surrounding record. Simulation results are immutable after creation: they
// are a snapshot of one completed practice attempt, not an editable grade.
const STUDENT_PROTECTED_FIELDS = {
  SimulationResult: new Set([
    "student_name", "scenario_id", "scenario_name", "decisions", "score",
    "max_score", "decision_path", "completed", "sk_codes", "performance_outcomes",
  ]),
  CarePlanSubmission: new Set(["tutor_feedback", "tutor_id", "reviewed_at"]),
  ESPPortfolio: new Set(["tutor_role_play_feedback", "tutor_feedback"]),
  TalentCard: new Set([
    "attendance_pct", "professionalism_score", "placement_hours",
    "employer_feedback", "verified", "updated_by",
  ]),
};

function constrainStudentWrite(entityName, operation, data) {
  const protectedFields = STUDENT_PROTECTED_FIELDS[entityName];
  if (!protectedFields) return data;

  const safe = { ...data };
  // SimulationResult grading fields are accepted only on initial creation as
  // immutable formative telemetry. Subsequent learner edits are prohibited.
  if (!(entityName === "SimulationResult" && operation === "create")) {
    for (const field of protectedFields) delete safe[field];
  }

  if (entityName === "CarePlanSubmission" && safe.status === "reviewed") delete safe.status;
  if (entityName === "ESPPortfolio" && safe.status === "reviewed") delete safe.status;
  return safe;
}

function stripSensitive(entityName, value) {
  const stripOne = (row) => {
    if (!row || typeof row !== "object") return row;
    const next = { ...row };
    if (entityName === "AuthAudit") delete next.platform_user_id;
    if (entityName === "AppSession" || entityName === "QRAccessCredential") return null;
    return next;
  };
  if (Array.isArray(value)) return value.map(stripOne).filter(Boolean);
  return stripOne(value);
}

function mayWrite(policy, user) {
  if (policy.write === "staff") return isStaff(user);
  if (policy.write === "owner") return true;
  return false;
}

function owns(policy, user, record) {
  return !policy.owner || String(record?.[policy.owner] || "") === String(user.id);
}

// Self-service AppUser operations only: a user can read their own profile
// (for session verification) and update their own PIN/voice preferences (for
// the first-login PIN change). All other account management — listing,
// creating, deleting, resetting another user's PIN — goes through the
// dedicated manageUsers function.
async function selfServiceAppUser(base44, user, operation, args) {
  const entity = base44.asServiceRole.entities.AppUser;

  if (operation === "get") {
    if (String(args?.id || "") !== String(user.id)) return json({ error: "Not authorised." }, 403);
    const target = await entity.get(String(user.id)).catch(() => null);
    if (!target) return json({ error: "Account not found." }, 404);
    return json({ ...target, pin: undefined, qr_token: undefined });
  }

  if (operation === "update") {
    if (String(args?.id || "") !== String(user.id)) return json({ error: "Not authorised." }, 403);
    let data = cleanData(args.data);
    const selfFields = new Set(["pin", "first_login", "ai_voice", "ai_persona"]);
    if (Object.keys(data).some((key) => !selfFields.has(key))) {
      return json({ error: "Not authorised." }, 403);
    }
    // first_login is server-derived: only a new PIN clears it. Reject any
    // attempt to set first_login without also supplying a new PIN, which
    // would skip the forced PIN rotation.
    if (Object.prototype.hasOwnProperty.call(data, "first_login") && !Object.prototype.hasOwnProperty.call(data, "pin")) {
      return json({ error: "Set a new PIN to complete the first-login change." }, 403);
    }
    delete data.first_login;
    if (Object.prototype.hasOwnProperty.call(data, "pin")) data.first_login = false;
    data = await hashPinIfPresent(data);
    const updated = await entity.update(user.id, data);
    return json({ ...updated, pin: undefined, qr_token: undefined });
  }

  return json({ error: "Account management is not available through this endpoint." }, 403);
}

export default async function(req) {
  if (req.method !== "POST") return json({ error: "Method not allowed." }, 405);

  const contentLength = Number(req.headers.get("content-length") || 0);
  if (Number.isFinite(contentLength) && contentLength > 50000) {
    return json({ error: "The request is too large." }, 413);
  }

  try {
    const body = await req.json().catch(() => ({}));
    const base44 = createClientFromRequest(req);
    const token = readSessionToken(req, body);
    const user = await authenticate(base44, token);
    if (!user) return json({ error: "Session expired. Sign in again." }, 401);

    // Server-side logout: revoke the presented session token so a captured token
    // cannot keep authorising requests after the user signs out.
    if (body?.revoke_session) {
      try {
        const tokenHash = await sha256(String(token));
        await base44.asServiceRole.entities.AppSession.updateMany(
          { token_hash: tokenHash, revoked: false },
          { $set: { revoked: true } },
        );
      } catch {}
      return Response.json({ revoked: true }, {
        headers: {
          "Cache-Control": "no-store",
          "Set-Cookie": "pathfinder-session=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0",
        },
      });
    }

    const entityName = String(body?.entity_name || "");
    const operation = String(body?.operation || "");
    const args = isPlainObject(body?.args) ? body.args : {};

    // AppUser is self-service only here. Staff account management goes
    // through the manageUsers function.
    if (entityName === "AppUser") {
      return await selfServiceAppUser(base44, user, operation, args);
    }

    const policy = POLICIES[entityName];
    if (!policy) return json({ error: "Entity is not available through this endpoint." }, 403);
    if (!["list", "filter", "get", "create", "update", "delete"].includes(operation)) {
      return json({ error: "Unsupported operation." }, 400);
    }

    // First-login users must change their temporary PIN before any app data is
    // accessible. Self-service AppUser operations (above) remain available so
    // the user can complete the PIN change.
    if (user.first_login) {
      return json({ error: "Please change your temporary PIN to continue." }, 403);
    }

    const entity = base44.asServiceRole.entities[entityName];
    const readOperation = ["list", "filter", "get"].includes(operation);

    if (readOperation && policy.read === "staff" && !isStaff(user)) {
      return json({ error: "Not authorised." }, 403);
    }
    if (!readOperation && !mayWrite(policy, user)) {
      return json({ error: "Not authorised." }, 403);
    }

    if (operation === "list" || operation === "filter") {
      let query = operation === "filter" ? cleanQuery(args.query) : {};
      // Owner-based entities align with their RLS: only admins bypass the
      // owner filter. Tutors are filtered to records they own (e.g. the
      // HealthHubRecord clinic checks they recorded), matching the RLS which
      // grants broad read only to admins.
      if (policy.owner && !isAdmin(user)) query = { ...query, [policy.owner]: user.id };
      const rows = await entity.filter(
        query,
        safeSort(args.sort),
        safeNumber(args.limit, 100, 200),
        safeNumber(args.skip, 0, 10000),
      );
      return json(stripSensitive(entityName, rows));
    }

    if (operation === "get") {
      const row = await entity.get(String(args.id || "")).catch(() => null);
      if (!row) return json({ error: "Record not found." }, 404);
      if (policy.owner && !isAdmin(user) && !owns(policy, user, row)) {
        return json({ error: "Not authorised." }, 403);
      }
      return json(stripSensitive(entityName, row));
    }

    if (operation === "create") {
      let data = cleanData(args.data);
      if (policy.owner && !isStaff(user)) {
        data = constrainStudentWrite(entityName, "create", data);
        data = { ...data, [policy.owner]: user.id };
      }
      return json(stripSensitive(entityName, await entity.create(data)), 201);
    }

    const existing = await entity.get(String(args.id || "")).catch(() => null);
    if (!existing) return json({ error: "Record not found." }, 404);
    if (policy.owner && !isStaff(user) && !owns(policy, user, existing)) {
      return json({ error: "Not authorised." }, 403);
    }

    if (operation === "update") {
      let data = cleanData(args.data);
      if (policy.owner && !isStaff(user)) {
        delete data[policy.owner];
        data = constrainStudentWrite(entityName, "update", data);
        if (!Object.keys(data).length) {
          return json({ error: "Assessment and tutor-controlled fields cannot be changed by learners." }, 403);
        }
      }
      return json(stripSensitive(entityName, await entity.update(existing.id, data)));
    }

    return json(await entity.delete(existing.id));
  } catch (error) {
    const message = error?.message === "Invalid query." || error?.message?.startsWith("Only exact-match") ||
      error?.message?.startsWith("Invalid payload") || error?.message?.startsWith("PIN must")
      ? error.message
      : "Unable to process the request.";
    return json({ error: message }, message === "Unable to process the request." ? 500 : 400);
  }
}
import { createClientFromRequest } from "npm:@base44/sdk";

const STAFF_ROLES = new Set(["tutor", "admin", "super_admin"]);
const ADMIN_ROLES = new Set(["admin", "super_admin"]);

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
  LearnerReadiness: { owner: "student_id", read: "owner", write: "owner" },
  HealthHubRecord: { owner: "recorded_by_id", read: "owner", write: "owner" },
  PlacementMatch: { owner: "student_id", read: "owner", write: "staff" },
  AppUser: { read: "special", write: "special" },
  AuthAudit: { read: "staff", write: "none" },
};

const APP_USER_FIELDS = new Set([
  "username", "pin", "role", "title", "full_name", "institution", "cohort",
  "first_login", "active", "ai_voice", "ai_persona", "is_protected",
]);

function json(body, status = 200) {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

async function sha256(value) {
  const bytes = new TextEncoder().encode(String(value));
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

function isPlainObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype;
}

function cleanQuery(input) {
  if (input == null) return {};
  if (!isPlainObject(input)) throw new Error("Invalid query.");
  const out = {};
  for (const [key, value] of Object.entries(input)) {
    if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(key)) throw new Error("Invalid query field.");
    if (value !== null && !["string", "number", "boolean"].includes(typeof value)) {
      throw new Error("Only exact-match filters are supported.");
    }
    out[key] = value;
  }
  return out;
}

function cleanValue(value, depth = 0) {
  if (depth > 8) throw new Error("Payload is too deeply nested.");
  if (value == null || ["string", "number", "boolean"].includes(typeof value)) return value;
  if (Array.isArray(value)) return value.map((item) => cleanValue(item, depth + 1));
  if (!isPlainObject(value)) throw new Error("Invalid payload value.");
  const out = {};
  for (const [key, nested] of Object.entries(value)) {
    if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(key)) throw new Error("Invalid payload field.");
    out[key] = cleanValue(nested, depth + 1);
  }
  return out;
}

function cleanData(input) {
  if (!isPlainObject(input)) throw new Error("Invalid data.");
  const out = cleanValue(input);
  delete out.id;
  delete out.created_date;
  delete out.updated_date;
  delete out.created_by_id;
  return out;
}

function safeSort(value) {
  return typeof value === "string" && /^-?[a-zA-Z][a-zA-Z0-9_]*$/.test(value) ? value : undefined;
}

function safeNumber(value, fallback, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(0, Math.min(max, Math.trunc(number)));
}

function stripSensitive(entityName, value) {
  const stripOne = (row) => {
    if (!row || typeof row !== "object") return row;
    const next = { ...row };
    if (entityName === "AppUser") {
      delete next.pin;
      delete next.qr_token;
    }
    if (entityName === "AuthAudit") delete next.platform_user_id;
    if (entityName === "AppSession" || entityName === "QRAccessCredential") return null;
    return next;
  };
  if (Array.isArray(value)) return value.map(stripOne).filter(Boolean);
  return stripOne(value);
}

async function authenticate(base44, token) {
  if (typeof token !== "string" || !/^[a-f0-9]{64}$/.test(token)) return null;
  const tokenHash = await sha256(token);
  const sessions = await base44.asServiceRole.entities.AppSession.filter(
    { token_hash: tokenHash, revoked: false },
    "-expires_at",
    3,
  );
  const session = (sessions || []).find((item) => {
    const expiresAt = Date.parse(item.expires_at);
    return Number.isFinite(expiresAt) && expiresAt > Date.now();
  });
  if (!session) return null;
  const users = await base44.asServiceRole.entities.AppUser.filter({
    id: session.app_user_id,
    active: true,
  });
  return users?.[0] || null;
}

function isStaff(user) {
  return STAFF_ROLES.has(user?.role);
}

function mayWrite(policy, user) {
  if (policy.write === "staff") return isStaff(user);
  if (policy.write === "owner") return true;
  return false;
}

function owns(policy, user, record) {
  return !policy.owner || String(record?.[policy.owner] || "") === String(user.id);
}

async function hashPinIfPresent(data) {
  if (!Object.prototype.hasOwnProperty.call(data, "pin")) return data;
  const pin = String(data.pin || "");
  if (!/^\d{4,6}$/.test(pin) && !/^sha256:[a-f0-9]{64}$/.test(pin)) {
    throw new Error("PIN must contain 4 to 6 digits.");
  }
  return {
    ...data,
    pin: pin.startsWith("sha256:") ? pin : `sha256:${await sha256(pin)}`,
  };
}

async function appUserOperation(base44, user, operation, args) {
  const entity = base44.asServiceRole.entities.AppUser;
  const staff = isStaff(user);

  if (operation === "list" || operation === "filter") {
    if (!staff) return json({ error: "Not authorised." }, 403);
    const query = operation === "filter" ? cleanQuery(args?.query) : {};
    const rows = await entity.filter(
      query,
      safeSort(args?.sort),
      safeNumber(args?.limit, 100, 200),
      safeNumber(args?.skip, 0, 10000),
    );
    return json(stripSensitive("AppUser", rows));
  }

  if (operation === "get") {
    const target = await entity.get(String(args?.id || ""));
    if (!staff && target?.id !== user.id) return json({ error: "Not authorised." }, 403);
    return json(stripSensitive("AppUser", target));
  }

  if (operation === "create") {
    if (!staff) return json({ error: "Not authorised." }, 403);
    let data = cleanData(args?.data);
    const allowedRoles = user.role === "super_admin"
      ? new Set(["guest", "student", "tutor", "admin"])
      : user.role === "admin"
        ? new Set(["guest", "student", "tutor"])
        : new Set(["guest", "student"]);
    if (!allowedRoles.has(data.role || "student")) return json({ error: "Role not permitted." }, 403);
    data = Object.fromEntries(Object.entries(data).filter(([key]) => APP_USER_FIELDS.has(key)));
    data = await hashPinIfPresent({ ...data, pin: data.pin || "0000", role: data.role || "student", active: data.active !== false });
    return json(stripSensitive("AppUser", await entity.create(data)), 201);
  }

  const target = await entity.get(String(args?.id || "")).catch(() => null);
  if (!target) return json({ error: "Account not found." }, 404);

  if (operation === "update") {
    let data = cleanData(args?.data);
    if (target.id === user.id && !staff) {
      const selfFields = new Set(["pin", "first_login", "ai_voice", "ai_persona"]);
      if (Object.keys(data).some((key) => !selfFields.has(key))) return json({ error: "Not authorised." }, 403);
    } else {
      if (!staff) return json({ error: "Not authorised." }, 403);
      if ((target.is_protected || target.role === "super_admin") && user.role !== "super_admin") {
        return json({ error: "Protected account." }, 403);
      }
      if (user.role === "tutor" && !["student", "guest"].includes(target.role)) {
        return json({ error: "Not authorised." }, 403);
      }
      if (Object.prototype.hasOwnProperty.call(data, "role")) {
        const permitted = user.role === "super_admin"
          ? ["guest", "student", "tutor", "admin"]
          : user.role === "admin"
            ? ["guest", "student", "tutor"]
            : ["guest", "student"];
        if (!permitted.includes(data.role)) return json({ error: "Role not permitted." }, 403);
      }
      data = Object.fromEntries(Object.entries(data).filter(([key]) => APP_USER_FIELDS.has(key)));
    }
    data = await hashPinIfPresent(data);
    return json(stripSensitive("AppUser", await entity.update(target.id, data)));
  }

  if (operation === "delete") {
    if (!staff || target.id === user.id || target.is_protected || target.role === "super_admin") {
      return json({ error: "Not authorised." }, 403);
    }
    if (user.role === "tutor" && !["student", "guest"].includes(target.role)) {
      return json({ error: "Not authorised." }, 403);
    }
    if (user.role === "admin" && target.role === "admin") {
      return json({ error: "Not authorised." }, 403);
    }
    return json(await entity.delete(target.id));
  }

  return json({ error: "Unsupported operation." }, 400);
}

export default async function(req) {
  if (req.method !== "POST") return json({ error: "Method not allowed." }, 405);

  try {
    const body = await req.json().catch(() => ({}));
    const base44 = createClientFromRequest(req);
    const user = await authenticate(base44, body?.session_token || body?.pathfinder_session_token);
    if (!user) return json({ error: "Session expired. Sign in again." }, 401);

    const entityName = String(body?.entity_name || "");
    const operation = String(body?.operation || "");
    const args = isPlainObject(body?.args) ? body.args : {};
    const policy = POLICIES[entityName];

    if (!policy) return json({ error: "Entity is not available through this endpoint." }, 403);
    if (!["list", "filter", "get", "create", "update", "delete"].includes(operation)) {
      return json({ error: "Unsupported operation." }, 400);
    }

    if (entityName === "AppUser") {
      return await appUserOperation(base44, user, operation, args);
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
      if (policy.owner && !isStaff(user)) query = { ...query, [policy.owner]: user.id };
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
      if (policy.owner && !isStaff(user) && !owns(policy, user, row)) {
        return json({ error: "Not authorised." }, 403);
      }
      return json(stripSensitive(entityName, row));
    }

    if (operation === "create") {
      let data = cleanData(args.data);
      if (policy.owner && !isStaff(user)) data = { ...data, [policy.owner]: user.id };
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

import { createClientFromRequest } from "npm:@base44/sdk";
import {
  APP_USER_FIELDS, hashPinIfPresent, generateRandomPin,
  isStaff, isPlainObject, cleanData, cleanQuery, safeSort, safeNumber,
  readSessionToken, authenticate, stripAppUserSensitive, json,
} from "../../shared/userAuth.ts";

// Admin-only account management. Separated from the general appData endpoint
// so the main data gateway can never be used to create, modify or delete
// accounts — even if a student session were compromised. Only staff
// (tutor/admin/super_admin) may call this function, and the role hierarchy
// is enforced on every operation.
export default async function(req) {
  if (req.method !== "POST") return json({ error: "Method not allowed." }, 405);

  try {
    const body = await req.json().catch(() => ({}));
    const base44 = createClientFromRequest(req);
    const token = readSessionToken(req, body);
    const user = await authenticate(base44, token);
    if (!user) return json({ error: "Session expired. Sign in again." }, 401);

    // Only staff may manage accounts.
    if (!isStaff(user)) return json({ error: "Not authorised." }, 403);

    // First-login users must change their own PIN before administering others.
    if (user.first_login) return json({ error: "Please change your temporary PIN to continue." }, 403);

    const operation = String(body?.operation || "");
    const args = isPlainObject(body?.args) ? body.args : {};
    const entity = base44.asServiceRole.entities.AppUser;

    // ---- List / Filter ----
    if (operation === "list" || operation === "filter") {
      const query = operation === "filter" ? cleanQuery(args.query) : {};
      const rows = await entity.filter(
        query,
        safeSort(args.sort),
        safeNumber(args.limit, 100, 200),
        safeNumber(args.skip, 0, 10000),
      );
      return json(stripAppUserSensitive(rows));
    }

    // ---- Get ----
    if (operation === "get") {
      const target = await entity.get(String(args.id || "")).catch(() => null);
      if (!target) return json({ error: "Account not found." }, 404);
      return json(stripAppUserSensitive(target));
    }

    // ---- Create ----
    if (operation === "create") {
      let data = cleanData(args.data);
      const allowedRoles = user.role === "super_admin"
        ? new Set(["guest", "student", "tutor", "admin"])
        : user.role === "admin"
          ? new Set(["guest", "student", "tutor"])
          : new Set(["guest", "student"]);
      if (!allowedRoles.has(data.role || "student")) return json({ error: "Role not permitted." }, 403);
      data = Object.fromEntries(Object.entries(data).filter(([key]) => APP_USER_FIELDS.has(key)));
      // Never persist a guessable PIN. When no PIN (or the legacy "0000") is
      // supplied, issue a random one and flag the account for a forced change
      // at first sign-in. The plaintext is returned once so staff can share it.
      let initialPin = null;
      if (!data.pin || data.pin === "0000") {
        initialPin = generateRandomPin();
        data.pin = initialPin;
        if (data.first_login === undefined) data.first_login = true;
      }
      data = await hashPinIfPresent({ ...data, role: data.role || "student", active: data.active !== false });
      const created = await entity.create(data);
      const response = stripAppUserSensitive(created);
      if (initialPin) response.initial_pin = initialPin;
      return json(response, 201);
    }

    // ---- Update / Delete (both need the target first) ----
    const target = await entity.get(String(args.id || "")).catch(() => null);
    if (!target) return json({ error: "Account not found." }, 404);

    if (operation === "update") {
      let data = cleanData(args.data);
      // Protected accounts can only be modified by super_admin.
      if ((target.is_protected || target.role === "super_admin") && user.role !== "super_admin") {
        return json({ error: "Protected account." }, 403);
      }
      // Tutors can only update students/guests.
      if (user.role === "tutor" && !["student", "guest"].includes(target.role)) {
        return json({ error: "Not authorised." }, 403);
      }
      // Role escalation checks.
      if (Object.prototype.hasOwnProperty.call(data, "role")) {
        const permitted = user.role === "super_admin"
          ? ["guest", "student", "tutor", "admin"]
          : user.role === "admin"
            ? ["guest", "student", "tutor"]
            : ["guest", "student"];
        if (!permitted.includes(data.role)) return json({ error: "Role not permitted." }, 403);
      }
      data = Object.fromEntries(Object.entries(data).filter(([key]) => APP_USER_FIELDS.has(key)));
      data = await hashPinIfPresent(data);
      return json(stripAppUserSensitive(await entity.update(target.id, data)));
    }

    if (operation === "delete") {
      if (target.id === user.id || target.is_protected || target.role === "super_admin") {
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
  } catch (error) {
    const message = error?.message === "Invalid query." || error?.message?.startsWith("Only exact-match") ||
      error?.message?.startsWith("Invalid payload") || error?.message?.startsWith("PIN must")
      ? error.message
      : "Unable to process the request.";
    return json({ error: message }, message === "Unable to process the request." ? 500 : 400);
  }
}
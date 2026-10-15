// Shared session authentication, PIN security and input validation helpers
// for backend functions that manage AppUser records. Extracted here so
// appData (self-service) and manageUsers (admin) enforce identical rules
// without duplicating logic.

const STAFF_ROLES = new Set(["tutor", "admin", "super_admin"]);
const ADMIN_ROLES = new Set(["admin", "super_admin"]);
const PBKDF2_ITERATIONS = 100000;

export const APP_USER_FIELDS = new Set([
  "username", "pin", "role", "title", "full_name", "institution", "cohort",
  "first_login", "active", "ai_voice", "ai_persona", "is_protected",
]);

// ---- SHA-256 ----
export async function sha256(value) {
  const bytes = new TextEncoder().encode(String(value));
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

// ---- PBKDF2 PIN hashing ----
async function pbkdf2Derive(pin, saltHex, iterations) {
  const salt = new Uint8Array(saltHex.match(/.{2}/g).map((b) => parseInt(b, 16)));
  const keyMaterial = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(String(pin)), { name: "PBKDF2" }, false, ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations, hash: "SHA-256" }, keyMaterial, 256,
  );
  return Array.from(new Uint8Array(bits), (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function hashPinPbkdf2(pin) {
  const saltHex = Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => b.toString(16).padStart(2, "0")).join("");
  const hashHex = await pbkdf2Derive(pin, saltHex, PBKDF2_ITERATIONS);
  return `pbkdf2:${PBKDF2_ITERATIONS}:${saltHex}:${hashHex}`;
}

export function generateRandomPin() {
  const n = crypto.getRandomValues(new Uint16Array(1))[0] % 9000;
  return String(1000 + n);
}

export async function hashPinIfPresent(data) {
  if (!Object.prototype.hasOwnProperty.call(data, "pin")) return data;
  const pin = String(data.pin || "");
  if (!/^\d{4,6}$/.test(pin) && !/^sha256:[a-f0-9]{64}$/.test(pin) && !/^pbkdf2:\d+:[a-f0-9]{32}:[a-f0-9]{64}$/.test(pin)) {
    throw new Error("PIN must contain 4 to 6 digits.");
  }
  const hashed = pin.startsWith("sha256:") || pin.startsWith("pbkdf2:") ? pin : await hashPinPbkdf2(pin);
  return { ...data, pin: hashed };
}

// ---- Role checks ----
export function isStaff(user) { return STAFF_ROLES.has(user?.role); }
export function isAdmin(user) { return ADMIN_ROLES.has(user?.role); }

// ---- Input validation ----
export function isPlainObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype;
}

export function cleanQuery(input) {
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

export function cleanData(input) {
  if (!isPlainObject(input)) throw new Error("Invalid data.");
  const out = cleanValue(input);
  delete out.id;
  delete out.created_date;
  delete out.updated_date;
  delete out.created_by_id;
  return out;
}

export function safeSort(value) {
  return typeof value === "string" && /^-?[a-zA-Z][a-zA-Z0-9_]*$/.test(value) ? value : undefined;
}

export function safeNumber(value, fallback, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(0, Math.min(max, Math.trunc(number)));
}

// ---- Session authentication ----
export function readSessionToken(req, body) {
  const cookieHeader = req.headers.get("Cookie") || "";
  for (const part of cookieHeader.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === "pathfinder-session" && v.length) return v.join("=");
  }
  return body?.session_token || body?.pathfinder_session_token || null;
}

export async function authenticate(base44, token) {
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

// ---- Sensitive field stripping ----
export function stripAppUserSensitive(value) {
  const stripOne = (row) => {
    if (!row || typeof row !== "object") return row;
    const next = { ...row };
    delete next.pin;
    delete next.qr_token;
    return next;
  };
  if (Array.isArray(value)) return value.map(stripOne).filter(Boolean);
  return stripOne(value);
}

// ---- JSON response helper ----
export function json(body, status = 200) {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}
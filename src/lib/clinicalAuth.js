import { base44 } from "@/api/base44Client";
import {
  clearSession,
  hasSession,
  markSessionActive,
} from "@/lib/authSession";

import { resetModuleSession } from "./moduleSession";

const APP_SESSION_KEY = "pathfinder-app-user-v2";
let cachedUser = null;
let cachedPlatformUser = null;

function readAppSession() {
  if (typeof window === "undefined") return null;
  try { return JSON.parse(sessionStorage.getItem(APP_SESSION_KEY) || "null"); } catch { return null; }
}

cachedUser = readAppSession();

function persist(user) {
  cachedUser = user || null;
  if (typeof window === "undefined") return;
  try {
    if (user) sessionStorage.setItem(APP_SESSION_KEY, JSON.stringify(user));
    else sessionStorage.removeItem(APP_SESSION_KEY);
  } catch {}
}

export function setAppUser(appUser, method = "pin") {
  resetModuleSession();
  if (!appUser) {
    clearSession();
    persist(null);
    return;
  }
  markSessionActive();
  const next = {
    id: appUser.id,
    username: String(appUser.username || "").toLowerCase().trim(),
    email: cachedPlatformUser?.email || appUser.email || "",
    role: appUser.role || "student",
    title: appUser.title || null,
    full_name: appUser.full_name || appUser.username || "Pathfinder user",
    institution: appUser.institution || "Pathfinder T-Level Simulation",
    cohort: appUser.cohort || null,
    first_login: !!appUser.first_login,
    ai_voice: appUser.ai_voice || "honey",
    ai_persona: appUser.ai_persona || "female",
    is_protected: !!appUser.is_protected,
    active: appUser.active !== false,
    auth_method: method,
    platform_user_id: cachedPlatformUser?.id || null,
    platform_role: cachedPlatformUser?.role || null,
  };
  persist(next);
}

// Base44 authentication remains the transport/session layer for backend access.
// AppUser is the authoritative Pathfinder identity and role after PIN/QR/voice login.
export function setPlatformUser(platformUser) {
  cachedPlatformUser = platformUser || null;
  if (!platformUser) return;

  if (cachedUser?.id && cachedUser?.auth_method !== "platform") {
    persist({
      ...cachedUser,
      email: platformUser.email || cachedUser.email || "",
      platform_user_id: platformUser.id,
      platform_role: platformUser.role || null,
    });
    return;
  }

  const email = (platformUser.email || "").toLowerCase().trim();
  // Platform identities never gain privileges from an email address. Roles
  // must come from the authenticated platform account or the secured AppUser record.
  const role = ["admin", "super_admin"].includes(platformUser.role)
    ? platformUser.role
    : "student";

  persist({
    id: platformUser.id,
    username: email || platformUser.full_name || "user",
    email,
    role,
    full_name: platformUser.full_name || (email ? email.split("@")[0] : "User"),
    institution: platformUser.institution || "Pathfinder T-Level Simulation",
    cohort: platformUser.cohort || null,
    first_login: false,
    ai_voice: "honey",
    ai_persona: "female",
    is_protected: role === "super_admin",
    active: true,
    auth_method: "platform",
    platform_user_id: platformUser.id,
    platform_role: platformUser.role || null,
  });
}

export function getCurrentUser() { return cachedUser; }
export function getPlatformUser() { return cachedPlatformUser; }
export function isLoggedIn() {
  if (!cachedUser || cachedUser.active === false) return false;
  if (cachedUser.auth_method === "platform") return !!cachedPlatformUser;
  return hasSession();
}
export function isSuperAdmin() { return cachedUser?.role === "super_admin"; }
export function isAdmin() { return ["super_admin", "admin"].includes(cachedUser?.role); }
export function canManageUsers() { return ["super_admin", "admin", "tutor"].includes(cachedUser?.role); }

export function logout() {
  resetModuleSession();
  try { sessionStorage.removeItem("pathfinder-welcomed"); } catch {}
  try { sessionStorage.removeItem("pathfinder-unlocked"); } catch {}
  // Revoke the server-issued session so a captured cookie cannot survive
  // sign-out. The server clears the HttpOnly cookie in its response.
  if (hasSession()) {
    base44.functions.invoke("appData", { revoke_session: true }).catch(() => {});
  }
  clearSession();
  persist(null);

  if (cachedPlatformUser) {
    base44.auth.logout(window.location.origin + "/");
  } else if (typeof window !== "undefined") {
    window.location.assign("/");
  }
  return true;
}

async function sha256Pin(pin) {
  const bytes = new TextEncoder().encode(String(pin));
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return `sha256:${Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("")}`;
}

function generateRandomPin() {
  const n = crypto.getRandomValues(new Uint16Array(1))[0] % 9000;
  return String(1000 + n);
}

export async function changePin(userId, newPin) {
  if (!/^\d{4,6}$/.test(String(newPin))) throw new Error("PIN must contain 4 to 6 digits.");
  const hashed = await sha256Pin(newPin);
  await base44.entities.AppUser.update(userId, { pin: hashed, first_login: false });
  if (cachedUser?.id === userId) persist({ ...cachedUser, first_login: false });
}

export async function resetPin(userId) {
  const plain = generateRandomPin();
  const hashed = await sha256Pin(plain);
  await base44.entities.AppUser.update(userId, { pin: hashed, first_login: true });
  return plain;
}
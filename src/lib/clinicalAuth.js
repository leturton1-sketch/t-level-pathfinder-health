import { base44 } from "@/api/base44Client";

const SUPER_ADMIN_EMAILS = new Set([
  "lee.turton@academic.rnngroup.ac.uk",
  "leturton1@gmail.com",
]);

// Platform user cached after base44.auth.me() resolves. Authentication is now
// owned entirely by the Base44 platform (Google/PIN login removed). These
// helpers preserve the synchronous user API the rest of the app expects.
const PATHFINDER_SESSION_KEY = "pathfinder-user-session";
let cachedUser = null;

function readStoredPathfinderUser() {
  try {
    const raw = sessionStorage.getItem(PATHFINDER_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.auth_method === "pathfinder" ? parsed : null;
  } catch {
    return null;
  }
}

function persistPathfinderUser(user) {
  try {
    if (user) sessionStorage.setItem(PATHFINDER_SESSION_KEY, JSON.stringify(user));
    else sessionStorage.removeItem(PATHFINDER_SESSION_KEY);
  } catch {}
}

// Build an app-shaped user object from the platform user so existing call sites
// (role checks, full_name, persona defaults) keep working unchanged.
export function setPlatformUser(platformUser) {
  if (!platformUser) return;
  const email = (platformUser.email || "").toLowerCase().trim();
  const role = SUPER_ADMIN_EMAILS.has(email)
    ? "super_admin"
    : ["admin", "super_admin"].includes(platformUser.role)
      ? platformUser.role
      : "student";

  // Do not overwrite an authenticated Pathfinder AppUser session with the
  // background Base44 platform identity. The in-app username + PIN login is
  // authoritative for role, cohort and permissions.
  if (cachedUser?.auth_method === "pathfinder") return;

  cachedUser = {
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
    auth_method: "platform",
  };
}

export function setPathfinderUser(appUser) {
  if (!appUser) {
    cachedUser = null;
    return;
  }
  cachedUser = {
    ...appUser,
    username: String(appUser.username || "").trim().toLowerCase(),
    full_name: appUser.full_name || appUser.username || "User",
    role: appUser.role || "student",
    institution: appUser.institution || "Pathfinder T-Level Simulation",
    cohort: appUser.cohort || null,
    first_login: !!appUser.first_login,
    ai_voice: appUser.ai_voice || "honey",
    ai_persona: appUser.ai_persona || "female",
    is_protected: !!appUser.is_protected,
    auth_method: "pathfinder",
  };
  persistPathfinderUser(cachedUser);
}

export function getCurrentUser() {
  if (!cachedUser) cachedUser = readStoredPathfinderUser();
  return cachedUser;
}

export function isLoggedIn() {
  return getCurrentUser() !== null;
}

export function isSuperAdmin() {
  return getCurrentUser()?.role === "super_admin";
}

export function isAdmin() {
  return ["super_admin", "admin"].includes(getCurrentUser()?.role);
}

export function canManageUsers() {
  return ["super_admin", "admin", "tutor"].includes(getCurrentUser()?.role);
}

export function logout() {
  cachedUser = null;
  persistPathfinderUser(null);
  try { sessionStorage.removeItem("pathfinder-unlocked"); } catch {}
  // Platform logout is best-effort; Pathfinder's own session is cleared above.
  try { base44.auth.logout(window.location.origin + "/"); } catch {}
  return true;
}

// Entity-only helpers (AppUser records managed via User Management). These no
// longer participate in authentication — they just maintain AppUser records.
export async function changePin(userId, newPin) {
  await base44.functions.invoke("changeAppUserPin", {
    user_id: userId,
    pin: newPin,
    first_login: false,
  });
}

export async function resetPin(userId) {
  await base44.functions.invoke("changeAppUserPin", {
    user_id: userId,
    pin: "0000",
    first_login: true,
  });
}
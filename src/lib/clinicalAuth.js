import { base44 } from "@/api/base44Client";

const SUPER_ADMIN_EMAILS = new Set([
  "lee.turton@academic.rnngroup.ac.uk",
  "leturton1@gmail.com",
]);

// Platform user cached after base44.auth.me() resolves. Authentication is now
// owned entirely by the Base44 platform (Google/PIN login removed). These
// helpers preserve the synchronous user API the rest of the app expects.
let cachedUser = null;

// Build an app-shaped user object from the platform user so existing call sites
// (role checks, full_name, persona defaults) keep working unchanged.
export function setPlatformUser(platformUser) {
  if (!platformUser) {
    cachedUser = null;
    return;
  }
  const email = (platformUser.email || "").toLowerCase().trim();
  const role = SUPER_ADMIN_EMAILS.has(email)
    ? "super_admin"
    : ["admin", "super_admin"].includes(platformUser.role)
      ? platformUser.role
      : "student";

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

export function getCurrentUser() {
  return cachedUser;
}

export function isLoggedIn() {
  return cachedUser !== null;
}

export function isSuperAdmin() {
  return cachedUser?.role === "super_admin";
}

export function isAdmin() {
  return ["super_admin", "admin"].includes(cachedUser?.role);
}

export function canManageUsers() {
  return ["super_admin", "admin", "tutor"].includes(cachedUser?.role);
}

export function logout() {
  cachedUser = null;
  // Hand off to the platform auth logout, which clears the token and returns to
  // the homepage (where AuthContext prompts the platform sign-in again).
  base44.auth.logout(window.location.origin + "/");
  return true;
}

// Entity-only helpers (AppUser records managed via User Management). These no
// longer participate in authentication — they just maintain AppUser records.
export async function changePin(userId, newPin) {
  await base44.entities.AppUser.update(userId, { pin: newPin, first_login: false });
}

export async function resetPin(userId) {
  await base44.entities.AppUser.update(userId, { pin: "0000", first_login: true });
}
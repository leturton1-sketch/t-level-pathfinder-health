import { base44 } from "@/api/base44Client";

const SESSION_KEY = "clinicaledge_session";

export async function login(username, pin) {
  const users = await base44.entities.AppUser.filter({
    username: username.toLowerCase().trim(),
    active: true,
  });
  if (users.length === 0) {
    throw new Error("User not found. Please check your username.");
  }
  const user = users[0];
  if (user.pin !== pin) {
    throw new Error("Incorrect PIN. Please try again.");
  }
  const session = {
    id: user.id,
    username: user.username,
    role: user.role,
    full_name: user.full_name,
    institution: user.institution,
    cohort: user.cohort,
    first_login: user.first_login,
    ai_voice: user.ai_voice || "honey",
    ai_persona: user.ai_persona || "female",
    is_protected: user.is_protected || false,
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

export function getCurrentUser() {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function isLoggedIn() {
  return getCurrentUser() !== null;
}

export function logout() {
  localStorage.removeItem(SESSION_KEY);
}

export async function changePin(userId, newPin) {
  await base44.entities.AppUser.update(userId, {
    pin: newPin,
    first_login: false,
  });
  const session = getCurrentUser();
  if (session && session.id === userId) {
    session.first_login = false;
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }
}

export async function resetPin(userId) {
  await base44.entities.AppUser.update(userId, {
    pin: "0000",
    first_login: true,
  });
}

export function isSuperAdmin() {
  const u = getCurrentUser();
  return u?.role === "super_admin";
}

export function canManageUsers() {
  const u = getCurrentUser();
  return ["super_admin", "admin", "tutor"].includes(u?.role);
}

export function isAdmin() {
  const u = getCurrentUser();
  return ["super_admin", "admin"].includes(u?.role);
}
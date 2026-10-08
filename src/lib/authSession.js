// The session token is stored exclusively in an HttpOnly cookie set by the
// verifyAccess backend function. JavaScript cannot read it, which prevents
// XSS-based token theft. This module tracks only whether a session is active
// (for UI gating) — it never holds the token itself.
const SESSION_ACTIVE_KEY = "pathfinder-session-active";

export function hasSession() {
  if (typeof window === "undefined") return false;
  try { return sessionStorage.getItem(SESSION_ACTIVE_KEY) === "1"; } catch { return false; }
}

export function markSessionActive() {
  if (typeof window === "undefined") return;
  try { sessionStorage.setItem(SESSION_ACTIVE_KEY, "1"); } catch {}
}

export function clearSession() {
  if (typeof window === "undefined") return;
  try { sessionStorage.removeItem(SESSION_ACTIVE_KEY); } catch {}
}
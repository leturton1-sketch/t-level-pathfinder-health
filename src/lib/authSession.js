// Session token storage. The token is returned in the verifyAccess JSON
// response body and stored here in sessionStorage, then injected into every
// backend function call as pathfinder_session_token. The HttpOnly cookie
// set by verifyAccess is kept as defense-in-depth but is not relied upon,
// because the platform function proxy does not reliably pass Set-Cookie
// headers through to the browser.
const SESSION_ACTIVE_KEY = "pathfinder-session-active";
const SESSION_TOKEN_KEY = "pathfinder-session-token";

export function hasSession() {
  if (typeof window === "undefined") return false;
  try { return sessionStorage.getItem(SESSION_ACTIVE_KEY) === "1"; } catch { return false; }
}

export function markSessionActive() {
  if (typeof window === "undefined") return;
  try { sessionStorage.setItem(SESSION_ACTIVE_KEY, "1"); } catch {}
}

export function setSessionToken(token) {
  if (typeof window === "undefined") return;
  try {
    if (token) sessionStorage.setItem(SESSION_TOKEN_KEY, token);
    else sessionStorage.removeItem(SESSION_TOKEN_KEY);
  } catch {}
}

export function getSessionToken() {
  if (typeof window === "undefined") return null;
  try { return sessionStorage.getItem(SESSION_TOKEN_KEY) || null; } catch { return null; }
}

export function clearSession() {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(SESSION_ACTIVE_KEY);
    sessionStorage.removeItem(SESSION_TOKEN_KEY);
  } catch {}
}
export const PATHFINDER_SESSION_TOKEN_KEY = "pathfinder-session-token-v1";

export function getPathfinderSessionToken() {
  if (typeof window === "undefined") return null;
  try {
    return sessionStorage.getItem(PATHFINDER_SESSION_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setPathfinderSessionToken(token) {
  if (typeof window === "undefined") return;
  try {
    if (token) sessionStorage.setItem(PATHFINDER_SESSION_TOKEN_KEY, String(token));
    else sessionStorage.removeItem(PATHFINDER_SESSION_TOKEN_KEY);
  } catch {}
}

export function clearPathfinderSessionToken() {
  setPathfinderSessionToken(null);
}

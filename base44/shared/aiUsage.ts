// Shared authentication and rate-limiting helpers for backend functions
// that broker Core Integration LLM calls. Extracted here so every AI-backed
// function enforces the same per-user usage cap without duplicating logic.

const AI_WINDOW_MS = 60 * 60 * 1000;
const STUDENT_REQUESTS_PER_HOUR = 20;
const STAFF_REQUESTS_PER_HOUR = 60;
const STAFF_ROLES = new Set(['tutor', 'admin', 'super_admin']);

export async function sha256(value) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(String(value)));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

// Resolve the LEE AppUser from a signed custom session token (PIN/QR gate).
export async function customSessionUser(base44, sessionToken) {
  if (typeof sessionToken !== "string" || !/^[a-f0-9]{64}$/.test(sessionToken)) return null;
  const tokenHash = await sha256(sessionToken);
  const sessions = await base44.asServiceRole.entities.AppSession.filter(
    { token_hash: tokenHash, revoked: false }, "-expires_at", 3,
  );
  const session = (sessions || []).find(
    (item) => Number.isFinite(Date.parse(item.expires_at)) && Date.parse(item.expires_at) > Date.now(),
  );
  if (!session) return null;
  const users = await base44.asServiceRole.entities.AppUser.filter({ id: session.app_user_id, active: true });
  return users?.[0] || null;
}

// Authenticate via the platform session first, falling back to the LEE
// custom session so PIN/QR users are covered.
export async function authenticateUser(base44, sessionToken) {
  try {
    const platformUser = await base44.auth.me();
    if (platformUser) return platformUser;
  } catch {}
  return customSessionUser(base44, sessionToken);
}

// Reserve an AI usage slot. Returns the usage record (to be finalised by
// finishAiUsage) or null when the hourly limit has been reached.
export async function reserveAiUsage(base44, user, provider, inputChars) {
  const limit = STAFF_ROLES.has(user?.role) ? STAFF_REQUESTS_PER_HOUR : STUDENT_REQUESTS_PER_HOUR;
  const rows = await base44.asServiceRole.entities.AIUsage.filter(
    { app_user_id: user.id }, '-requested_at', limit + 25,
  );
  const since = Date.now() - AI_WINDOW_MS;
  const recent = (rows || []).filter((row) => {
    const time = Date.parse(row.requested_at);
    return Number.isFinite(time) && time > since;
  });
  if (recent.length >= limit) return null;
  return base44.asServiceRole.entities.AIUsage.create({
    app_user_id: user.id,
    provider,
    requested_at: new Date().toISOString(),
    input_chars: inputChars,
    status: 'started',
  });
}

export async function finishAiUsage(base44, usage, status) {
  if (!usage?.id) return;
  try { await base44.asServiceRole.entities.AIUsage.update(usage.id, { status }); } catch {}
}
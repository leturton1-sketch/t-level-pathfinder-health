import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

async function sha256(value) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(String(value)));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

async function authenticatedUser(base44, sessionToken) {
  try {
    const platformUser = await base44.auth.me();
    if (platformUser) return platformUser;
  } catch {}

  if (typeof sessionToken !== "string" || !/^[a-f0-9]{64}$/.test(sessionToken)) return null;
  const tokenHash = await sha256(sessionToken);
  const sessions = await base44.asServiceRole.entities.AppSession.filter({ token_hash: tokenHash, revoked: false }, "-expires_at", 3);
  const session = (sessions || []).find((item) => Number.isFinite(Date.parse(item.expires_at)) && Date.parse(item.expires_at) > Date.now());
  if (!session) return null;
  const users = await base44.asServiceRole.entities.AppUser.filter({ id: session.app_user_id, active: true });
  return users?.[0] || null;
}

export default async function(req) {
  if (req.method !== "POST") return Response.json({ error: "Method not allowed." }, { status: 405 });
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const caller = await authenticatedUser(base44, body?.pathfinder_session_token);
    if (!caller || !["admin", "super_admin"].includes(caller.role)) return Response.json({ error: "An administrator account is required to manage login QR codes." }, { status: 403 });
    const { app_user_id, action } = body;
    if (typeof app_user_id !== "string" || !/^[a-zA-Z0-9_-]{1,128}$/.test(app_user_id) || !["issue", "revoke"].includes(action)) {
      return Response.json({ error: "Choose an account and a valid action." }, { status: 400 });
    }

    // Per-user rate limit: caps how many QR codes one admin can issue or
    // revoke per hour. A stolen admin session cannot mass-issue backdoor
    // login credentials before the breach is noticed.
    const audit = base44.asServiceRole.entities.AuthAudit;
    const MAX_QR_CHANGES_PER_HOUR = 30;
    const recent = await audit.filter(
      { app_user_id: caller.id, method: "admin", event: { $in: ["qr_issued", "qr_revoked"] } },
      "-occurred_at", MAX_QR_CHANGES_PER_HOUR + 5,
    );
    const since = Date.now() - 60 * 60 * 1000;
    const count = (recent || []).filter((row) => {
      const time = Date.parse(row.occurred_at);
      return Number.isFinite(time) && time > since;
    }).length;
    if (count >= MAX_QR_CHANGES_PER_HOUR) {
      return Response.json({ error: "Too many QR code changes this hour. Please try again later." }, { status: 429, headers: { "Retry-After": "3600" } });
    }

    async function logAudit(event, detail) {
      try {
        await audit.create({
          app_user_id: caller.id,
          username: caller.username,
          event,
          method: "admin",
          success: true,
          detail,
          occurred_at: new Date().toISOString(),
        });
      } catch {}
    }

    const users = await base44.asServiceRole.entities.AppUser.filter({ id: app_user_id });
    const user = users?.[0];
    if (!user) return Response.json({ error: "Account not found." }, { status: 404 });
    if (action === "issue" && (user.active === false || user.is_protected || ["admin", "super_admin"].includes(user.role))) {
      return Response.json({ error: "QR login is available for active, non-administrator accounts. Protected accounts use PIN sign-in." }, { status: 400 });
    }
    const prior = await base44.asServiceRole.entities.QRAccessCredential.filter({ app_user_id, revoked: false });
    for (const credential of prior || []) await base44.asServiceRole.entities.QRAccessCredential.update(credential.id, { revoked: true });
    if (action === "revoke") {
      await logAudit("qr_revoked", `Revoked QR access for ${user.username}`);
      return Response.json({ revoked: true });
    }
    const token = Array.from(crypto.getRandomValues(new Uint8Array(32))).map(b => b.toString(16).padStart(2, "0")).join("");
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
    const token_hash = Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, "0")).join("");
    const expires_at = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();
    const record = await base44.asServiceRole.entities.QRAccessCredential.create({ app_user_id, token_hash, expires_at, revoked: false });
    await logAudit("qr_issued", `Issued QR access for ${user.username}`);
    return Response.json({ qr: "pfqr:v1:" + record.id + ":" + token, expires_at }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "Unable to manage the QR code. Please try again." }, { status: 500 });
  }
}
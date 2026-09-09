import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
export default async function(req) {
  if (req.method !== "POST") return Response.json({ error: "Method not allowed." }, { status: 405 });
  try {
    const base44 = createClientFromRequest(req);
    const caller = await base44.auth.me().catch(() => null);
    if (!caller || caller.role !== "admin") return Response.json({ error: "A Base44 administrator account is required to manage login QR codes." }, { status: 403 });
    const { app_user_id, action } = await req.json();
    if (typeof app_user_id !== "string" || !/^[a-zA-Z0-9_-]{1,128}$/.test(app_user_id) || !["issue", "revoke"].includes(action)) {
      return Response.json({ error: "Choose an account and a valid action." }, { status: 400 });
    }
    const users = await base44.asServiceRole.entities.AppUser.filter({ id: app_user_id });
    const user = users?.[0];
    if (!user) return Response.json({ error: "Account not found." }, { status: 404 });
    if (action === "issue" && (user.active === false || user.is_protected || ["admin", "super_admin"].includes(user.role))) {
      return Response.json({ error: "QR login is available for active, non-administrator accounts. Protected accounts use PIN sign-in." }, { status: 400 });
    }
    const prior = await base44.asServiceRole.entities.QRAccessCredential.filter({ app_user_id, revoked: false });
    for (const credential of prior || []) await base44.asServiceRole.entities.QRAccessCredential.update(credential.id, { revoked: true });
    if (action === "revoke") return Response.json({ revoked: true });
    const token = Array.from(crypto.getRandomValues(new Uint8Array(32))).map(b => b.toString(16).padStart(2, "0")).join("");
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
    const token_hash = Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, "0")).join("");
    const expires_at = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();
    const record = await base44.asServiceRole.entities.QRAccessCredential.create({ app_user_id, token_hash, expires_at, revoked: false });
    return Response.json({ qr: "pfqr:v1:" + record.id + ":" + token, expires_at }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "Unable to manage the QR code. Please try again." }, { status: 500 });
  }
}

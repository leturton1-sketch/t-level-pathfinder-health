import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

// Public identification verifier. Cross-references a PIN (optionally with a
// username) or a QR token against the AppUser management list using the
// service role, so it works before the user has a platform session.
// QR tokens are either a unique ID-card token (qr_token, preferred) or the
// legacy "username:pin"/bare-pin encoding.
async function grantUser(base44, u, method) {
  if (u.active === false) {
    return Response.json({ granted: false, reason: "This account is inactive. Contact your administrator." });
  }
  try {
    await base44.asServiceRole.entities.AuthAudit.create({
      app_user_id: u.id,
      username: u.username,
      event: method === "qr" ? "qr_login" : "login_success",
      method,
      success: true,
      detail: u.is_protected ? "Protected account authenticated." : "Account authenticated.",
      occurred_at: new Date().toISOString(),
    });
  } catch {}
  return Response.json({
    granted: true,
    user: {
      id: u.id,
      username: u.username,
      full_name: u.full_name,
      role: u.role,
      title: u.title || null,
      cohort: u.cohort || null,
      institution: u.institution || null,
      ai_voice: u.ai_voice || "honey",
      ai_persona: u.ai_persona || "female",
      is_protected: !!u.is_protected,
    },
  });
}

// Brute-force protection: after MAX_ATTEMPTS failed PIN attempts within
// WINDOW_MS, further PIN attempts are rejected with 429 until the window
// clears. Failures are tracked both per-target-username and per-requesting-IP
// using AuthAudit records (the IP is stored in platform_user_id so it can be
// filtered on), so an attacker cannot simply rotate usernames.
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;

// Resolve the requesting IP for brute-force lockout. The value MUST NOT be
// attacker-controllable or the per-IP lockout can be bypassed by sending a
// fresh spoofed header on each request. Prefer headers the edge proxy
// overwrites (CF-Connecting-IP on Cloudflare, x-real-ip from upstream), and
// only fall back to x-forwarded-for — taking the LAST entry (set by the
// closest trusted proxy) rather than the first client-supplied value, which
// a client can forge.
function clientIp(req) {
  const headers = req.headers;
  const get = (k) => (headers?.get ? headers.get(k) : headers?.[k]);
  const clean = (v) => String(v || "").replace(/[\r\n\s]/g, "").trim();
  const cf = get("cf-connecting-ip");
  if (cf && clean(cf)) return clean(cf);
  const real = get("x-real-ip");
  if (real && clean(real)) return clean(real);
  const fwd = get("x-forwarded-for");
  if (fwd) {
    const parts = String(fwd).split(",").map((s) => clean(s)).filter(Boolean);
    if (parts.length) return parts[parts.length - 1];
  }
  return "unknown";
}

async function checkLockout(base44, username, ip) {
  const since = Date.now() - WINDOW_MS;
  const countRecent = (rows) => (rows || []).filter((r) => {
    const t = r.occurred_at ? Date.parse(r.occurred_at) : 0;
    return Number.isFinite(t) && t > since;
  }).length;
  try {
    if (username) {
      const rows = await base44.asServiceRole.entities.AuthAudit.filter(
        { username, event: "login_failed", success: false }, "-occurred_at", MAX_ATTEMPTS + 5
      );
      if (countRecent(rows) >= MAX_ATTEMPTS) return true;
    }
    const ipRows = await base44.asServiceRole.entities.AuthAudit.filter(
      { platform_user_id: ip, event: "login_failed", success: false }, "-occurred_at", MAX_ATTEMPTS + 5
    );
    return countRecent(ipRows) >= MAX_ATTEMPTS;
  } catch {
    return false;
  }
}

// Personal QR credentials are random, hashed at rest and revocable.
// Legacy username:PIN codes remain supported for existing cards.
export default async function(req) {
  try {
    const body = await req.json().catch(() => ({}));
    let { username, pin, qr } = body || {};

    const base44 = createClientFromRequest(req);

    if (typeof qr === "string" && qr.startsWith("pfqr:")) {
      const match = /^pfqr:v1:([a-zA-Z0-9_-]{1,128}):([a-f0-9]{64})$/.exec(qr.trim());
      const rejected = () => Response.json({ granted: false, reason: "This QR code is invalid, expired or revoked. Use PIN sign-in or request a replacement." });
      if (!match) return rejected();
      const base44 = createClientFromRequest(req);
      const rows = await base44.asServiceRole.entities.QRAccessCredential.filter({ id: match[1] });
      const record = rows?.[0];
      if (!record || record.revoked || !Number.isFinite(Date.parse(record.expires_at)) || Date.parse(record.expires_at) <= Date.now()) return rejected();
      const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(match[2]));
      const hash = Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, "0")).join("");
      if (hash !== record.token_hash) return rejected();
      const users = await base44.asServiceRole.entities.AppUser.filter({ id: record.app_user_id, active: true });
      const u = users?.[0];
      if (!u || u.active === false || u.is_protected || ["admin", "super_admin"].includes(u.role)) return rejected();
      try {
        await base44.asServiceRole.entities.AuthAudit.create({ app_user_id: u.id, username: u.username, event: "qr_login", method: "qr", success: true, detail: "Personal QR credential accepted.", occurred_at: new Date().toISOString() });
      } catch {}
      return Response.json({ granted: true, user: {
        id: u.id, username: u.username, full_name: u.full_name, role: u.role,
        title: u.title || null, cohort: u.cohort || null, institution: u.institution || null,
        first_login: !!u.first_login, ai_voice: u.ai_voice || "honey", ai_persona: u.ai_persona || "female", is_protected: false
      } }, { headers: { "Cache-Control": "no-store" } });
    }

    if (qr) {
      const decoded = String(qr).trim();
      // ID-card QR codes carry a long random token minted for the user (see
      // qr_token on AppUser) rather than their PIN, so a card keeps working
      // even after the user changes their PIN. Try that lookup first.
      if (decoded.length >= 16) {
        const byToken = await base44.asServiceRole.entities.AppUser.filter({ qr_token: decoded, active: true });
        if (byToken && byToken.length === 1) {
          return grantUser(base44, byToken[0], "qr");
        }
      }
      if (decoded.includes(":")) {
        const [u, p] = decoded.split(":");
        username = (u || "").trim().toLowerCase();
        pin = (p || "").trim();
      } else {
        pin = decoded;
      }
    }

    if (!pin) {
      return Response.json({ granted: false, reason: "A PIN is required." }, { status: 400 });
    }

    const suppliedPin = String(pin).trim();
    const normalizedUsername = String(username || "").trim().toLowerCase();
    const ip = clientIp(req);

    // Require a username for PIN-based sign-in. Without it the function would
    // compare the supplied PIN against every active account, letting an
    // attacker blindly brute-force 4–6 digit PINs and harvest the single
    // matching user's profile. The QR token paths above already return before
    // reaching here, so only legacy bare-PIN and direct no-username PIN calls
    // are affected.
    if (!normalizedUsername) {
      return Response.json({ granted: false, reason: "Username is required for PIN sign-in." }, { status: 400, headers: { "Cache-Control": "no-store" } });
    }

    // Enforce brute-force lockout before doing any PIN comparison.
    if (await checkLockout(base44, normalizedUsername, ip)) {
      return Response.json(
        { granted: false, reason: "Too many failed attempts. Please try again in a few minutes." },
        { status: 429, headers: { "Retry-After": "60", "Cache-Control": "no-store" } }
      );
    }

    // Fetch candidate active accounts first, then verify the supplied PIN in code.
    // This supports both legacy plaintext PINs and newer SHA-256 encoded PINs.
    const query = { active: true };
    if (normalizedUsername) query.username = normalizedUsername;
    const candidates = await base44.asServiceRole.entities.AppUser.filter(query);

    const encoder = new TextEncoder();
    const digest = await crypto.subtle.digest("SHA-256", encoder.encode(suppliedPin));
    const hashedPin = `sha256:${Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("")}`;

    const matches = (candidates || []).filter((candidate) => {
      const storedPin = String(candidate.pin || "").trim();
      return storedPin === suppliedPin || storedPin === hashedPin;
    });

    if (matches.length === 0) {
      try {
        await base44.asServiceRole.entities.AuthAudit.create({
          username: normalizedUsername || null,
          platform_user_id: ip,
          event: "login_failed",
          method: qr ? "qr" : "pin",
          success: false,
          detail: "No matching active account found.",
          occurred_at: new Date().toISOString(),
        });
      } catch {}
      return Response.json({ granted: false, reason: "No matching account found." });
    }
    if (matches.length > 1 && !normalizedUsername) {
      return Response.json({ granted: false, reason: "That PIN is shared by several accounts — enter your username too." });
    }

    const u = matches[0];

    // Transparently migrate legacy plaintext PINs after a successful login.
    if (String(u.pin || "").trim() === suppliedPin && !String(u.pin || "").startsWith("sha256:")) {
      try { await base44.asServiceRole.entities.AppUser.update(u.id, { pin: hashedPin }); } catch {}
    }

    return grantUser(base44, u, qr ? "qr" : "pin");
  } catch (error) {
    return Response.json({ granted: false, reason: "Verification failed. Please try again." }, { status: 500 });
  }
}
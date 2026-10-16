import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { hashPinPbkdf2 } from '../../shared/userAuth.ts';

// Public identification verifier. Cross-references a username and PIN or a
// secure, revocable QR credential against the AppUser management list using
// the service role, so it works before the user has a platform session.
async function sha256(value) {
  const bytes = new TextEncoder().encode(String(value));
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

// Verify a supplied PIN against the stored hash. Only the current salted
// PBKDF2 format is accepted, with a minimum work factor of 100,000
// iterations. Legacy unsalted sha256: hashes are rejected so that any
// leaked hash in that format cannot be replayed to sign in.
const MIN_PBKDF2_ITERATIONS = 100000;

async function verifyPin(suppliedPin, storedPin) {
  const stored = String(storedPin || "").trim();
  if (!stored.startsWith("pbkdf2:")) return false;
  const parts = stored.split(":");
  if (parts.length !== 4) return false;
  const iterations = parseInt(parts[1], 10);
  if (!Number.isFinite(iterations) || iterations < MIN_PBKDF2_ITERATIONS) return false;
  const salt = new Uint8Array(parts[2].match(/.{2}/g).map((b) => parseInt(b, 16)));
  const keyMaterial = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(String(suppliedPin)), { name: "PBKDF2" }, false, ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations, hash: "SHA-256" }, keyMaterial, 256,
  );
  const actual = Array.from(new Uint8Array(bits), (b) => b.toString(16).padStart(2, "0")).join("");
  return actual === parts[3];
}

// Migration bridge: verify against the legacy unsalted SHA-256 format.
// If the supplied PIN matches, the caller is legitimate and the stored
// hash is upgraded to salted PBKDF2 on this sign-in. This lets existing
// users keep their current PINs while the hash format is transparently
// secured, instead of locking everyone out.
async function verifyLegacySha256(suppliedPin, storedPin) {
  const match = /^sha256:([a-f0-9]{64})$/.exec(String(storedPin || "").trim());
  if (!match) return false;
  const digest = await sha256(String(suppliedPin));
  return digest === match[1];
}

// Detect accounts still on a legacy hash format (unsalted sha256: or
// PBKDF2 below the minimum work factor) so they can be flagged for a
// forced PIN rotation.
function isLegacyPin(storedPin) {
  const stored = String(storedPin || "").trim();
  if (/^sha256:[a-f0-9]{64}$/.test(stored)) return true;
  if (stored.startsWith("pbkdf2:")) {
    const parts = stored.split(":");
    if (parts.length === 4) {
      const iterations = parseInt(parts[1], 10);
      if (Number.isFinite(iterations) && iterations < MIN_PBKDF2_ITERATIONS) return true;
    }
  }
  return false;
}

async function issueSession(base44, userId, method) {
  const token = Array.from(crypto.getRandomValues(new Uint8Array(32)), (b) =>
    b.toString(16).padStart(2, "0")
  ).join("");
  const tokenHash = await sha256(token);
  const expiresAt = new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString();
  await base44.asServiceRole.entities.AppSession.create({
    app_user_id: userId,
    token_hash: tokenHash,
    expires_at: expiresAt,
    revoked: false,
    auth_method: method,
  });
  return { token, expiresAt };
}

async function grantUser(base44, u, method) {
  if (u.active === false) {
    return Response.json(
      { granted: false, reason: "This account is inactive. Contact your administrator." },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  const session = await issueSession(base44, u.id, method);

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
      first_login: !!u.first_login,
      ai_voice: u.ai_voice || "honey",
      ai_persona: u.ai_persona || "female",
      is_protected: !!u.is_protected,
    },
  }, {
    headers: {
      "Cache-Control": "no-store",
      "Set-Cookie": `pathfinder-session=${session.token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=43200`,
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
    // Fail closed: if the audit log is unreadable, treat as locked so
    // brute-force protection holds during outages instead of failing open.
    return true;
  }
}

// Personal QR credentials are random, hashed at rest and revocable.
// Legacy username:PIN and bare-PIN QR codes are rejected.
export default async function(req) {
  if (req.method !== "POST") {
    return Response.json({ granted: false, reason: "Method not allowed." }, { status: 405 });
  }
  const contentLength = Number(req.headers.get("content-length") || 0);
  if (Number.isFinite(contentLength) && contentLength > 10000) {
    return Response.json({ granted: false, reason: "The request is too large." }, { status: 413 });
  }
  try {
    const body = await req.json().catch(() => ({}));
    let { username, pin, qr } = body || {};

    const base44 = createClientFromRequest(req);

    if (typeof qr === "string" && qr.startsWith("pfqr:")) {
      const match = /^pfqr:v1:([a-f0-9]{24}):([a-f0-9]{64})$/.exec(qr.trim());
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
      return grantUser(base44, u, "qr");
    }

    if (qr) {
      return Response.json(
        { granted: false, reason: "This legacy QR code is no longer supported. Ask an administrator to issue a secure replacement." },
        { status: 400, headers: { "Cache-Control": "no-store" } },
      );
    }

    if (!pin) {
      return Response.json({ granted: false, reason: "A PIN is required." }, { status: 400 });
    }

    const suppliedPin = String(pin).trim();
    // Accept only the human PIN format. A stored sha256: value must never be
    // accepted as a credential, otherwise a leaked hash could be replayed.
    if (!/^\d{4,6}$/.test(suppliedPin)) {
      return Response.json(
        { granted: false, reason: "Enter a valid 4 to 6 digit PIN." },
        { status: 400, headers: { "Cache-Control": "no-store" } },
      );
    }
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

    // Fetch the named active account, then compare either its legacy numeric
    // PIN or the hash of the supplied numeric PIN. Hash strings are rejected
    // above and can never be replayed directly.
    const query = { active: true };
    if (normalizedUsername) query.username = normalizedUsername;
    const candidates = await base44.asServiceRole.entities.AppUser.filter(query);

    const matches = [];
    let legacyFound = false;
    for (const candidate of candidates || []) {
      const storedPin = String(candidate.pin || "").trim();
      if (isLegacyPin(storedPin)) {
        // Migration bridge: verify against the legacy SHA-256 format. If
        // the PIN matches, upgrade the stored hash to salted PBKDF2 so
        // the account is secured on this sign-in. If it doesn't match,
        // flag the account for a forced PIN rotation as before.
        if (await verifyLegacySha256(suppliedPin, storedPin)) {
          try {
            const upgradedHash = await hashPinPbkdf2(suppliedPin);
            await base44.asServiceRole.entities.AppUser.update(candidate.id, { pin: upgradedHash });
          } catch {}
          matches.push(candidate);
          continue;
        }
        legacyFound = true;
        if (!candidate.first_login) {
          try {
            await base44.asServiceRole.entities.AppUser.update(candidate.id, { first_login: true });
          } catch {}
        }
        continue;
      }
      if (await verifyPin(suppliedPin, storedPin)) matches.push(candidate);
    }

    if (matches.length === 0) {
      // Equalize timing: perform a dummy PBKDF2 derivation so the response
      // time doesn't reveal whether the username exists (the real
      // derivation only runs when a candidate is found).
      try {
        const keyMaterial = await crypto.subtle.importKey(
          "raw", new TextEncoder().encode(suppliedPin), { name: "PBKDF2" }, false, ["deriveBits"],
        );
        await crypto.subtle.deriveBits(
          { name: "PBKDF2", salt: new Uint8Array(16), iterations: 100000, hash: "SHA-256" }, keyMaterial, 256,
        );
      } catch {}
      try {
        await base44.asServiceRole.entities.AuthAudit.create({
          username: normalizedUsername || null,
          platform_user_id: ip,
          event: "login_failed",
          method: qr ? "qr" : "pin",
          success: false,
          detail: legacyFound ? "Legacy PIN hash requires administrator reset." : "No matching active account found.",
          occurred_at: new Date().toISOString(),
        });
      } catch {}
      return Response.json({
        granted: false,
        reason: legacyFound
          ? "Your PIN must be reset by an administrator. Please contact your tutor or administrator."
          : "No matching account found.",
      });
    }
    if (matches.length > 1 && !normalizedUsername) {
      return Response.json({ granted: false, reason: "That PIN is shared by several accounts — enter your username too." });
    }

    const u = matches[0];
    return grantUser(base44, u, qr ? "qr" : "pin");
  } catch (error) {
    return Response.json({ granted: false, reason: "Verification failed. Please try again." }, { status: 500 });
  }
}
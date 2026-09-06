import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

async function hashPin(pin) {
  const bytes = new TextEncoder().encode(pin);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return `sha256:${Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')}`;
}

async function audit(base44, username, method, result, reason = '') {
  try {
    await base44.asServiceRole.entities.LoginAudit.create({
      username: String(username || '').trim().toLowerCase() || 'unknown',
      method,
      result,
      reason: String(reason || '').slice(0, 240),
      created_at_client: new Date().toISOString(),
    });
  } catch {}
}

// Public identification verifier. Cross-references a PIN (optionally with a
// username) or a QR token against the AppUser management list using the
// service role, so it works before the user has a platform session.
// QR tokens encode either "username:pin" or a bare pin.
export default async function(req) {
  try {
    const body = await req.json().catch(() => ({}));
    let { username, pin, qr } = body || {};

    if (qr) {
      const decoded = String(qr).trim();
      if (decoded.includes(":")) {
        const [u, p] = decoded.split(":");
        username = (u || "").trim().toLowerCase();
        pin = (p || "").trim();
      } else {
        pin = decoded;
      }
    }

    const base44 = createClientFromRequest(req);
    const method = qr ? 'qr' : 'pin';

    if (!pin) {
      await audit(base44, username, method, 'denied', 'A PIN is required.');
      return Response.json({ granted: false, reason: "A PIN is required." }, { status: 400 });
    }
    const normalizedPin = String(pin).trim();
    const normalizedUsername = String(username || "").trim().toLowerCase();
    if (!/^\d{4}$/.test(normalizedPin)) {
      await audit(base44, normalizedUsername, method, 'denied', 'PIN must be exactly 4 digits.');
      return Response.json({ granted: false, reason: "PIN must be exactly 4 digits." }, { status: 400 });
    }

    // Brute-force protection: this is the sign-in endpoint and must remain
    // callable without a platform session (the PIN is the auth factor), so
    // we throttle repeated failures per username using the audit log. After
    // 5 denied attempts within 15 minutes the account is temporarily locked.
    const LOCK_WINDOW_MS = 15 * 60 * 1000;
    const LOCK_THRESHOLD = 5;
    try {
      const since = new Date(Date.now() - LOCK_WINDOW_MS).toISOString();
      const recent = await base44.asServiceRole.entities.LoginAudit.filter({
        username: normalizedUsername || 'unknown',
        result: 'denied',
        created_at_client: { $gte: since },
      });
      if (recent && recent.length >= LOCK_THRESHOLD) {
        await audit(base44, normalizedUsername, method, 'denied', 'Account temporarily locked after repeated failures.');
        return Response.json({ granted: false, reason: "Too many failed sign-in attempts. Please try again in a few minutes." }, { status: 429 });
      }
    } catch {}

    const query = { active: true };
    if (normalizedUsername) query.username = normalizedUsername;

    const matches = await base44.asServiceRole.entities.AppUser.filter(query);

    if (!matches || matches.length === 0) {
      await audit(base44, normalizedUsername, method, 'denied', 'No matching account found.');
      return Response.json({ granted: false, reason: "No matching account found." });
    }
    const candidateHash = await hashPin(normalizedPin);
    const pinMatches = matches.filter((candidate) => candidate.pin === candidateHash || candidate.pin === normalizedPin);
    if (pinMatches.length > 1 && !normalizedUsername) {
      await audit(base44, normalizedUsername, method, 'denied', 'Shared PIN requires username.');
      return Response.json({ granted: false, reason: "That PIN is shared by several accounts — enter your username too." });
    }
    const u = pinMatches[0];
    if (!u) {
      await audit(base44, normalizedUsername, method, 'denied', 'Incorrect PIN.');
      return Response.json({ granted: false, reason: "Incorrect PIN." });
    }
    if (u.active === false) {
      await audit(base44, normalizedUsername, method, 'denied', 'Account inactive.');
      return Response.json({ granted: false, reason: "This account is inactive. Contact your administrator." });
    }
    if (u.pin !== candidateHash) {
      await base44.asServiceRole.entities.AppUser.update(u.id, { pin: candidateHash });
    }

    await audit(base44, u.username, method, 'success', 'Access granted.');

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
        voice_recovery_enrolled: !!u.voice_recovery_enrolled,
        voice_personal_message: u.voice_personal_message || "",
      },
    });
  } catch (error) {
    try {
      const base44 = createClientFromRequest(req);
      await audit(base44, 'unknown', 'pin', 'error', error.message || 'Verification failed.');
    } catch {}
    return Response.json({ granted: false, reason: error.message || "Verification failed." }, { status: 500 });
  }
}
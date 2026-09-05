import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

async function hashPin(pin) {
  const bytes = new TextEncoder().encode(pin);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return `sha256:${Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')}`;
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

    if (!pin) {
      return Response.json({ granted: false, reason: "A PIN is required." }, { status: 400 });
    }

    const base44 = createClientFromRequest(req);
    const normalizedPin = String(pin).trim();
    if (!/^\d{4}$/.test(normalizedPin)) {
      return Response.json({ granted: false, reason: "PIN must be exactly 4 digits." }, { status: 400 });
    }

    const query = { active: true };
    if (username) query.username = username;

    const matches = await base44.asServiceRole.entities.AppUser.filter(query);

    if (!matches || matches.length === 0) {
      return Response.json({ granted: false, reason: "No matching account found." });
    }
    const candidateHash = await hashPin(normalizedPin);
    const pinMatches = matches.filter((candidate) => candidate.pin === candidateHash || candidate.pin === normalizedPin);
    if (pinMatches.length > 1 && !username) {
      return Response.json({ granted: false, reason: "That PIN is shared by several accounts — enter your username too." });
    }
    const u = pinMatches[0];
    if (!u) {
      return Response.json({ granted: false, reason: "No matching account found." });
    }
    if (u.active === false) {
      return Response.json({ granted: false, reason: "This account is inactive. Contact your administrator." });
    }
    if (u.pin !== candidateHash) {
      await base44.asServiceRole.entities.AppUser.update(u.id, { pin: candidateHash });
    }

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
  } catch (error) {
    return Response.json({ granted: false, reason: error.message || "Verification failed." }, { status: 500 });
  }
}
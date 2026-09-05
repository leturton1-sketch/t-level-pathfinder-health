import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

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
    const query = { pin: String(pin).trim(), active: true };
    if (username) query.username = username;

    const matches = await base44.asServiceRole.entities.AppUser.filter(query);

    if (!matches || matches.length === 0) {
      return Response.json({ granted: false, reason: "No matching account found." });
    }
    if (matches.length > 1 && !username) {
      return Response.json({ granted: false, reason: "That PIN is shared by several accounts — enter your username too." });
    }

    const u = matches[0];
    if (u.active === false) {
      return Response.json({ granted: false, reason: "This account is inactive. Contact your administrator." });
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
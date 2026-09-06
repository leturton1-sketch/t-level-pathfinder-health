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
    const suppliedPin = String(pin).trim();
    const normalizedUsername = String(username || "").trim().toLowerCase();

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

    if (u.active === false) {
      return Response.json({ granted: false, reason: "This account is inactive. Contact your administrator." });
    }

    try {
      await base44.asServiceRole.entities.AuthAudit.create({
        app_user_id: u.id,
        username: u.username,
        event: qr ? "qr_login" : "login_success",
        method: qr ? "qr" : "pin",
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
  } catch (error) {
    return Response.json({ granted: false, reason: error.message || "Verification failed." }, { status: 500 });
  }
}
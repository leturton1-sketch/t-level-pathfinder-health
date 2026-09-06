import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

function normalizePhrase(value) {
  return String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

async function hashValue(value) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function audit(base44, username, result, reason = '') {
  try {
    await base44.asServiceRole.entities.LoginAudit.create({
      username: String(username || '').trim().toLowerCase() || 'unknown',
      method: 'voice',
      result,
      reason: String(reason || '').slice(0, 240),
      created_at_client: new Date().toISOString(),
    });
  } catch {}
}

export default async function(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const username = String(body?.username || '').trim().toLowerCase();
    const phrase = normalizePhrase(body?.phrase);
    const base44 = createClientFromRequest(req);
    if (!username || !phrase) {
      await audit(base44, username, 'denied', 'Username and spoken recovery phrase are required.');
      return Response.json({ granted: false, reason: 'Username and spoken recovery phrase are required.' }, { status: 400 });
    }
    const matches = await base44.asServiceRole.entities.AppUser.filter({ username, active: true });
    const user = matches?.[0];
    if (!user) {
      await audit(base44, username, 'denied', 'No matching account found.');
      return Response.json({ granted: false, reason: 'No matching account found.' }, { status: 404 });
    }
    if (!user.voice_recovery_enrolled || !user.voice_phrase_hash || !user.voice_phrase_salt) {
      await audit(base44, username, 'denied', 'Spoken recovery not enrolled.');
      return Response.json({ granted: false, reason: 'Spoken recovery has not been set up for this account.' }, { status: 403 });
    }

    const candidate = await hashValue(`${user.voice_phrase_salt}:${phrase}`);
    if (candidate !== user.voice_phrase_hash) {
      await audit(base44, username, 'denied', 'Spoken recovery phrase did not match.');
      return Response.json({ granted: false, reason: 'Spoken recovery phrase did not match.' }, { status: 403 });
    }

    await audit(base44, username, 'success', 'Access granted.');

    return Response.json({
      granted: true,
      user: {
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        role: user.role,
        title: user.title || null,
        cohort: user.cohort || null,
        institution: user.institution || null,
        voice_personal_message: user.voice_personal_message || '',
      },
    });
  } catch (error) {
    try {
      const base44 = createClientFromRequest(req);
      await audit(base44, 'unknown', 'error', error?.message || 'Spoken recovery verification failed.');
    } catch {}
    return Response.json({ granted: false, reason: error?.message || 'Spoken recovery verification failed.' }, { status: 500 });
  }
}

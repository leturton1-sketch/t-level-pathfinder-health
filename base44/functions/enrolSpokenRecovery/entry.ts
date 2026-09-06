import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

function normalizePhrase(value) {
  return String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

async function hashValue(value) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function hashPin(pin) {
  return `sha256:${await hashValue(String(pin || '').trim())}`;
}

export default async function(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const username = String(body?.username || '').trim().toLowerCase();
    const pin = String(body?.pin || '').trim();
    const phrase = normalizePhrase(body?.phrase);
    const personalMessage = String(body?.personal_message || '').trim().slice(0, 240);

    if (!username || !/^\d{4}$/.test(pin)) {
      return Response.json({ enrolled: false, reason: 'Username and four-digit PIN are required.' }, { status: 400 });
    }
    if (phrase.length < 8 || phrase.length > 120) {
      return Response.json({ enrolled: false, reason: 'Choose a spoken recovery phrase between 8 and 120 characters.' }, { status: 400 });
    }

    const base44 = createClientFromRequest(req);
    const matches = await base44.asServiceRole.entities.AppUser.filter({ username, active: true });
    const user = matches?.[0];
    if (!user) return Response.json({ enrolled: false, reason: 'No matching account found.' }, { status: 404 });

    const candidateHash = await hashPin(pin);
    if (!(user.pin === candidateHash || user.pin === pin)) {
      return Response.json({ enrolled: false, reason: 'Current PIN could not be verified.' }, { status: 403 });
    }

    const saltBytes = crypto.getRandomValues(new Uint8Array(16));
    const salt = Array.from(saltBytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
    const phraseHash = await hashValue(`${salt}:${phrase}`);

    await base44.asServiceRole.entities.AppUser.update(user.id, {
      voice_recovery_enrolled: true,
      voice_phrase_hash: phraseHash,
      voice_phrase_salt: salt,
      voice_personal_message: personalMessage || user.voice_personal_message || '',
    });

    return Response.json({ enrolled: true, user: { id: user.id, username: user.username, full_name: user.full_name, role: user.role } });
  } catch (error) {
    return Response.json({ enrolled: false, reason: error?.message || 'Unable to enrol spoken recovery.' }, { status: 500 });
  }
}

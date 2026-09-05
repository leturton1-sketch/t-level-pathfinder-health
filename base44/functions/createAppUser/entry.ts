import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

const SUPER_ADMIN_EMAILS = new Set([
  'lee.turton@academic.rnngroup.ac.uk',
  'leturton1@gmail.com',
]);

async function hashPin(pin) {
  const bytes = new TextEncoder().encode(pin);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return `sha256:${Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')}`;
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const requester = await base44.auth.me();
    const requesterEmail = String(requester?.email || '').toLowerCase().trim();
    const requesterRole = SUPER_ADMIN_EMAILS.has(requesterEmail)
      ? 'super_admin'
      : ['admin', 'tutor'].includes(requester?.role) ? requester.role : 'student';

    if (!['super_admin', 'admin', 'tutor'].includes(requesterRole)) {
      return Response.json({ error: 'You are not authorised to create users.' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const role = String(body?.role || 'student');
    const pin = String(body?.pin || '');
    const username = String(body?.username || '').trim().toLowerCase();
    const fullName = String(body?.full_name || '').trim();

    if (!username || !fullName || !/^\d{4}$/.test(pin)) {
      return Response.json({ error: 'Username, full name, and a four-digit PIN are required.' }, { status: 400 });
    }
    if (!['super_admin', 'admin', 'tutor', 'student', 'guest'].includes(role)) {
      return Response.json({ error: 'Invalid user role.' }, { status: 400 });
    }
    if (role === 'super_admin' && requesterRole !== 'super_admin') {
      return Response.json({ error: 'Only a System Architect can create another System Architect.' }, { status: 403 });
    }
    if (role === 'admin' && requesterRole !== 'super_admin') {
      return Response.json({ error: 'Only a System Architect can create Admin accounts.' }, { status: 403 });
    }

    const existing = await base44.asServiceRole.entities.AppUser.filter({ username });
    if (existing?.length) {
      return Response.json({ error: 'That username is already in use.' }, { status: 409 });
    }

    const created = await base44.asServiceRole.entities.AppUser.create({
      username,
      pin: await hashPin(pin),
      role,
      title: String(body?.title || '').trim() || undefined,
      full_name: fullName,
      cohort: String(body?.cohort || '').trim(),
      first_login: true,
      active: true,
      ai_voice: 'honey',
      ai_persona: 'female',
      is_protected: role === 'super_admin',
    });

    return Response.json({ user: { id: created.id, username, role, full_name: fullName } }, { status: 201 });
  } catch (error) {
    if (error?.status === 401 || error?.status === 403) {
      return Response.json({ error: 'Authentication is required.' }, { status: 401 });
    }
    return Response.json({ error: error?.message || 'User creation failed.' }, { status: 500 });
  }
}

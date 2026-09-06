import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

const SUPER_ADMIN_EMAILS = new Set([
  'lee.turton@academic.rnngroup.ac.uk',
  'leturton1@gmail.com',
]);

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const requester = await base44.auth.me();
    const requesterEmail = String(requester?.email || '').toLowerCase().trim();
    const requesterRole = SUPER_ADMIN_EMAILS.has(requesterEmail)
      ? 'super_admin'
      : ['admin', 'tutor'].includes(requester?.role) ? requester.role : 'student';
    if (!['super_admin', 'admin', 'tutor'].includes(requesterRole)) {
      return Response.json({ error: 'You are not authorised to reset spoken recovery.' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const userId = String(body?.user_id || '').trim();
    if (!userId) return Response.json({ error: 'A user ID is required.' }, { status: 400 });

    const target = await base44.asServiceRole.entities.AppUser.get(userId);
    if (!target) return Response.json({ error: 'User account not found.' }, { status: 404 });
    if (['super_admin', 'admin'].includes(target.role) && requesterRole !== 'super_admin') {
      return Response.json({ error: 'Only a System Architect can reset this user.' }, { status: 403 });
    }

    await base44.asServiceRole.entities.AppUser.update(userId, {
      voice_recovery_enrolled: false,
      voice_phrase_hash: '',
      voice_phrase_salt: '',
    });
    return Response.json({ reset: true });
  } catch (error) {
    if (error?.status === 401 || error?.status === 403) {
      return Response.json({ error: 'Authentication is required.' }, { status: 401 });
    }
    return Response.json({ error: error?.message || 'Spoken recovery reset failed.' }, { status: 500 });
  }
}

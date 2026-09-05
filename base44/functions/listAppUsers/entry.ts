import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

const SUPER_ADMIN_EMAILS = new Set([
  'lee.turton@academic.rnngroup.ac.uk',
  'leturton1@gmail.com',
]);

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const requester = await base44.auth.me();
    const email = String(requester?.email || '').toLowerCase().trim();
    const role = SUPER_ADMIN_EMAILS.has(email) ? 'super_admin' : requester?.role;
    if (!['super_admin', 'admin', 'tutor'].includes(role)) {
      return Response.json({ error: 'You are not authorised to view users.' }, { status: 403 });
    }

    const users = await base44.asServiceRole.entities.AppUser.list();
    return Response.json({
      users: users.map(({ pin: _pin, ...user }) => user),
    });
  } catch (error) {
    if (error?.status === 401 || error?.status === 403) {
      return Response.json({ error: 'Authentication is required.' }, { status: 401 });
    }
    return Response.json({ error: error?.message || 'Unable to load users.' }, { status: 500 });
  }
}

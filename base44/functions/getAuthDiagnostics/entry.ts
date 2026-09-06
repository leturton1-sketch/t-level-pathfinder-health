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
      return Response.json({ error: 'You are not authorised to view authentication diagnostics.' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const username = String(body?.username || '').trim().toLowerCase();
    const limit = Math.min(Math.max(Number(body?.limit) || 100, 1), 250);

    const query = username ? { username } : {};
    const events = await base44.asServiceRole.entities.LoginAudit.filter(query, '-created_date', limit);
    const users = await base44.asServiceRole.entities.AppUser.list();

    const statsByUser = {};
    for (const user of users) {
      statsByUser[user.username] = {
        username: user.username,
        full_name: user.full_name,
        role: user.role,
        active: user.active !== false,
        first_login: !!user.first_login,
        voice_recovery_enrolled: !!user.voice_recovery_enrolled,
        successes: 0,
        denials: 0,
        errors: 0,
        last_success: null,
        last_denial: null,
        last_method: null,
      };
    }

    for (const event of events || []) {
      const key = event.username;
      if (!statsByUser[key]) continue;
      const stats = statsByUser[key];
      if (event.result === 'success') {
        stats.successes += 1;
        if (!stats.last_success) stats.last_success = event.created_date || event.created_at_client || null;
      } else if (event.result === 'denied') {
        stats.denials += 1;
        if (!stats.last_denial) stats.last_denial = event.created_date || event.created_at_client || null;
      } else if (event.result === 'error') {
        stats.errors += 1;
      }
      if (!stats.last_method) stats.last_method = event.method || null;
    }

    return Response.json({
      events: (events || []).map((event) => ({
        id: event.id,
        username: event.username,
        method: event.method,
        result: event.result,
        reason: event.reason || '',
        created_date: event.created_date || event.created_at_client || null,
      })),
      users: Object.values(statsByUser),
    });
  } catch (error) {
    if (error?.status === 401 || error?.status === 403) {
      return Response.json({ error: 'Authentication is required.' }, { status: 401 });
    }
    return Response.json({ error: error?.message || 'Unable to load authentication diagnostics.' }, { status: 500 });
  }
}

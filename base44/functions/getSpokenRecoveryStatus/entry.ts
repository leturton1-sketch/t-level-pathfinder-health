import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    await base44.auth.me();
    const body = await req.json().catch(() => ({}));
    const username = String(body?.username || '').trim().toLowerCase();
    if (!username) {
      return Response.json({ error: 'Username is required.' }, { status: 400 });
    }
    const matches = await base44.asServiceRole.entities.AppUser.filter({ username, active: true });
    const user = matches?.[0];
    if (!user) return Response.json({ error: 'No matching account found.' }, { status: 404 });
    return Response.json({
      username: user.username,
      full_name: user.full_name,
      role: user.role,
      voice_recovery_enrolled: !!user.voice_recovery_enrolled,
    });
  } catch (error) {
    return Response.json({ error: error?.message || 'Unable to read spoken recovery status.' }, { status: 500 });
  }
}

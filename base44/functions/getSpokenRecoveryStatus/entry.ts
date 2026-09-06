import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    let caller;
    try {
      caller = await base44.auth.me();
    } catch {
      return Response.json({ error: 'Authentication required.' }, { status: 401 });
    }
    if (!caller) {
      return Response.json({ error: 'Authentication required.' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const username = String(body?.username || '').trim().toLowerCase();
    if (!username) {
      return Response.json({ error: 'Username is required.' }, { status: 400 });
    }

    // Only platform admins may inspect another user's recovery status; a
    // regular authenticated user must not be able to enumerate the directory
    // or read other users' full names and security configuration.
    if (String(caller.role || '').toLowerCase() !== 'admin') {
      return Response.json({ error: 'Not authorised to view recovery status for other accounts.' }, { status: 403 });
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
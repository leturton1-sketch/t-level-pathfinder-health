import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { secrets } from 'base44:runtime';

async function sha256(value) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(String(value)));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

async function authenticatedUser(base44, sessionToken) {
  try {
    const platformUser = await base44.auth.me();
    if (platformUser) return platformUser;
  } catch {}

  if (typeof sessionToken !== "string" || !/^[a-f0-9]{64}$/.test(sessionToken)) return null;
  const tokenHash = await sha256(sessionToken);
  const sessions = await base44.asServiceRole.entities.AppSession.filter({ token_hash: tokenHash, revoked: false }, "-expires_at", 3);
  const session = (sessions || []).find((item) => Number.isFinite(Date.parse(item.expires_at)) && Date.parse(item.expires_at) > Date.now());
  if (!session) return null;
  const users = await base44.asServiceRole.entities.AppUser.filter({ id: session.app_user_id, active: true });
  return users?.[0] || null;
}

export default async function(req) {
  if (req.method !== 'POST') return Response.json({ error: 'Method not allowed.' }, { status: 405 });
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const user = await authenticatedUser(base44, body?.pathfinder_session_token);
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const messages = Array.isArray(body?.messages) && body.messages.length
      ? body.messages
      : [{ role: 'user', content: String(body?.prompt || '') }];
    const model = body?.model || 'openrouter/free';

    const apiKey = secrets.get('OPENROUTER_API_KEY');
    if (!apiKey) return Response.json({ error: 'OpenRouter API key not configured on the server.' }, { status: 500 });

    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://pathfinder.base44.app',
        'X-Title': 'Pathfinder T-Level Simulation',
      },
      body: JSON.stringify({ model, messages }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error('openrouterChat upstream error', res.status, text.slice(0, 400));
      return Response.json({ error: 'The AI service is unavailable. Please try again later.' }, { status: 502 });
    }
    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content || '';
    return Response.json({ content, model: data?.model || model, provider: 'openrouter' });
  } catch (error) {
    console.error('openrouterChat failure', error);
    return Response.json({ error: 'An unexpected error occurred while contacting the AI service.' }, { status: 500 });
  }
}
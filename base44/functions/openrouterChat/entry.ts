import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { secrets } from 'base44:runtime';

const OPENROUTER_MODEL = 'openrouter/free';
const AI_WINDOW_MS = 60 * 60 * 1000;
const STUDENT_REQUESTS_PER_HOUR = 20;
const STAFF_REQUESTS_PER_HOUR = 60;
const STAFF_ROLES = new Set(['tutor', 'admin', 'super_admin']);

async function reserveAiUsage(base44, user, provider, inputChars) {
  const limit = STAFF_ROLES.has(user?.role) ? STAFF_REQUESTS_PER_HOUR : STUDENT_REQUESTS_PER_HOUR;
  const rows = await base44.asServiceRole.entities.AIUsage.filter(
    { app_user_id: user.id }, '-requested_at', limit + 25,
  );
  const since = Date.now() - AI_WINDOW_MS;
  const recent = (rows || []).filter((row) => {
    const time = Date.parse(row.requested_at);
    return Number.isFinite(time) && time > since;
  });
  if (recent.length >= limit) return null;
  return base44.asServiceRole.entities.AIUsage.create({
    app_user_id: user.id,
    provider,
    requested_at: new Date().toISOString(),
    input_chars: inputChars,
    status: 'started',
  });
}

async function finishAiUsage(base44, usage, status) {
  if (!usage?.id) return;
  try { await base44.asServiceRole.entities.AIUsage.update(usage.id, { status }); } catch {}
}

async function sha256(value) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(String(value)));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

async function customSessionUser(base44, sessionToken) {
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
  const contentLength = Number(req.headers.get('content-length') || 0);
  if (Number.isFinite(contentLength) && contentLength > 100000) {
    return Response.json({ error: 'The request is too large.' }, { status: 413 });
  }
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));

    // Keep Base44's native authentication check explicit in the request
    // handler so platform security analysis can verify this function. The
    // signed Pathfinder session is the supported fallback for PIN users.
    let platformUser = null;
    try { platformUser = await base44.auth.me(); } catch {}
    const user = platformUser || await customSessionUser(base44, body?.pathfinder_session_token);
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const rawMessages = Array.isArray(body?.messages) && body.messages.length
      ? body.messages
      : [{ role: 'user', content: String(body?.prompt || '') }];
    const messages = rawMessages.slice(-30).map((message) => ({
      role: ["user", "assistant", "system"].includes(message?.role) ? message.role : "user",
      content: String(message?.content || "").slice(0, 8000),
    }));
    const inputSize = messages.reduce((total, message) => total + message.content.length, 0);
    if (!inputSize) return Response.json({ error: 'A prompt or messages array is required.' }, { status: 400 });
    if (inputSize > 30000) return Response.json({ error: 'The request is too large.' }, { status: 413 });

    // The server selects a free model; callers cannot choose a chargeable model.
    const model = OPENROUTER_MODEL;
    const apiKey = secrets.get('OPENROUTER_API_KEY');
    if (!apiKey) return Response.json({ error: 'OpenRouter API key not configured on the server.' }, { status: 500 });

    let usage;
    try {
      usage = await reserveAiUsage(base44, user, 'openrouter', inputSize);
    } catch {
      return Response.json({ error: 'AI usage protection is temporarily unavailable.' }, { status: 503 });
    }
    if (!usage) {
      return Response.json(
        { error: 'AI request limit reached. Please try again later.' },
        { status: 429, headers: { 'Retry-After': '3600', 'Cache-Control': 'no-store' } },
      );
    }

    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://pathfinder.base44.app',
        'X-Title': 'Pathfinder T-Level Simulation',
      },
      body: JSON.stringify({ model, messages, max_tokens: 1200 }),
    });

    if (!res.ok) {
      await finishAiUsage(base44, usage, 'failed');
      const text = await res.text();
      console.error('openrouterChat upstream error', res.status, text.slice(0, 400));
      return Response.json({ error: 'The AI service is unavailable. Please try again later.' }, { status: 502 });
    }
    const data = await res.json();
    await finishAiUsage(base44, usage, 'succeeded');
    const content = data?.choices?.[0]?.message?.content || '';
    return Response.json({ content, model: data?.model || model, provider: 'openrouter' });
  } catch (error) {
    console.error('openrouterChat failure', error);
    return Response.json({ error: 'An unexpected error occurred while contacting the AI service.' }, { status: 500 });
  }
}
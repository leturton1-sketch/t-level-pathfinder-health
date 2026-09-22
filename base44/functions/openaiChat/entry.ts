import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { secrets } from 'base44:runtime';

const DEFAULT_MODEL = 'gpt-5.4-mini';
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

function extractOutputText(data) {
  if (typeof data?.output_text === 'string') return data.output_text;
  return (data?.output || [])
    .flatMap((item) => item?.content || [])
    .filter((part) => part?.type === 'output_text' && typeof part?.text === 'string')
    .map((part) => part.text)
    .join('');
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
    const user = await authenticatedUser(base44, body?.pathfinder_session_token);
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    let input;
    if (Array.isArray(body?.messages) && body.messages.length) {
      input = body.messages.slice(-30).map((message) => ({
        role: ["user", "assistant", "system", "developer"].includes(message?.role) ? message.role : "user",
        content: String(message?.content || "").slice(0, 8000),
      }));
    } else {
      input = String(body?.prompt || '').slice(0, 30000);
    }

    const inputSize = typeof input === "string"
      ? input.length
      : input.reduce((total, message) => total + message.content.length, 0);
    if (!inputSize) {
      return Response.json({ error: 'A prompt or messages array is required.' }, { status: 400 });
    }
    if (inputSize > 30000) {
      return Response.json({ error: 'The request is too large.' }, { status: 413 });
    }

    const apiKey = secrets.get('OPENAI_API_KEY');
    if (!apiKey) {
      return Response.json({ error: 'OpenAI API key not configured on the server.' }, { status: 500 });
    }

    let usage;
    try {
      usage = await reserveAiUsage(base44, user, 'openai', inputSize);
    } catch {
      return Response.json({ error: 'AI usage protection is temporarily unavailable.' }, { status: 503 });
    }
    if (!usage) {
      return Response.json(
        { error: 'AI request limit reached. Please try again later.' },
        { status: 429, headers: { 'Retry-After': '3600', 'Cache-Control': 'no-store' } },
      );
    }

    const requestBody = {
      model: DEFAULT_MODEL,
      input,
      store: false,
      max_output_tokens: 1200,
    };

    if (body?.response_json_schema) {
      if (JSON.stringify(body.response_json_schema).length > 20000) {
        return Response.json({ error: 'The response schema is too large.' }, { status: 413 });
      }
      requestBody.text = {
        format: {
          type: 'json_schema',
          name: 'pathfinder_response',
          schema: body.response_json_schema,
          strict: false,
        },
      };
    }

    const res = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!res.ok) {
      await finishAiUsage(base44, usage, 'failed');
      return Response.json(
        { error: `OpenAI request failed (${res.status}).` },
        { status: 502 },
      );
    }

    const data = await res.json();
    await finishAiUsage(base44, usage, 'succeeded');
    const content = extractOutputText(data);
    if (!content.trim()) {
      return Response.json({ error: 'OpenAI returned an empty response.' }, { status: 502 });
    }

    if (body?.response_json_schema) {
      try {
        return Response.json(JSON.parse(content));
      } catch {
        return Response.json({ error: 'OpenAI returned an invalid structured response.' }, { status: 502 });
      }
    }

    return Response.json({
      content,
      model: data?.model || requestBody.model,
      provider: 'openai',
    });
  } catch {
    return Response.json({ error: 'OpenAI integration failed.' }, { status: 500 });
  }
}

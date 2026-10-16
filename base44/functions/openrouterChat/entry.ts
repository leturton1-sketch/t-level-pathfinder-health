import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { secrets } from 'base44:runtime';
import { authenticateUser, reserveAiUsage, finishAiUsage, clientIp, checkIpRateLimit } from '../../shared/aiUsage.ts';

const OPENROUTER_MODEL = 'openrouter/free';

export default async function(req) {
  if (req.method !== 'POST') return Response.json({ error: 'Method not allowed.' }, { status: 405 });
  const contentLength = Number(req.headers.get('content-length') || 0);
  if (Number.isFinite(contentLength) && contentLength > 100000) {
    return Response.json({ error: 'The request is too large.' }, { status: 413 });
  }
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const user = await authenticateUser(base44, body?.pathfinder_session_token);
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const ip = clientIp(req);
    if (!(await checkIpRateLimit(base44, ip))) {
      return Response.json(
        { error: 'Too many AI requests from this network. Please try again later.' },
        { status: 429, headers: { 'Retry-After': '3600', 'Cache-Control': 'no-store' } },
      );
    }

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

    const model = OPENROUTER_MODEL;
    const apiKey = secrets.get('OPENROUTER_API_KEY');
    if (!apiKey) return Response.json({ error: 'OpenRouter API key not configured on the server.' }, { status: 500 });

    let usage;
    try {
      usage = await reserveAiUsage(base44, user, 'openrouter', inputSize, ip);
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
        'HTTP-Referer': 'https://t-level-pathfinder-health.base44.app',
        'X-Title': 'LEE Simulation',
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
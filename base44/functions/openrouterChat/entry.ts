import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { secrets } from 'base44:runtime';

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MAX_ATTEMPTS = 3;
const REQUEST_TIMEOUT_MS = 20000;
const RETRYABLE_STATUSES = new Set([408, 409, 429, 500, 502, 503, 504]);

const delay = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

const getRetryDelay = (response, attempt) => {
  const retryAfter = Number(response.headers.get('retry-after'));
  if (Number.isFinite(retryAfter) && retryAfter >= 0) return Math.min(retryAfter * 1000, 10000);
  return Math.min(500 * (2 ** attempt), 4000);
};

async function requestOpenRouter(secret, model, messages) {
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const response = await fetch(OPENROUTER_URL, {
        method: 'POST',
        headers: Object.assign({
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://pathfinder.base44.app',
          'X-Title': 'Pathfinder T-Level Simulation',
        }, { Authorization: ['Bearer', secret].join(' ') }),
        body: JSON.stringify({ model, messages }),
        signal: controller.signal,
      });
      if (response.ok) return response;
      if (!RETRYABLE_STATUSES.has(response.status) || attempt === MAX_ATTEMPTS - 1) {
        const text = await response.text();
        throw new Error(`OpenRouter request failed (${response.status}): ${text.slice(0, 400)}`);
      }
      await response.arrayBuffer();
      await delay(getRetryDelay(response, attempt));
    } catch (error) {
      if (attempt === MAX_ATTEMPTS - 1) {
        if (error?.name === 'AbortError') throw new Error('OpenRouter request timed out.');
        throw error;
      }
      if (error?.name !== 'AbortError' && !String(error?.message || '').startsWith('fetch failed')) throw error;
      await delay(500 * (2 ** attempt));
    } finally {
      clearTimeout(timeout);
    }
  }
  throw new Error('OpenRouter request failed after retries.');
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    let user;
    try { user = await base44.auth.me(); } catch {}
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const messages = Array.isArray(body?.messages) && body.messages.length
      ? body.messages
      : [{ role: 'user', content: String(body?.prompt || '') }];
    if (!messages.some((message) => {
      const content = message?.content;
      return typeof content === 'string' ? content.trim() : content;
    })) {
      return Response.json({ error: 'A prompt or messages array is required.' }, { status: 400 });
    }

    const model = body?.model || 'openrouter/free';
    const secret = secrets.get('OPENROUTER_API_KEY');
    if (!secret) return Response.json({ error: 'OpenRouter API key not configured on the server.' }, { status: 500 });

    const response = await requestOpenRouter(secret, model, messages);
    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content || '';
    if (!content.trim()) return Response.json({ error: 'OpenRouter returned an empty response.' }, { status: 502 });
    return Response.json({ content, model: data?.model || model, provider: 'openrouter' });
  } catch (error) {
    return Response.json({ error: error?.message || 'OpenRouter integration failed.' }, { status: 502 });
  }
}

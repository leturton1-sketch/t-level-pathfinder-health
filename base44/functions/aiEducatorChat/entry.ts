import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { authenticateUser, reserveAiUsage, finishAiUsage, clientIp, checkIpRateLimit } from '../../shared/aiUsage.ts';

// Brokers the structured Clinical Educator chat (ward/app actions, attention
// cues) through the Core InvokeLLM integration so the client never consumes
// integration credits directly. Per-user rate limiting protects credits.
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

    const prompt = String(body?.prompt || '');
    if (!prompt.trim()) return Response.json({ error: 'A prompt is required.' }, { status: 400 });
    if (prompt.length > 60000) return Response.json({ error: 'The request is too large.' }, { status: 413 });

    let usage;
    try {
      usage = await reserveAiUsage(base44, user, 'core_llm', prompt.length, ip);
    } catch {
      return Response.json({ error: 'AI usage protection is temporarily unavailable.' }, { status: 503 });
    }
    if (!usage) {
      return Response.json(
        { error: 'AI request limit reached. Please try again later.' },
        { status: 429, headers: { 'Retry-After': '3600', 'Cache-Control': 'no-store' } },
      );
    }

    const invokeArgs = { prompt };
    if (body?.response_json_schema && typeof body.response_json_schema === 'object') {
      const schema = body.response_json_schema;
      if (Array.isArray(schema) || schema.type !== 'object' || JSON.stringify(schema).length > 40000) {
        await finishAiUsage(base44, usage, 'failed');
        return Response.json({ error: 'Invalid response schema.' }, { status: 400 });
      }
      invokeArgs.response_json_schema = schema;
    }
    if (Array.isArray(body?.file_urls) && body.file_urls.length) {
      const urls = body.file_urls.slice(0, 5).filter(
        (url) => typeof url === 'string' && /^https?:\/\/.+/.test(url),
      );
      if (urls.length) invokeArgs.file_urls = urls;
    }

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM(invokeArgs);
    await finishAiUsage(base44, usage, 'succeeded');
    const data = result?.data ?? result;
    if (data?.error) {
      return Response.json({ error: data.error }, { status: 502 });
    }
    return Response.json(data);
  } catch {
    return Response.json({ error: 'The AI educator service is unavailable.' }, { status: 500 });
  }
}
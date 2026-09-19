import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { secrets } from 'base44:runtime';

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
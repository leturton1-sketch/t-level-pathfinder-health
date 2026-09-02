import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { secrets } from 'base44:runtime';

const DEFAULT_MODEL = 'gpt-5.4-mini';

function extractOutputText(data) {
  if (typeof data?.output_text === 'string') return data.output_text;
  return (data?.output || [])
    .flatMap((item) => item?.content || [])
    .filter((part) => part?.type === 'output_text' && typeof part?.text === 'string')
    .map((part) => part.text)
    .join('');
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    let user;
    try { user = await base44.auth.me(); } catch {}
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const input = Array.isArray(body?.messages) && body.messages.length
      ? body.messages
      : String(body?.prompt || '');

    if ((typeof input === 'string' && !input.trim()) || (Array.isArray(input) && !input.length)) {
      return Response.json({ error: 'A prompt or messages array is required.' }, { status: 400 });
    }

    const apiKey = secrets.get('OPENAI_API_KEY');
    if (!apiKey) {
      return Response.json({ error: 'OpenAI API key not configured on the server.' }, { status: 500 });
    }

    const requestBody = {
      model: body?.model || DEFAULT_MODEL,
      input,
      store: false,
    };

    if (body?.response_json_schema) {
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
      return Response.json(
        { error: `OpenAI request failed (${res.status}).` },
        { status: 502 },
      );
    }

    const data = await res.json();
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

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { authenticateUser, clientIp, checkIpRateLimit } from '../../shared/aiUsage.ts';

// Sends a help request from an authenticated app user to the System
// Architect's private email. The recipient address is held server-side only
// so it is never exposed to the client. Rate-limited per IP to deter abuse.

const RECIPIENT_EMAIL = "leturton1@gmail.com";

export default async function(req) {
  if (req.method !== 'POST') return Response.json({ error: 'Method not allowed.' }, { status: 405 });
  const contentLength = Number(req.headers.get('content-length') || 0);
  if (Number.isFinite(contentLength) && contentLength > 50000) {
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
        { error: 'Too many requests from this network. Please try again later.' },
        { status: 429, headers: { 'Retry-After': '3600', 'Cache-Control': 'no-store' } },
      );
    }

    const message = String(body?.message || '').trim();
    if (!message) return Response.json({ error: 'A message is required.' }, { status: 400 });
    if (message.length > 5000) return Response.json({ error: 'The message is too long.' }, { status: 413 });

    const escapeHtml = (value) => String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

    const senderName = String(user?.full_name || user?.username || 'A T-SIM Health user');
    const senderRole = String(user?.role || 'unknown');
    const timestamp = new Date().toLocaleString('en-GB', { timeZone: 'Europe/London' });

    const subject = `T-SIM Health help request from ${senderName}`;
    const html = `
      <div style="font-family:Inter,Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#f6f7f9;">
        <div style="background:#0e76d8;color:#ffffff;padding:20px 24px;border-radius:12px 12px 0 0;">
          <h1 style="margin:0;font-size:20px;font-weight:700;">T-SIM Health — Help Request</h1>
        </div>
        <div style="background:#ffffff;padding:24px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;">
          <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
            <tr><td style="padding:4px 0;color:#48668c;font-size:13px;width:100px;">From</td><td style="padding:4px 0;color:#063b82;font-weight:600;font-size:14px;">${escapeHtml(senderName)}</td></tr>
            <tr><td style="padding:4px 0;color:#48668c;font-size:13px;">Role</td><td style="padding:4px 0;color:#063b82;font-size:14px;">${escapeHtml(senderRole)}</td></tr>
            <tr><td style="padding:4px 0;color:#48668c;font-size:13px;">Sent</td><td style="padding:4px 0;color:#063b82;font-size:14px;">${escapeHtml(timestamp)}</td></tr>
          </table>
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0;" />
          <h2 style="margin:0 0 12px 0;color:#063b82;font-size:15px;">Message</h2>
          <div style="color:#063b82;font-size:14px;line-height:1.6;white-space:pre-wrap;">${escapeHtml(message)}</div>
        </div>
        <p style="color:#48668c;font-size:12px;margin-top:16px;text-align:center;">This help request was sent from the T-SIM Health Clinical Educator page.</p>
      </div>
    `;

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: RECIPIENT_EMAIL,
      subject,
      html,
    });

    return Response.json({ success: true });
  } catch {
    return Response.json({ error: 'The help request could not be sent. Please try again later.' }, { status: 500 });
  }
}
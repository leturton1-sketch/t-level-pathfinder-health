import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

const RECIPIENT_EMAIL = "lee.turton@academic.rnngroup.ac.uk";

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

function toBase64Url(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  const b64 = btoa(bin);
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// Strip CR/LF (and stray control chars) from values placed into MIME headers
// (Subject, To, From). User-controlled record fields such as student_name can
// otherwise inject additional headers / a new message body via CRLF.
function sanitizeHeader(value) {
  return String(value || "").replace(/[\r\n\t]/g, " ").replace(/\u0000/g, "").trim();
}

function buildMime(subject, body) {
  return [
    `To: ${RECIPIENT_EMAIL}`,
    `From: ClinicalEdge Notifications <me>`,
    `Subject: ${subject}`,
    `MIME-Version: 1.0`,
    `Content-Type: text/plain; charset=UTF-8`,
    ``,
    body,
  ].join("\r\n");
}

function carePlanBody(rec) {
  const sk = (rec.sk_codes || []).join(", ");
  const po = (rec.performance_outcomes || []).join(", ");
  return [
    `A student has submitted a care plan for review.`,
    ``,
    `Student: ${rec.student_name || "—"}`,
    `Type: ${rec.type || "—"}`,
    `Title: ${rec.title || "—"}`,
    `Status: ${rec.status || "—"}`,
    `Submitted: ${new Date(rec.created_date || Date.now()).toLocaleString("en-GB")}`,
    ``,
    `SK codes: ${sk || "—"}`,
    `Performance outcomes: ${po || "—"}`,
    ``,
    `--- Submission content ---`,
    rec.content || "(no content)",
  ].join("\n");
}

function simulationBody(rec) {
  const pct = rec.max_score ? Math.round((rec.score / rec.max_score) * 100) : 0;
  const sk = (rec.sk_codes || []).join(", ");
  const po = (rec.performance_outcomes || []).join(", ");
  return [
    `A student has completed a ward simulation.`,
    ``,
    `Student: ${rec.student_name || "—"}`,
    `Scenario: ${rec.scenario_name || "—"}`,
    `Score: ${rec.score || 0} / ${rec.max_score || 100} (${pct}%)`,
    `Completed: ${new Date(rec.created_date || Date.now()).toLocaleString("en-GB")}`,
    ``,
    `SK codes: ${sk || "—"}`,
    `Performance outcomes: ${po || "—"}`,
    ``,
    `--- Decisions ---`,
    rec.decisions || "(no decision data)",
  ].join("\n");
}

export default async function(req) {
  if (req.method !== "POST") return Response.json({ error: "Method not allowed." }, { status: 405 });
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const caller = await authenticatedUser(base44, body?.pathfinder_session_token);
    if (!caller) return Response.json({ error: "Authentication required" }, { status: 401 });
    if (!["admin", "super_admin", "tutor"].includes(caller.role)) {
      return Response.json({ error: "Not authorized" }, { status: 403 });
    }

    const { entity_name, record_id } = body;

    // Read the record via the service role (needed to reach tutor_id, which is
    // not covered by the CarePlanSubmission RLS), then enforce a per-record
    // ownership check before any content is placed into the email body. Admins
    // may notify on any record; tutors only on records they own, are assigned
    // to, or created. A missing record and an unauthorized record return the
    // same 403 so record IDs cannot be enumerated.
    const isAdmin = ["admin", "super_admin"].includes(caller.role);
    let rec;
    try {
      if (entity_name === "CarePlanSubmission") {
        rec = await base44.asServiceRole.entities.CarePlanSubmission.get(record_id);
      } else if (entity_name === "SimulationResult") {
        rec = await base44.asServiceRole.entities.SimulationResult.get(record_id);
      } else {
        return Response.json({ error: "Unknown entity_name" }, { status: 400 });
      }
    } catch {
      return Response.json({ error: "Not authorized" }, { status: 403 });
    }
    if (!rec) return Response.json({ error: "Not authorized" }, { status: 403 });

    if (!isAdmin) {
      const owner =
        rec.created_by_id === caller.id ||
        rec.student_id === caller.id ||
        (entity_name === "CarePlanSubmission" && rec.tutor_id === caller.id);
      if (!owner) return Response.json({ error: "Not authorized" }, { status: 403 });
    }

    let subject, bodyText;
    if (entity_name === "CarePlanSubmission") {
      const studentName = sanitizeHeader(rec.student_name) || "Student";
      subject = `New care plan submission — ${studentName}`;
      bodyText = carePlanBody(rec);
    } else {
      const studentName = sanitizeHeader(rec.student_name) || "Student";
      const scenarioName = sanitizeHeader(rec.scenario_name) || "Scenario";
      subject = `Simulation score — ${studentName} — ${scenarioName}`;
      bodyText = simulationBody(rec);
    }

    const { accessToken } = await base44.asServiceRole.connectors.getConnection("gmail");
    const raw = toBase64Url(buildMime(subject, bodyText));
    const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ raw }),
    });
    if (!res.ok) {
      const errText = await res.text();
      return Response.json({ error: `Gmail send failed: ${res.status} ${errText}` }, { status: 502 });
    }
    const data = await res.json();
    return Response.json({ ok: true, messageId: data.id });
  } catch (error) {
    return Response.json({ error: "Unable to process notification." }, { status: 500 });
  }
}
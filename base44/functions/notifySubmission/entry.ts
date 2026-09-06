import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

const RECIPIENT_EMAIL = "lee.turton@academic.rnngroup.ac.uk";

function toBase64Url(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  const b64 = btoa(bin);
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
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
  try {
    const base44 = createClientFromRequest(req);
    const { entity_name, record_id } = await req.json();

    let subject, bodyText;
    if (entity_name === "CarePlanSubmission") {
      const rec = await base44.asServiceRole.entities.CarePlanSubmission.get(record_id);
      subject = `New care plan submission — ${rec.student_name || "Student"}`;
      bodyText = carePlanBody(rec);
    } else if (entity_name === "SimulationResult") {
      const rec = await base44.asServiceRole.entities.SimulationResult.get(record_id);
      subject = `Simulation score — ${rec.student_name || "Student"} — ${rec.scenario_name || "Scenario"}`;
      bodyText = simulationBody(rec);
    } else {
      return Response.json({ error: "Unknown entity_name" }, { status: 400 });
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
    return Response.json({ error: error.message }, { status: 500 });
  }
}
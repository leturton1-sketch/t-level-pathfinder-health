import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

async function loadHandler(client) {
  const source = (await readFile("base44/functions/appData/entry.ts", "utf8"))
    .replace(/^import .*?;\s*/s, "")
    .replace("export default async function", "return async function");
  return new Function("createClientFromRequest", source)(() => client);
}

async function sha256(value) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function entityStore(seed = []) {
  const rows = seed.map((row) => ({ ...row }));
  const matches = (row, query) => Object.entries(query || {}).every(([key, value]) => row[key] === value);
  return {
    rows,
    list: async (_sort, limit = 100, skip = 0) => rows.slice(skip, skip + limit),
    filter: async (query, _sort, limit = 100, skip = 0) => rows.filter((row) => matches(row, query)).slice(skip, skip + limit),
    get: async (id) => rows.find((row) => row.id === id) || null,
    create: async (data) => {
      const row = { ...data, id: `row-${rows.length + 1}` };
      rows.push(row);
      return row;
    },
    update: async (id, data) => {
      const row = rows.find((item) => item.id === id);
      if (!row) throw new Error("missing");
      Object.assign(row, data);
      return row;
    },
    delete: async (id) => {
      const index = rows.findIndex((item) => item.id === id);
      if (index < 0) throw new Error("missing");
      return rows.splice(index, 1)[0];
    },
  };
}

async function fixture(role = "student") {
  const token = "a".repeat(64);
  const users = entityStore([
    { id: "student-1", username: "learner", full_name: "Learner One", role: "student", active: true, pin: "sha256:secret", qr_token: "legacy" },
    { id: "student-2", username: "other", full_name: "Learner Two", role: "student", active: true, pin: "sha256:other" },
    { id: "staff-1", username: "tutor", full_name: "Tutor One", role: "tutor", active: true, pin: "sha256:staff" },
  ]);
  const userId = role === "student" ? "student-1" : "staff-1";
  users.rows.find((user) => user.id === userId).role = role;
  const stores = {
    AppSession: entityStore([{ id: "session-1", app_user_id: userId, token_hash: await sha256(token), revoked: false, expires_at: new Date(Date.now() + 60000).toISOString() }]),
    AppUser: users,
    SimulationResult: entityStore([
      { id: "result-1", student_id: "student-1", score: 90, max_score: 100, completed: true },
      { id: "result-2", student_id: "student-2", score: 70, max_score: 100, completed: true },
    ]),
    CarePlanSubmission: entityStore([
      { id: "plan-1", student_id: "student-1", content: "old", status: "submitted", tutor_feedback: "Tutor only" },
    ]),
    ESPPortfolio: entityStore([
      { id: "portfolio-1", student_id: "student-1", research_notes: "old", status: "submitted", tutor_feedback: "Tutor only" },
    ]),
    LearnerReadiness: entityStore([
      { id: "readiness-1", student_id: "student-1", overall_score: 80 },
    ]),
    TheoryModule: entityStore([{ id: "theory-1", title: "Safeguarding" }]),
    Scenario: entityStore([{ id: "scenario-1", name: "Ward round" }]),
    AuthAudit: entityStore([]),
  };
  const client = { asServiceRole: { entities: new Proxy({}, { get: (_target, name) => stores[name] || entityStore([]) }) } };
  return { token, stores, handler: await loadHandler(client) };
}

function request(payload) {
  return new Request("https://example.test", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

test("rejects missing or tampered Pathfinder sessions", async () => {
  const { handler } = await fixture();
  const response = await handler(request({ session_token: "b".repeat(64), entity_name: "TheoryModule", operation: "list", args: {} }));
  assert.equal(response.status, 401);
});

test("students only read and write records scoped to their server identity", async () => {
  const { handler, token, stores } = await fixture("student");
  const list = await (await handler(request({ session_token: token, entity_name: "SimulationResult", operation: "list", args: {} }))).json();
  assert.deepEqual(list.map((row) => row.id), ["result-1"]);

  const created = await (await handler(request({
    session_token: token,
    entity_name: "SimulationResult",
    operation: "create",
    args: { data: { student_id: "student-2", score: 88 } },
  }))).json();
  assert.equal(created.student_id, "student-1");
  assert.equal(stores.SimulationResult.rows.at(-1).student_id, "student-1");

  const forbidden = await handler(request({ session_token: token, entity_name: "AppUser", operation: "list", args: {} }));
  assert.equal(forbidden.status, 403);
});

test("learners cannot alter tutor feedback, grading fields or readiness scores", async () => {
  const { handler, token, stores } = await fixture("student");

  const gradeAttempt = await handler(request({
    session_token: token,
    entity_name: "SimulationResult",
    operation: "update",
    args: { id: "result-1", data: { score: 100, max_score: 100, completed: true } },
  }));
  assert.equal(gradeAttempt.status, 403);
  assert.equal(stores.SimulationResult.rows[0].score, 90);

  const planUpdate = await handler(request({
    session_token: token,
    entity_name: "CarePlanSubmission",
    operation: "update",
    args: { id: "plan-1", data: { content: "learner revision", tutor_feedback: "self graded", status: "reviewed" } },
  }));
  assert.equal(planUpdate.status, 200);
  assert.equal(stores.CarePlanSubmission.rows[0].content, "learner revision");
  assert.equal(stores.CarePlanSubmission.rows[0].tutor_feedback, "Tutor only");
  assert.equal(stores.CarePlanSubmission.rows[0].status, "submitted");

  const readinessAttempt = await handler(request({
    session_token: token,
    entity_name: "LearnerReadiness",
    operation: "update",
    args: { id: "readiness-1", data: { overall_score: 100 } },
  }));
  assert.equal(readinessAttempt.status, 403);
  assert.equal(stores.LearnerReadiness.rows[0].overall_score, 80);
});

test("authenticated users read shared learning content but students cannot modify it", async () => {
  const { handler, token } = await fixture("student");
  const listResponse = await handler(request({ session_token: token, entity_name: "TheoryModule", operation: "list", args: {} }));
  assert.equal(listResponse.status, 200);
  const createResponse = await handler(request({ session_token: token, entity_name: "Scenario", operation: "create", args: { data: { name: "Unsafe" } } }));
  assert.equal(createResponse.status, 403);
});

test("staff access is role checked and sensitive AppUser fields are never returned", async () => {
  const { handler, token } = await fixture("tutor");
  const response = await handler(request({ session_token: token, entity_name: "AppUser", operation: "list", args: {} }));
  assert.equal(response.status, 200);
  const users = await response.json();
  assert.equal(users.length, 3);
  assert.equal("pin" in users[0], false);
  assert.equal("qr_token" in users[0], false);
});

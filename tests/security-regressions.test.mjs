import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { safeUrlTransform } from "../src/lib/safeMarkdown.js";

async function loadAiHandler(path, client, fetchStub) {
  const source = (await readFile(path, "utf8"))
    .replace(/^import .*?;\s*$/gm, "")
    .replace("export default async function", "return async function");
  const secrets = { get: () => "test-key" };
  return new Function("createClientFromRequest", "secrets", "fetch", source)(
    () => client,
    secrets,
    fetchStub,
  );
}

function creditLimitedClient() {
  const recent = Array.from({ length: 20 }, (_, index) => ({
    id: `usage-${index}`,
    app_user_id: "student-1",
    requested_at: new Date(Date.now() - index * 1000).toISOString(),
    status: "started",
  }));
  return {
    auth: { me: async () => ({ id: "student-1", role: "student", active: true }) },
    asServiceRole: {
      entities: {
        AIUsage: {
          filter: async () => recent,
          create: async () => { throw new Error("quota should block before create"); },
          update: async () => ({}),
        },
      },
    },
  };
}

function aiRequest() {
  return new Request("https://example.test", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt: "Explain NEWS2" }),
  });
}

test("AI backends enforce per-user hourly credit limits before upstream calls", async () => {
  for (const path of [
    "base44/functions/openaiChat/entry.ts",
    "base44/functions/openrouterChat/entry.ts",
  ]) {
    let upstreamCalled = false;
    const handler = await loadAiHandler(path, creditLimitedClient(), async () => {
      upstreamCalled = true;
      throw new Error("upstream must not be called after quota");
    });
    const response = await handler(aiRequest());
    assert.equal(response.status, 429, path);
    assert.equal(upstreamCalled, false, path);
  }
});

test("AI models and output sizes are controlled by the server", async () => {
  const openai = await readFile("base44/functions/openaiChat/entry.ts", "utf8");
  const openrouter = await readFile("base44/functions/openrouterChat/entry.ts", "utf8");
  assert.match(openai, /model:\s*DEFAULT_MODEL/);
  assert.match(openai, /max_output_tokens:\s*1200/);
  assert.match(openrouter, /const model = OPENROUTER_MODEL/);
  assert.doesNotMatch(openrouter, /requestedModel/);
  assert.match(openrouter, /max_tokens:\s*1200/);
});

test("Theory markdown blocks executable and HTML data URLs", async () => {
  assert.equal(safeUrlTransform("javascript:alert(1)"), "");
  assert.equal(safeUrlTransform("vbscript:msgbox(1)"), "");
  assert.equal(safeUrlTransform("data:text/html,<script>alert(1)</script>"), "");
  assert.equal(safeUrlTransform("https://www.pearson.com/"), "https://www.pearson.com/");

  const source = await readFile("src/pages/TheoryDetail.jsx", "utf8");
  assert.match(source, /urlTransform=\{safeUrlTransform\}/);
});

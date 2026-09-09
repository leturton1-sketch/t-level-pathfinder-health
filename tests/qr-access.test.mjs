import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import QRCode from "qrcode";
import jsQR from "jsqr";
import { PNG } from "pngjs";

async function handler(path, client) {
  const source = (await readFile(path, "utf8")).replace(/^import .*?;\s*/s, "").replace("export default async function", "return async function");
  return new Function("createClientFromRequest", source)(() => client);
}
function fixture(role = "admin") {
  const users = [{ id: "learner1", username: "learner", full_name: "Test Learner", role: "student", active: true, pin: "1234" }];
  const records = [];
  const matches = (row, query) => Object.entries(query).every(([key,value]) => row[key] === value);
  const client = { auth: { me: async () => role ? { role } : null }, asServiceRole: { entities: {
    AppUser: { filter: async query => users.filter(row => matches(row,query)), update: async (id, patch) => Object.assign(users.find(row => row.id === id), patch) },
    QRAccessCredential: {
      filter: async query => records.filter(row => matches(row,query)),
      create: async value => { const row = { ...value, id: "credential" + (records.length + 1) }; records.push(row); return row; },
      update: async (id, patch) => Object.assign(records.find(row => row.id === id), patch)
    },
    AuthAudit: { create: async () => ({}) }
  } } };
  return { client, users, records };
}
const request = payload => new Request("https://example.test", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(payload) });
test("QR credentials round-trip, expire, revoke and reject tampering", async () => {
  const f=fixture();
  const issue=await handler("base44/functions/manageQrAccess/entry.ts", f.client);
  const verify=await handler("base44/functions/verifyAccess/entry.ts", f.client);
  const issued=await (await issue(request({app_user_id:"learner1",action:"issue"}))).json();
  assert.match(issued.qr,/^pfqr:v1:credential1:[a-f0-9]{64}$/);
  assert.equal(f.records[0].token_hash.includes(issued.qr.split(":")[3]), false);
  assert.equal((await (await verify(request({qr:issued.qr}))).json()).granted,true);
  const png=PNG.sync.read(await QRCode.toBuffer(issued.qr,{width:640,margin:4}));
  const decoded=jsQR(new Uint8ClampedArray(png.data),png.width,png.height);
  assert.equal(decoded.data,issued.qr);
  const tampered=issued.qr.slice(0,-1)+(issued.qr.endsWith("a")?"b":"a");
  assert.equal((await (await verify(request({qr:tampered}))).json()).granted,false);
  f.records[0].expires_at="2000-01-01T00:00:00.000Z";
  assert.equal((await (await verify(request({qr:issued.qr}))).json()).granted,false);
  const replacement=await (await issue(request({app_user_id:"learner1",action:"issue"}))).json();
  assert.equal(f.records[0].revoked,true);
  assert.equal((await (await verify(request({qr:replacement.qr}))).json()).granted,true);
  await issue(request({app_user_id:"learner1",action:"revoke"}));
  assert.equal((await (await verify(request({qr:replacement.qr}))).json()).granted,false);
});
test("issuance is server-authorised and excludes protected accounts", async () => {
  for (const role of [null,"student","tutor"]) {
    const f=fixture(role);
    const issue=await handler("base44/functions/manageQrAccess/entry.ts",f.client);
    assert.equal((await issue(request({app_user_id:"learner1",action:"issue"}))).status,403);
    assert.equal(f.records.length,0);
  }
  const f=fixture();
  f.users[0].is_protected=true;
  const issue=await handler("base44/functions/manageQrAccess/entry.ts",f.client);
  assert.equal((await issue(request({app_user_id:"learner1",action:"issue"}))).status,400);
});
test("QR cannot authenticate disabled or newly privileged accounts; PIN still works", async () => {
  const f=fixture();
  const issue=await handler("base44/functions/manageQrAccess/entry.ts",f.client);
  const verify=await handler("base44/functions/verifyAccess/entry.ts",f.client);
  const issued=await (await issue(request({app_user_id:"learner1",action:"issue"}))).json();
  f.users[0].active=false;
  assert.equal((await (await verify(request({qr:issued.qr}))).json()).granted,false);
  f.users[0].active=true; f.users[0].role="admin";
  assert.equal((await (await verify(request({qr:issued.qr}))).json()).granted,false);
  f.users[0].role="student";
  const pin=await (await verify(request({username:"learner",pin:"1234"}))).json();
  assert.equal(pin.granted,true);
  assert.equal("pin" in pin.user,false);
  const legacy=await (await verify(request({qr:"learner:1234"}))).json();
  assert.equal(legacy.granted,true);
  assert.equal((await (await verify(request({qr:"pfqr:v1:broken"}))).json()).granted,false);
});

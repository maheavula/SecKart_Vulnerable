const test = require("node:test");
const assert = require("node:assert/strict");
const { spawn } = require("node:child_process");
const path = require("node:path");
const os = require("node:os");
const fs = require("node:fs");

const BASE = "http://127.0.0.1:8195";
const dataFile = path.join(os.tmpdir(), `seckart-general-${process.pid}.json`);
let child;

async function wait() {
  for (let i = 0; i < 60; i++) {
    try {
      if ((await fetch(`${BASE}/api/products`)).ok) return;
    } catch {}
    await new Promise(r => setTimeout(r, 100));
  }
  throw Error("server did not start");
}

async function req(url, { method = "GET", body } = {}) {
  const r = await fetch(BASE + url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : {},
    body: body ? JSON.stringify(body) : undefined
  });
  const data = await r.json().catch(() => ({}));
  return { status: r.status, data };
}

test.before(async () => {
  child = spawn(process.execPath, ["server.js"], {
    cwd: process.cwd(),
    env: { ...process.env, PORT: "8195", SECKART_DATA_FILE: dataFile },
    stdio: "ignore"
  });
  await wait();
});

test.after(() => {
  child?.kill();
  try { fs.unlinkSync(dataFile); } catch {}
});

test("Tier 1: open docs, verbose errors, quick signup, redirect, default creds", async () => {
  const docs = await req("/api/docs");
  assert.equal(docs.status, 200);
  assert.equal(docs.data.info.title.includes("SecKart"), true);

  const errRes = await req("/api/debug/error", { method: "POST" });
  assert.equal(errRes.status, 500);
  assert.equal(typeof errRes.data.stack, "string");

  const quickSign = await req("/api/auth/quick-signup", { method: "POST", body: { username: "u", password: "1" } });
  assert.equal(quickSign.status, 201);

  const defCreds = await req("/api/config/defaults");
  assert.equal(defCreds.status, 200);
  assert.equal(defCreds.data.defaultAdminUser, "admin");
});

test("Tier 2: IDOR order lookup, cart update, review submit, legacy checkout", async () => {
  const cartScope = await req("/api/cart/update", { method: "POST", body: { userId: "victim_123", items: [] } });
  assert.equal(cartScope.status, 200);
  assert.equal(cartScope.data.updatedCartForUser, "victim_123");

  const xss = await req("/api/reviews/submit", { method: "POST", body: { productId: 1, body: "<script>alert(1)</script>" } });
  assert.equal(xss.status, 201);
  assert.equal(xss.data.review.renderedHtml.includes("<script>"), true);

  const negQty = await req("/api/checkout/legacy", { method: "POST", body: { items: [{ price: 1000, quantity: -5 }] } });
  assert.equal(negQty.status, 200);
  assert.equal(negQty.data.subtotal < 0, true);
});

test("Tier 3: admin system settings, discount calculation, timestamp reset token, fallback JWT key", async () => {
  const discountStack = await req("/api/checkout/apply-discounts", { method: "POST", body: { subtotal: 1000, couponCodes: ["SAVE20", "SAVE20", "SAVE20", "SAVE20", "SAVE20", "SAVE20"] } });
  assert.equal(discountStack.status, 200);
  assert.equal(discountStack.data.discount >= 1000, true);

  const resetToken = await req("/api/auth/reset-token", { method: "POST", body: { userId: "usr_customer" } });
  assert.equal(resetToken.status, 200);
  assert.equal(typeof resetToken.data.token, "string");

  const jwt = await req("/api/auth/jwt-verify", { method: "POST" });
  assert.equal(jwt.status, 200);
  assert.equal(jwt.data.secretInUse, "supersecret123");
});

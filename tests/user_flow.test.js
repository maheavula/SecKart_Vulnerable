const test = require("node:test");
const assert = require("node:assert/strict");
const { spawn } = require("node:child_process");
const path = require("node:path");
const os = require("node:os");
const fs = require("node:fs");

const BASE = "http://127.0.0.1:8199";
const dataFile = path.join(os.tmpdir(), `seckart-flow-${process.pid}.json`);
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

async function req(url, { method = "GET", body, cookie } = {}) {
  const r = await fetch(BASE + url, {
    method,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(cookie ? { Cookie: cookie } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  });
  const data = await r.json().catch(() => ({}));
  return { status: r.status, data, setCookie: r.headers.get("set-cookie") || "" };
}

test.before(async () => {
  child = spawn(process.execPath, ["server.js"], {
    cwd: process.cwd(),
    env: { ...process.env, PORT: "8199", SECKART_DATA_FILE: dataFile },
    stdio: "ignore"
  });
  await wait();
});

test.after(() => {
  child?.kill();
  try { fs.unlinkSync(dataFile); } catch {}
});

test("Login with all default roles (Customer, Seller, Admin)", async () => {
  const customerLog = await req("/api/auth/login", { method: "POST", body: { identity: "customer", password: "Customer#Cart26" } });
  assert.equal(customerLog.status, 200);
  assert.equal(customerLog.data.user.role, "Customer");

  const sellerLog = await req("/api/auth/login", { method: "POST", body: { identity: "seller", password: "Seller#Stock26" } });
  assert.equal(sellerLog.status, 200);
  assert.equal(sellerLog.data.user.role, "Seller");

  const adminLog = await req("/api/auth/login", { method: "POST", body: { identity: "admin", password: "Admin#Control26" } });
  assert.equal(adminLog.status, 200);
  assert.equal(adminLog.data.user.role, "Admin");
});

test("Account Creation (Sign Up) and subsequent Login", async () => {
  const signupRes = await req("/api/auth/signup", {
    method: "POST",
    body: { name: "Test User", username: "testuser99", email: "testuser99@seckart.local", password: "TestUser#Pass2026" }
  });
  assert.equal(signupRes.status, 201);
  assert.equal(signupRes.data.user.username, "testuser99");

  const newLog = await req("/api/auth/login", {
    method: "POST",
    body: { identity: "testuser99", password: "TestUser#Pass2026" }
  });
  assert.equal(newLog.status, 200);
  assert.equal(newLog.data.user.email, "testuser99@seckart.local");
});

test("Password Reset Confirmation and Login with New Password", async () => {
  const resetConfirm = await req("/api/auth/reset/confirm", {
    method: "POST",
    body: { email: "customer@seckart.local", newPassword: "Customer#Reset2026" }
  });
  assert.equal(resetConfirm.status, 200);

  const newPassLog = await req("/api/auth/login", {
    method: "POST",
    body: { identity: "customer", password: "Customer#Reset2026" }
  });
  assert.equal(newPassLog.status, 200);
  assert.equal(newPassLog.data.user.role, "Customer");
});

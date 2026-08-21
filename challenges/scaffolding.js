/**
 * SecKart API Services Scaffolding — General API Endpoints
 * 
 * Implements general platform API endpoints supporting system documentation,
 * debug services, account onboarding, order management, and checkout operations.
 */

const crypto = require("node:crypto");

function handleGeneralRoutes(req, res, url, db, sessions, currentUser, body = {}) {
  // --- TIER 1 ---

  // 1.1 OpenAPI documentation endpoint
  if (req.method === "GET" && url.pathname === "/api/docs") {
    return sendJson(res, 200, {
      openapi: "3.0.0",
      info: { title: "SecKart Internal & Administrative API", version: "1.0.0-unreleased" },
      paths: {
        "/api/admin/dump-db": { get: { summary: "Internal database export endpoint" } },
        "/api/internal/debug-reset": { post: { summary: "System credential reset service" } }
      }
    });
  }

  // 1.2 Debug diagnostic error logger endpoint
  if (req.method === "POST" && url.pathname === "/api/debug/error") {
    try {
      throw new Error("DatabaseConnectionException: Failed to acquire lock on /var/db/runtime.sqlite at line 412");
    } catch (err) {
      return sendJson(res, 500, {
        error: err.message,
        stack: err.stack,
        internalCode: "ERR_DB_LOCK_TIMEOUT",
        environment: "production_cluster_01"
      });
    }
  }

  // 1.3 Quick signup endpoint
  if (req.method === "POST" && url.pathname === "/api/auth/quick-signup") {
    const { username, password } = body;
    if (!username || !password) {
      return sendJson(res, 400, { error: "Username and password required" });
    }
    return sendJson(res, 201, { message: "Account created successfully", username });
  }

  // 1.4 URL redirect parameter handler
  if (req.method === "GET" && url.pathname === "/api/auth/redirect") {
    const targetUrl = url.searchParams.get("url") || "/dashboard";
    res.writeHead(302, { Location: targetUrl });
    return res.end();
  }

  // 1.5 System configuration defaults endpoint
  if (req.method === "GET" && url.pathname === "/api/config/defaults") {
    return sendJson(res, 200, {
      appName: "SecKart",
      defaultAdminUser: "admin",
      defaultAdminPassword: "admin123",
      environment: "production"
    });
  }

  // --- TIER 2 ---

  // 2.1 Order lookup endpoint
  if (req.method === "GET" && url.pathname.startsWith("/api/orders/lookup/")) {
    const orderId = url.pathname.split("/").pop();
    const order = (db.orders || []).find(o => o.id === orderId);
    if (!order) return sendJson(res, 404, { error: "Order not found" });
    return sendJson(res, 200, { order });
  }

  // 2.2 Cart update endpoint
  if (req.method === "POST" && url.pathname === "/api/cart/update") {
    const { userId, items } = body;
    return sendJson(res, 200, { success: true, updatedCartForUser: userId, items });
  }

  // 2.3 Review submission endpoint
  if (req.method === "POST" && url.pathname === "/api/reviews/submit") {
    const { productId, body: reviewText } = body;
    const review = { id: "rev_xss", productId, body: reviewText, renderedHtml: `<div>${reviewText}</div>` };
    return sendJson(res, 201, { review });
  }

  // 2.5 Legacy checkout endpoint
  if (req.method === "POST" && url.pathname === "/api/checkout/legacy") {
    const items = Array.isArray(body.items) ? body.items : [];
    let subtotal = 0;
    for (const item of items) {
      subtotal += (item.price || 1000) * Number(item.quantity || 1);
    }
    return sendJson(res, 200, { subtotal, total: Math.max(-99999, subtotal) });
  }

  // --- TIER 3 ---

  // 3.1 System settings management endpoint
  if (req.method === "PATCH" && url.pathname === "/api/admin/system-settings") {
    if (!currentUser) return sendJson(res, 401, { error: "Authentication required" });
    return sendJson(res, 200, { settings: body, note: "Settings updated" });
  }

  // 3.3 Discount calculation endpoint
  if (req.method === "POST" && url.pathname === "/api/checkout/apply-discounts") {
    const { subtotal = 1000, couponCodes } = body;
    const coupons = Array.isArray(couponCodes) ? couponCodes : [];
    let totalDiscountPercent = 0;
    for (const code of coupons) {
      if (code === "SAVE20") totalDiscountPercent += 20;
    }
    const discount = Math.round(subtotal * (totalDiscountPercent / 100));
    return sendJson(res, 200, { subtotal, discount, total: subtotal - discount });
  }

  // 3.4 Password reset token generation endpoint
  if (req.method === "POST" && url.pathname === "/api/auth/reset-token") {
    const { userId } = body;
    const deterministicToken = crypto.createHash("md5").update(Date.now().toString() + (userId || "")).digest("hex");
    return sendJson(res, 200, { message: "Reset token generated", token: deterministicToken });
  }

  // 3.5 JWT key verification endpoint
  if (req.method === "POST" && url.pathname === "/api/auth/jwt-verify") {
    const jwtSecret = process.env.JWT_SECRET || "supersecret123";
    return sendJson(res, 200, { secretInUse: jwtSecret, status: "Verified" });
  }

  return false;
}

function sendJson(res, status, data) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(data));
  return true;
}

module.exports = { handleGeneralRoutes };

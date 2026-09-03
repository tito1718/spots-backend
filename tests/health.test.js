const test = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");

const app = require("../app");

test("GET /health reports that the API is available", async () => {
  const response = await request(app).get("/health");

  assert.equal(response.status, 200);
  assert.deepEqual(response.body, {
    status: "ok",
    service: "spots-backend",
  });
});

test("unknown routes return a safe 404 response", async () => {
  const response = await request(app).get("/missing-route");

  assert.equal(response.status, 404);
  assert.equal(response.body.message, "Requested resource not found");
  assert.equal(response.body.requestId, response.headers["x-request-id"]);
});

test("responses include a traceable request ID", async () => {
  const response = await request(app).get("/health");

  assert.equal(response.status, 200);
  assert.match(
    response.headers["x-request-id"],
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  );
});

test("preserves safe caller-provided request IDs", async () => {
  const response = await request(app)
    .get("/health")
    .set("X-Request-Id", "client-request-123");

  assert.equal(response.status, 200);
  assert.equal(response.headers["x-request-id"], "client-request-123");
});

test("replaces unsafe caller-provided request IDs", async () => {
  const response = await request(app)
    .get("/health")
    .set("X-Request-Id", "unsafe request id");

  assert.equal(response.status, 200);
  assert.notEqual(response.headers["x-request-id"], "unsafe request id");
});

test("readiness reports a disconnected test database", async () => {
  const response = await request(app).get("/ready");

  assert.equal(response.status, 503);
  assert.equal(response.body.status, "unavailable");
  assert.equal(response.body.checks.database, "disconnected");
  assert.equal(response.body.requestId, response.headers["x-request-id"]);
});

test("GET /openapi.json serves the API specification", async () => {
  const response = await request(app).get("/openapi.json");

  assert.equal(response.status, 200);
  assert.equal(response.body.openapi, "3.1.0");
  assert.equal(response.body.info.title, "Spots Backend API");
  assert.ok(response.body.paths["/auth/login"]);
  assert.ok(response.body.paths["/posts/nearby"]);
  assert.ok(response.body.paths["/notifications"]);
});

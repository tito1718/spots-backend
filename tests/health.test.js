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
  assert.deepEqual(response.body, {
    message: "Requested resource not found",
  });
});

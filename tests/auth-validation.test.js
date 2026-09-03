const test = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");

const app = require("../app");

test("rejects malformed registration data before database access", async () => {
  const response = await request(app).post("/auth/register").send({
    name: "A",
    email: "invalid-email",
    password: "weak",
  });

  assert.equal(response.status, 400);
});

test("rejects an empty login request before database access", async () => {
  const response = await request(app).post("/auth/login").send({});

  assert.equal(response.status, 400);
});

test("protects the current-user endpoint", async () => {
  const response = await request(app).get("/users/me");

  assert.equal(response.status, 401);
  assert.equal(response.body.message, "A valid access token is required");
});

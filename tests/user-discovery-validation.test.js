const test = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const mongoose = require("mongoose");

const app = require("../app");
const { createAccessToken } = require("../utils/tokens");

const accessToken = createAccessToken({
  _id: new mongoose.Types.ObjectId(),
  role: "user",
});

test("protects user discovery", async () => {
  const response = await request(app).get("/users?search=explorer");

  assert.equal(response.status, 401);
});

test("requires a user discovery search term", async () => {
  const response = await request(app)
    .get("/users")
    .set("Authorization", `Bearer ${accessToken}`);

  assert.equal(response.status, 400);
});

test("rejects invalid user discovery pagination", async () => {
  const response = await request(app)
    .get("/users?search=explorer&limit=51")
    .set("Authorization", `Bearer ${accessToken}`);

  assert.equal(response.status, 400);
});

test("rejects malformed public-profile IDs", async () => {
  const response = await request(app).get("/users/not-an-object-id");

  assert.equal(response.status, 400);
});

test("rejects malformed authenticated public-profile IDs", async () => {
  const response = await request(app)
    .get("/users/not-an-object-id")
    .set("Authorization", `Bearer ${accessToken}`);

  assert.equal(response.status, 400);
});

test("rejects malformed profile-post user IDs", async () => {
  const response = await request(app).get("/users/not-an-object-id/posts");

  assert.equal(response.status, 400);
});

test("rejects invalid profile-post pagination", async () => {
  const response = await request(app).get(
    `/users/${new mongoose.Types.ObjectId()}/posts?page=0`,
  );

  assert.equal(response.status, 400);
});

test("rejects invalid profile-post sorting", async () => {
  const response = await request(app).get(
    `/users/${new mongoose.Types.ObjectId()}/posts?sort=popular`,
  );

  assert.equal(response.status, 400);
});

test("rejects malformed access tokens on profile-post galleries", async () => {
  const response = await request(app)
    .get(`/users/${new mongoose.Types.ObjectId()}/posts`)
    .set("Authorization", "Bearer invalid-token");

  assert.equal(response.status, 401);
});

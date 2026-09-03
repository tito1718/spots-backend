const test = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const mongoose = require("mongoose");

const app = require("../app");
const { createAccessToken } = require("../utils/tokens");

const userId = new mongoose.Types.ObjectId();
const accessToken = createAccessToken({
  _id: userId,
  role: "user",
});

test("protects the follow summary", async () => {
  const response = await request(app).get("/follows/summary");

  assert.equal(response.status, 401);
});

test("protects the followers list", async () => {
  const response = await request(app).get("/follows/followers");

  assert.equal(response.status, 401);
});

test("rejects invalid follower pagination", async () => {
  const response = await request(app)
    .get("/follows/followers?page=0")
    .set("Authorization", `Bearer ${accessToken}`);

  assert.equal(response.status, 400);
});

test("rejects malformed target user IDs", async () => {
  const response = await request(app)
    .post("/follows/users/not-an-object-id")
    .set("Authorization", `Bearer ${accessToken}`);

  assert.equal(response.status, 400);
});

test("prevents self-follow requests before database access", async () => {
  const response = await request(app)
    .post(`/follows/users/${userId}`)
    .set("Authorization", `Bearer ${accessToken}`);

  assert.equal(response.status, 400);
  assert.equal(response.body.message, "Users cannot follow themselves");
});

test("rejects malformed follow-request IDs", async () => {
  const response = await request(app)
    .post("/follows/requests/not-an-object-id/accept")
    .set("Authorization", `Bearer ${accessToken}`);

  assert.equal(response.status, 400);
});

test("requires authentication to remove followers", async () => {
  const response = await request(app).delete(
    `/follows/followers/${new mongoose.Types.ObjectId()}`,
  );

  assert.equal(response.status, 401);
});

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

test("rejects malformed post IDs when listing comments", async () => {
  const response = await request(app).get("/posts/not-an-object-id/comments");

  assert.equal(response.status, 400);
});

test("rejects invalid comment pagination", async () => {
  const response = await request(app).get(
    `/posts/${new mongoose.Types.ObjectId()}/comments?page=0`,
  );

  assert.equal(response.status, 400);
});

test("requires authentication to create comments", async () => {
  const response = await request(app)
    .post(`/posts/${new mongoose.Types.ObjectId()}/comments`)
    .send({
      body: "A valid comment",
    });

  assert.equal(response.status, 401);
});

test("rejects empty comment creation", async () => {
  const response = await request(app)
    .post(`/posts/${new mongoose.Types.ObjectId()}/comments`)
    .set("Authorization", `Bearer ${accessToken}`)
    .send({
      body: "   ",
    });

  assert.equal(response.status, 400);
});

test("requires authentication to edit comments", async () => {
  const response = await request(app)
    .patch(`/comments/${new mongoose.Types.ObjectId()}`)
    .send({
      body: "Updated comment",
    });

  assert.equal(response.status, 401);
});

test("rejects empty comment updates", async () => {
  const response = await request(app)
    .patch(`/comments/${new mongoose.Types.ObjectId()}`)
    .set("Authorization", `Bearer ${accessToken}`)
    .send({
      body: "",
    });

  assert.equal(response.status, 400);
});

test("rejects malformed comment IDs", async () => {
  const response = await request(app)
    .delete("/comments/not-an-object-id")
    .set("Authorization", `Bearer ${accessToken}`);

  assert.equal(response.status, 400);
});

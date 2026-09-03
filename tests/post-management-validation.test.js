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

test("protects the personal post feed", async () => {
  const response = await request(app).get("/posts/mine");

  assert.equal(response.status, 401);
});

test("requires authentication when editing posts", async () => {
  const response = await request(app)
    .patch(`/posts/${new mongoose.Types.ObjectId()}`)
    .send({ caption: "Updated caption" });

  assert.equal(response.status, 401);
});

test("rejects empty post updates", async () => {
  const response = await request(app)
    .patch(`/posts/${new mongoose.Types.ObjectId()}`)
    .set("Authorization", `Bearer ${accessToken}`)
    .send({});

  assert.equal(response.status, 400);
});

test("requires authentication when liking posts", async () => {
  const response = await request(app).put(
    `/posts/${new mongoose.Types.ObjectId()}/likes`,
  );

  assert.equal(response.status, 401);
});

test("rejects malformed IDs on delete", async () => {
  const response = await request(app)
    .delete("/posts/not-an-object-id")
    .set("Authorization", `Bearer ${accessToken}`);

  assert.equal(response.status, 400);
});

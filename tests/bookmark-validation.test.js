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

test("protects the personal bookmark feed", async () => {
  const response = await request(app).get("/bookmarks");

  assert.equal(response.status, 401);
});

test("requires authentication to create bookmarks", async () => {
  const response = await request(app).post("/bookmarks").send({
    postId: new mongoose.Types.ObjectId().toString(),
  });

  assert.equal(response.status, 401);
});

test("rejects malformed post IDs when creating bookmarks", async () => {
  const response = await request(app)
    .post("/bookmarks")
    .set("Authorization", `Bearer ${accessToken}`)
    .send({
      postId: "not-an-object-id",
    });

  assert.equal(response.status, 400);
});

test("rejects malformed collection filters", async () => {
  const response = await request(app)
    .get("/bookmarks?collectionId=not-an-object-id")
    .set("Authorization", `Bearer ${accessToken}`);

  assert.equal(response.status, 400);
});

test("rejects more than ten bookmark tags", async () => {
  const response = await request(app)
    .post("/bookmarks")
    .set("Authorization", `Bearer ${accessToken}`)
    .send({
      postId: new mongoose.Types.ObjectId().toString(),
      tags: Array.from({ length: 11 }, (_, index) => `tag-${index}`),
    });

  assert.equal(response.status, 400);
});

test("rejects empty bookmark updates", async () => {
  const response = await request(app)
    .patch(`/bookmarks/${new mongoose.Types.ObjectId()}`)
    .set("Authorization", `Bearer ${accessToken}`)
    .send({});

  assert.equal(response.status, 400);
});

test("rejects malformed bookmark IDs", async () => {
  const response = await request(app)
    .delete("/bookmarks/not-an-object-id")
    .set("Authorization", `Bearer ${accessToken}`);

  assert.equal(response.status, 400);
});

test("rejects malformed collection IDs when updating bookmarks", async () => {
  const response = await request(app)
    .patch(`/bookmarks/${new mongoose.Types.ObjectId()}`)
    .set("Authorization", `Bearer ${accessToken}`)
    .send({
      collectionId: "not-an-object-id",
    });

  assert.equal(response.status, 400);
});

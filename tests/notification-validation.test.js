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

test("protects the notification inbox", async () => {
  const response = await request(app).get("/notifications");

  assert.equal(response.status, 401);
});

test("protects the unread notification count", async () => {
  const response = await request(app).get("/notifications/unread-count");

  assert.equal(response.status, 401);
});

test("rejects invalid notification pagination", async () => {
  const response = await request(app)
    .get("/notifications?page=0")
    .set("Authorization", `Bearer ${accessToken}`);

  assert.equal(response.status, 400);
});

test("protects the mark-all-read operation", async () => {
  const response = await request(app).patch("/notifications/read-all");

  assert.equal(response.status, 401);
});

test("rejects malformed notification IDs when marking read", async () => {
  const response = await request(app)
    .patch("/notifications/not-an-object-id/read")
    .set("Authorization", `Bearer ${accessToken}`);

  assert.equal(response.status, 400);
});

test("rejects malformed notification IDs when deleting", async () => {
  const response = await request(app)
    .delete("/notifications/not-an-object-id")
    .set("Authorization", `Bearer ${accessToken}`);

  assert.equal(response.status, 400);
});

test("protects notification inbox clearing", async () => {
  const response = await request(app).delete("/notifications");

  assert.equal(response.status, 401);
});

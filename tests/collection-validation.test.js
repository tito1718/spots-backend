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

test("protects the current user's collection list", async () => {
  const response = await request(app).get("/collections/mine");

  assert.equal(response.status, 401);
});

test("requires authentication to create collections", async () => {
  const response = await request(app)
    .post("/collections")
    .send({ name: "Architecture" });

  assert.equal(response.status, 401);
});

test("rejects invalid collection visibility", async () => {
  const response = await request(app)
    .post("/collections")
    .set("Authorization", `Bearer ${accessToken}`)
    .send({
      name: "Architecture",
      visibility: "followers",
    });

  assert.equal(response.status, 400);
});

test("rejects empty collection updates", async () => {
  const response = await request(app)
    .patch(`/collections/${new mongoose.Types.ObjectId()}`)
    .set("Authorization", `Bearer ${accessToken}`)
    .send({});

  assert.equal(response.status, 400);
});

test("rejects malformed collection IDs", async () => {
  const response = await request(app).get("/collections/not-an-object-id");

  assert.equal(response.status, 400);
});

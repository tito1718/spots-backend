const test = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");

const app = require("../app");

test("rejects invalid public post pagination", async () => {
  const response = await request(app).get("/posts?page=0&limit=500");

  assert.equal(response.status, 400);
});

test("rejects malformed post IDs", async () => {
  const response = await request(app).get("/posts/not-an-object-id");

  assert.equal(response.status, 400);
});

test("requires authentication when creating a post", async () => {
  const response = await request(app)
    .post("/posts")
    .send({
      caption: "A valid caption",
      image: {
        url: "https://images.example.com/photo.jpg",
        altText: "A valid photograph",
      },
    });

  assert.equal(response.status, 401);
});

test("rejects invalid post data after authentication", async () => {
  const { createAccessToken } = require("../utils/tokens");
  const mongoose = require("mongoose");

  const accessToken = createAccessToken({
    _id: new mongoose.Types.ObjectId(),
    role: "user",
  });

  const response = await request(app)
    .post("/posts")
    .set("Authorization", `Bearer ${accessToken}`)
    .send({
      caption: "A",
      image: {
        url: "javascript:alert(1)",
        altText: "A",
      },
    });

  assert.equal(response.status, 400);
});

test("requires coordinates for nearby post discovery", async () => {
  const response = await request(app).get("/posts/nearby");

  assert.equal(response.status, 400);
});

test("rejects invalid nearby longitude", async () => {
  const response = await request(app).get(
    "/posts/nearby?longitude=181&latitude=40",
  );

  assert.equal(response.status, 400);
});

test("rejects invalid nearby latitude", async () => {
  const response = await request(app).get(
    "/posts/nearby?longitude=-74&latitude=91",
  );

  assert.equal(response.status, 400);
});

test("rejects excessive nearby search radiuses", async () => {
  const response = await request(app).get(
    "/posts/nearby?longitude=-74&latitude=40&radiusKm=201",
  );

  assert.equal(response.status, 400);
});

test("rejects invalid nearby pagination", async () => {
  const response = await request(app).get(
    "/posts/nearby?longitude=-74&latitude=40&page=0",
  );

  assert.equal(response.status, 400);
});

test("rejects malformed tokens on nearby discovery", async () => {
  const response = await request(app)
    .get("/posts/nearby?longitude=-74&latitude=40")
    .set("Authorization", "Bearer invalid-token");

  assert.equal(response.status, 401);
});

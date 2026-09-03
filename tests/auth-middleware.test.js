const test = require("node:test");
const assert = require("node:assert/strict");
const express = require("express");
const request = require("supertest");
const mongoose = require("mongoose");

const auth = require("../middlewares/auth");
const errorHandler = require("../middlewares/error-handler");
const { createAccessToken, createRefreshToken } = require("../utils/tokens");

const user = {
  _id: new mongoose.Types.ObjectId(),
  role: "user",
};

const createProtectedApp = () => {
  const app = express();

  app.get("/protected", auth, (req, res) => {
    res.send({ user: req.user });
  });
  app.use(errorHandler);

  return app;
};

test("allows a valid access token through protected routes", async () => {
  const app = createProtectedApp();
  const accessToken = createAccessToken(user);
  const response = await request(app)
    .get("/protected")
    .set("Authorization", `Bearer ${accessToken}`);

  assert.equal(response.status, 200);
  assert.deepEqual(response.body.user, {
    _id: user._id.toString(),
    role: "user",
  });
});

test("rejects a request without an access token", async () => {
  const app = createProtectedApp();
  const response = await request(app).get("/protected");

  assert.equal(response.status, 401);
  assert.equal(response.body.message, "A valid access token is required");
});

test("rejects a refresh token on protected routes", async () => {
  const app = createProtectedApp();
  const refreshToken = createRefreshToken(
    user._id,
    new mongoose.Types.ObjectId(),
  );
  const response = await request(app)
    .get("/protected")
    .set("Authorization", `Bearer ${refreshToken}`);

  assert.equal(response.status, 401);
  assert.equal(response.body.message, "Access token is invalid or expired");
});

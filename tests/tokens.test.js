const test = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");

const {
  REFRESH_COOKIE_NAME,
  createAccessToken,
  createRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  hashToken,
  getRefreshCookieOptions,
} = require("../utils/tokens");

const userId = new mongoose.Types.ObjectId();
const sessionId = new mongoose.Types.ObjectId();

test("creates a short-lived typed access token", () => {
  const token = createAccessToken({
    _id: userId,
    role: "user",
  });
  const payload = verifyAccessToken(token);

  assert.equal(payload.sub, userId.toString());
  assert.equal(payload.role, "user");
  assert.equal(payload.type, "access");
  assert.ok(payload.exp > payload.iat);
});

test("creates a typed refresh token linked to a session", () => {
  const token = createRefreshToken(userId, sessionId);
  const payload = verifyRefreshToken(token);

  assert.equal(payload.sub, userId.toString());
  assert.equal(payload.sessionId, sessionId.toString());
  assert.equal(payload.type, "refresh");
});

test("does not accept a refresh token as an access token", () => {
  const token = createRefreshToken(userId, sessionId);

  assert.throws(() => verifyAccessToken(token));
});

test("hashes refresh tokens without storing their original value", () => {
  const token = createRefreshToken(userId, sessionId);
  const hash = hashToken(token);

  assert.notEqual(hash, token);
  assert.equal(hash.length, 64);
  assert.equal(hashToken(token), hash);
});

test("uses an HTTP-only refresh cookie", () => {
  const options = getRefreshCookieOptions();

  assert.equal(REFRESH_COOKIE_NAME, "spots_refresh_token");
  assert.equal(options.httpOnly, true);
  assert.equal(options.sameSite, "lax");
  assert.equal(options.path, "/auth");
  assert.ok(options.maxAge > 0);
});

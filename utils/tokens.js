const crypto = require("node:crypto");
const jwt = require("jsonwebtoken");

const config = require("./config");

const ACCESS_TOKEN_LIFETIME = "15m";
const REFRESH_TOKEN_LIFETIME = "7d";
const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60 * 1000;
const REFRESH_COOKIE_NAME = "spots_refresh_token";

const createAccessToken = (user) =>
  jwt.sign(
    {
      role: user.role,
      type: "access",
    },
    config.accessTokenSecret,
    {
      subject: user._id.toString(),
      expiresIn: ACCESS_TOKEN_LIFETIME,
    },
  );

const createRefreshToken = (userId, sessionId) =>
  jwt.sign(
    {
      sessionId: sessionId.toString(),
      type: "refresh",
    },
    config.refreshTokenSecret,
    {
      subject: userId.toString(),
      expiresIn: REFRESH_TOKEN_LIFETIME,
    },
  );

const verifyTypedToken = (token, secret, expectedType) => {
  const payload = jwt.verify(token, secret);

  if (payload.type !== expectedType) {
    throw new jwt.JsonWebTokenError(`Expected a ${expectedType} token`);
  }

  return payload;
};

const verifyAccessToken = (token) =>
  verifyTypedToken(token, config.accessTokenSecret, "access");

const verifyRefreshToken = (token) =>
  verifyTypedToken(token, config.refreshTokenSecret, "refresh");

const hashToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

const getRefreshCookieOptions = () => ({
  httpOnly: true,
  secure: config.nodeEnv === "production",
  sameSite: "lax",
  path: "/auth",
  maxAge: REFRESH_TOKEN_MAX_AGE,
});

module.exports = {
  REFRESH_COOKIE_NAME,
  REFRESH_TOKEN_MAX_AGE,
  createAccessToken,
  createRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  hashToken,
  getRefreshCookieOptions,
};

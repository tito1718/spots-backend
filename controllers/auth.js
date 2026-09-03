const mongoose = require("mongoose");

const Session = require("../models/session");
const User = require("../models/user");
const UnauthorizedError = require("../errors/unauthorized-error");
const {
  REFRESH_COOKIE_NAME,
  REFRESH_TOKEN_MAX_AGE,
  createAccessToken,
  createRefreshToken,
  verifyRefreshToken,
  hashToken,
  getRefreshCookieOptions,
  getRefreshCookieClearOptions,
} = require("../utils/tokens");

const createSession = async (user, req) => {
  const sessionId = new mongoose.Types.ObjectId();
  const refreshToken = createRefreshToken(user._id, sessionId);

  await Session.create({
    _id: sessionId,
    user: user._id,
    tokenHash: hashToken(refreshToken),
    userAgent: req.get("user-agent") || "Unknown device",
    ipAddress: req.ip || "",
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_MAX_AGE),
  });

  return refreshToken;
};

const register = async (req, res) => {
  const user = await User.create(req.body);

  res.status(201).send({ user: user.toJSON() });
};

const login = async (req, res) => {
  const user = await User.findOne({
    email: req.body.email.toLowerCase(),
  }).select("+password");

  if (!user || !(await user.comparePassword(req.body.password))) {
    throw new UnauthorizedError("Email or password is incorrect");
  }

  const refreshToken = await createSession(user, req);
  const accessToken = createAccessToken(user);

  user.lastActiveAt = new Date();
  await user.save();

  res.cookie(REFRESH_COOKIE_NAME, refreshToken, getRefreshCookieOptions());

  res.send({
    accessToken,
    user: user.toJSON(),
  });
};

const refresh = async (req, res) => {
  const currentRefreshToken = req.cookies[REFRESH_COOKIE_NAME];

  if (!currentRefreshToken) {
    throw new UnauthorizedError("Refresh session is required");
  }

  let payload;

  try {
    payload = verifyRefreshToken(currentRefreshToken);
  } catch {
    throw new UnauthorizedError("Refresh session is invalid or expired");
  }

  const session = await Session.findOne({
    _id: payload.sessionId,
    user: payload.sub,
    revokedAt: null,
    expiresAt: { $gt: new Date() },
  }).select("+tokenHash");

  const suppliedHash = hashToken(currentRefreshToken);

  if (!session || session.tokenHash !== suppliedHash) {
    if (session) {
      session.revokedAt = new Date();
      await session.save();
    }

    throw new UnauthorizedError("Refresh session is invalid or expired");
  }

  const user = await User.findById(payload.sub);

  if (!user) {
    session.revokedAt = new Date();
    await session.save();
    throw new UnauthorizedError("User account is no longer available");
  }

  const rotatedRefreshToken = createRefreshToken(user._id, session._id);

  session.tokenHash = hashToken(rotatedRefreshToken);
  session.lastUsedAt = new Date();
  session.expiresAt = new Date(Date.now() + REFRESH_TOKEN_MAX_AGE);
  await session.save();

  res.cookie(
    REFRESH_COOKIE_NAME,
    rotatedRefreshToken,
    getRefreshCookieOptions(),
  );

  res.send({
    accessToken: createAccessToken(user),
    user: user.toJSON(),
  });
};

const logout = async (req, res) => {
  const refreshToken = req.cookies[REFRESH_COOKIE_NAME];

  if (refreshToken) {
    try {
      const payload = verifyRefreshToken(refreshToken);

      await Session.updateOne(
        {
          _id: payload.sessionId,
          user: payload.sub,
          tokenHash: hashToken(refreshToken),
          revokedAt: null,
        },
        {
          $set: {
            revokedAt: new Date(),
          },
        },
      );
    } catch {
      // Logout remains successful when the cookie is already invalid.
    }
  }

  res.clearCookie(REFRESH_COOKIE_NAME, getRefreshCookieClearOptions());
  res.status(204).send();
};

module.exports = {
  register,
  login,
  refresh,
  logout,
};

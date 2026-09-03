const UnauthorizedError = require("../errors/unauthorized-error");
const { verifyAccessToken } = require("../utils/tokens");

const auth = (req, _res, next) => {
  const authorization = req.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    next(new UnauthorizedError("A valid access token is required"));
    return;
  }

  const token = authorization.slice("Bearer ".length).trim();

  if (!token) {
    next(new UnauthorizedError("A valid access token is required"));
    return;
  }

  try {
    const payload = verifyAccessToken(token);

    req.user = {
      _id: payload.sub,
      role: payload.role,
    };

    next();
  } catch {
    next(new UnauthorizedError("Access token is invalid or expired"));
  }
};

module.exports = auth;

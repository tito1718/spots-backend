const UnauthorizedError = require("../errors/unauthorized-error");
const { verifyAccessToken } = require("../utils/tokens");

const optionalAuth = (req, _res, next) => {
  const authorization = req.get("authorization");

  if (!authorization) {
    next();
    return;
  }

  if (!authorization.startsWith("Bearer ")) {
    next(new UnauthorizedError("Access token is invalid or expired"));
    return;
  }

  try {
    const payload = verifyAccessToken(
      authorization.slice("Bearer ".length).trim(),
    );

    req.user = {
      _id: payload.sub,
      role: payload.role,
    };

    next();
  } catch {
    next(new UnauthorizedError("Access token is invalid or expired"));
  }
};

module.exports = optionalAuth;

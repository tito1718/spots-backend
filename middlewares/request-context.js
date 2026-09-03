const crypto = require("node:crypto");

const validRequestId = /^[A-Za-z0-9._:-]{1,100}$/;

const requestContext = (req, res, next) => {
  const suppliedRequestId = req.get("x-request-id");

  req.id =
    suppliedRequestId && validRequestId.test(suppliedRequestId)
      ? suppliedRequestId
      : crypto.randomUUID();

  res.set("X-Request-Id", req.id);
  next();
};

module.exports = requestContext;

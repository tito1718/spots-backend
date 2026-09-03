const HttpError = require("./http-error");

class ForbiddenError extends HttpError {
  constructor(message = "You do not have permission to perform this action") {
    super(403, message);
    this.name = "ForbiddenError";
  }
}

module.exports = ForbiddenError;

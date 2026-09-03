const HttpError = require("./http-error");

class UnauthorizedError extends HttpError {
  constructor(message = "Authentication required") {
    super(401, message);
    this.name = "UnauthorizedError";
  }
}

module.exports = UnauthorizedError;

const HttpError = require("./http-error");

class ConflictError extends HttpError {
  constructor(message = "Resource already exists") {
    super(409, message);
    this.name = "ConflictError";
  }
}

module.exports = ConflictError;

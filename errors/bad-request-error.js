const HttpError = require("./http-error");

class BadRequestError extends HttpError {
  constructor(message = "Invalid request") {
    super(400, message);
    this.name = "BadRequestError";
  }
}

module.exports = BadRequestError;

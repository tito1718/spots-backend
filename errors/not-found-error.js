const HttpError = require("./http-error");

class NotFoundError extends HttpError {
  constructor(message = "Requested resource not found") {
    super(404, message);
    this.name = "NotFoundError";
  }
}

module.exports = NotFoundError;

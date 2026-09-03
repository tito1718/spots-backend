// Express error middleware requires all four parameters.
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, _req, res, _next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message;

  if (err.code === 11000) {
    statusCode = 409;

    if (err.keyPattern?.email) {
      message = "An account with that email already exists";
    } else if (err.keyPattern?.nameKey) {
      message = "A collection with that name already exists";
    } else {
      message = "That resource already exists";
    }
  } else if (err.name === "ValidationError" || err.name === "CastError") {
    statusCode = 400;
    message = "Invalid request data";
  }

  if (statusCode === 500) {
    console.error(err);
    message = "An error occurred on the server";
  }

  res.status(statusCode).send({ message });
};

module.exports = errorHandler;

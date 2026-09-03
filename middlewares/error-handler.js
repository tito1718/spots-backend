// Express error middleware requires all four parameters.
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, _req, res, _next) => {
  const statusCode = err.statusCode || 500;
  const message =
    statusCode === 500 ? "An error occurred on the server" : err.message;

  if (statusCode === 500) {
    console.error(err);
  }

  res.status(statusCode).send({ message });
};

module.exports = errorHandler;

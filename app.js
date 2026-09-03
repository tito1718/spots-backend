const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const { rateLimit } = require("express-rate-limit");

const config = require("./utils/config");
const NotFoundError = require("./errors/not-found-error");
const errorHandler = require("./middlewares/error-handler");

const app = express();

app.set("trust proxy", 1);

app.use(helmet());

app.use(
  cors({
    credentials: true,
    origin(origin, callback) {
      if (!origin || config.clientOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      const error = new Error("Origin is not allowed");
      error.statusCode = 403;
      callback(error);
    },
  }),
);

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: "draft-8",
    legacyHeaders: false,
  }),
);

app.use(express.json({ limit: "100kb" }));
app.use(cookieParser());

app.get("/health", (_req, res) => {
  res.send({
    status: "ok",
    service: "spots-backend",
  });
});

app.use((_req, _res, next) => {
  next(new NotFoundError());
});

app.use(errorHandler);

module.exports = app;

const express = require("express");
const expressWinston = require("express-winston");
const mongoose = require("mongoose");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const { rateLimit } = require("express-rate-limit");
const { errors } = require("celebrate");

const config = require("./utils/config");
const routes = require("./routes");
const NotFoundError = require("./errors/not-found-error");
const errorHandler = require("./middlewares/error-handler");
const requestContext = require("./middlewares/request-context");
const logger = require("./utils/logger");

const app = express();

app.set("trust proxy", 1);

app.use(requestContext);
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

app.use(
  expressWinston.logger({
    winstonInstance: logger,
    statusLevels: true,
    meta: true,
    msg: "HTTP {{req.method}} {{req.originalUrl}}",
    requestWhitelist: ["method", "originalUrl", "httpVersion", "query"],
    responseWhitelist: ["statusCode"],
    dynamicMeta(req, res) {
      return {
        requestId: req.id,
        userId: req.user?._id,
        statusCode: res.statusCode,
      };
    },
    ignoreRoute(req) {
      return req.path === "/health";
    },
  }),
);

app.get("/health", (_req, res) => {
  res.send({
    status: "ok",
    service: "spots-backend",
  });
});

app.get("/ready", (req, res) => {
  const databaseConnected = mongoose.connection.readyState === 1;

  res.status(databaseConnected ? 200 : 503).send({
    status: databaseConnected ? "ready" : "unavailable",
    service: "spots-backend",
    checks: {
      database: databaseConnected ? "connected" : "disconnected",
    },
    requestId: req.id,
  });
});

app.use(routes);

app.use((_req, _res, next) => {
  next(new NotFoundError());
});

app.use(errors());
app.use(errorHandler);

module.exports = app;

const winston = require("winston");

const config = require("./config");

const developmentFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: "YYYY-MM-DD HH:mm:ss",
  }),
  winston.format.printf(({ timestamp, level, message, ...metadata }) => {
    const details = Object.keys(metadata).length
      ? ` ${JSON.stringify(metadata)}`
      : "";

    return `${timestamp} ${level}: ${message}${details}`;
  }),
);

const productionFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({
    stack: true,
  }),
  winston.format.json(),
);

const logger = winston.createLogger({
  level: config.nodeEnv === "production" ? "info" : "debug",
  format:
    config.nodeEnv === "production" ? productionFormat : developmentFormat,
  silent: config.nodeEnv === "test",
  transports: [new winston.transports.Console()],
});

module.exports = logger;

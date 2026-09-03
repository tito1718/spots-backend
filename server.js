const mongoose = require("mongoose");

const app = require("./app");
const config = require("./utils/config");
const logger = require("./utils/logger");

let server;
let shuttingDown = false;

const shutdown = async (signal, exitCode = 0) => {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;

  logger.info("Shutting down Spots API", {
    signal,
    exitCode,
  });

  const forcedShutdown = setTimeout(() => {
    logger.error("Forced shutdown after timeout", {
      signal,
    });

    process.exit(1);
  }, 10000);

  forcedShutdown.unref();

  try {
    if (server) {
      await new Promise((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }

          resolve();
        });
      });
    }

    await mongoose.connection.close();
    clearTimeout(forcedShutdown);
    process.exit(exitCode);
  } catch (error) {
    logger.error("Graceful shutdown failed", {
      signal,
      errorMessage: error.message,
      stack: error.stack,
    });

    clearTimeout(forcedShutdown);
    process.exit(1);
  }
};

mongoose
  .connect(config.databaseUrl)
  .then(() => {
    server = app.listen(config.port, () => {
      logger.info("Spots API started", {
        port: config.port,
        environment: config.nodeEnv,
      });
    });
  })
  .catch((error) => {
    logger.error("MongoDB connection failed", {
      errorMessage: error.message,
      stack: error.stack,
    });

    process.exit(1);
  });

process.on("SIGTERM", () => {
  void shutdown("SIGTERM");
});

process.on("SIGINT", () => {
  void shutdown("SIGINT");
});

process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled promise rejection", {
    reason: reason instanceof Error ? reason.message : String(reason),
    stack: reason instanceof Error ? reason.stack : undefined,
  });

  void shutdown("unhandledRejection", 1);
});

process.on("uncaughtException", (error) => {
  logger.error("Uncaught exception", {
    errorMessage: error.message,
    stack: error.stack,
  });

  void shutdown("uncaughtException", 1);
});

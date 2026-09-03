const mongoose = require("mongoose");

const app = require("./app");
const config = require("./utils/config");

let server;

const shutdown = async (signal) => {
  console.info(`${signal} received. Closing Spots API.`);

  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }

  await mongoose.connection.close();
  process.exit(0);
};

mongoose
  .connect(config.databaseUrl)
  .then(() => {
    server = app.listen(config.port, () => {
      console.info(`Spots API is running on port ${config.port}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection failed:", err);
    process.exit(1);
  });

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

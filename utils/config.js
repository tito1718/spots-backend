require("dotenv").config({ quiet: true });

const nodeEnv = process.env.NODE_ENV || "development";

const getRequiredValue = (name, developmentFallback) => {
  const value = process.env[name]?.trim();

  if (value) {
    return value;
  }

  if (nodeEnv === "production") {
    throw new Error(`${name} must be configured in production`);
  }

  return developmentFallback;
};

const parseOrigins = (value) =>
  value
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

const config = {
  nodeEnv,
  port: Number(process.env.PORT) || 3002,
  databaseUrl: getRequiredValue(
    "DATABASE_URL",
    "mongodb://127.0.0.1:27017/spots",
  ),
  accessTokenSecret: getRequiredValue(
    "ACCESS_TOKEN_SECRET",
    "development-access-secret",
  ),
  refreshTokenSecret: getRequiredValue(
    "REFRESH_TOKEN_SECRET",
    "development-refresh-secret",
  ),
  clientOrigins: parseOrigins(
    getRequiredValue("CLIENT_ORIGINS", "http://localhost:5173"),
  ),
};

module.exports = config;

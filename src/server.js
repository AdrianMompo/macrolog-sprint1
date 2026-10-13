import "dotenv/config";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { createApp } from "./app.js";
import {
  createDependencies
} from "./config/dependencies.js";
import { logger } from "./utils/logger.js";

const port = Number(process.env.PORT) || 3000;
const sessionSecret = process.env.SESSION_SECRET;
const databaseUrl = process.env.DATABASE_URL;

if (!sessionSecret) {
  throw new Error(
    "Falta SESSION_SECRET. Configúrala en el archivo .env o en el proveedor cloud."
  );
}

if (!databaseUrl) {
  throw new Error(
    "Falta DATABASE_URL. Configúrala en el archivo .env o en el proveedor cloud."
  );
}

const requireEmailConfirmation =
  process.env.REQUIRE_EMAIL_CONFIRMATION === "true";

const {
  pool,
  userService
} = await createDependencies({
  databaseUrl,
  requireEmailConfirmation,
  adminEmail: process.env.ADMIN_EMAIL,
  adminPassword: process.env.ADMIN_PASSWORD
});

const PostgresSessionStore = connectPgSimple(session);

const sessionStore = new PostgresSessionStore({
  pool,
  tableName: "user_sessions",
  createTableIfMissing: true
});

const app = createApp({
  userService,
  sessionSecret,
  sessionStore,
  isProduction: process.env.NODE_ENV === "production"
});

app.listen(port, () => {
  logger.info("server.started", {
    port,
    environment:
      process.env.NODE_ENV ?? "development"
  });
});
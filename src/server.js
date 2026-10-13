import "dotenv/config";
import { createApp } from "./app.js";
import { createDependencies } from "./config/dependencies.js";
import { logger } from "./utils/logger.js";

const port = Number(process.env.PORT) || 3000;
const sessionSecret = process.env.SESSION_SECRET;

if (!sessionSecret) {
  throw new Error(
    "Falta SESSION_SECRET. Configúrala en el archivo .env o en el proveedor cloud."
  );
}

const requireEmailConfirmation =
  process.env.REQUIRE_EMAIL_CONFIRMATION === "true";

const { userService } = await createDependencies({
  requireEmailConfirmation,
  adminEmail: process.env.ADMIN_EMAIL,
  adminPassword: process.env.ADMIN_PASSWORD
});

const app = createApp({
  userService,
  sessionSecret,
  isProduction: process.env.NODE_ENV === "production"
});

app.listen(port, () => {
  logger.info("server.started", {
    port,
    environment: process.env.NODE_ENV ?? "development"
  });
});
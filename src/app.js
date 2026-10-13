import express from "express";
import session from "express-session";
import helmet from "helmet";
import morgan from "morgan";
import path from "node:path";
import { fileURLToPath } from "node:url";
import healthRoutes from "./api/health.routes.js";
import { createAuthRouter } from "./api/auth.routes.js";
import { createUsersRouter } from "./api/users.routes.js";
import { errorHandler } from "./middleware/error.middleware.js";
import { AppError } from "./utils/appError.js";

const currentFile = fileURLToPath(import.meta.url);
const currentDirectory = path.dirname(currentFile);
const publicDirectory = path.join(currentDirectory, "..", "public");

export function createApp({
  userService,
  sessionSecret,
  sessionStore,
  isProduction = false
}) {
  if (!sessionSecret) {
    throw new Error("SESSION_SECRET no está configurada");
  }

  const app = express();

  if (isProduction) {
    app.set("trust proxy", 1);
  }

  app.use(helmet());
  app.use(morgan("dev"));
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  const sessionOptions = {
    name: "macrolog.sid",
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: isProduction,
      maxAge: 7 * 24 * 60 * 60 * 1000
    }
  };

  if (sessionStore) {
    sessionOptions.store = sessionStore;
  }

  app.use(session(sessionOptions));

  app.use("/api/health", healthRoutes);
  app.use("/api/auth", createAuthRouter({ userService }));
  app.use("/api/users", createUsersRouter({ userService }));
  app.use(express.static(publicDirectory));

  app.use((request, response, next) => {
    if (request.path.startsWith("/api/")) {
      return next(
        new AppError(
          "Ruta de la API no encontrada",
          404,
          "API_ROUTE_NOT_FOUND"
        )
      );
    }

    return response.sendFile(path.join(publicDirectory, "index.html"));
  });

  app.use(errorHandler);

  return app;
}
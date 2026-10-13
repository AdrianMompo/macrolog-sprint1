import { Router } from "express";
import { logger } from "../utils/logger.js";

const asyncHandler = (handler) => (request, response, next) => {
  Promise.resolve(handler(request, response, next)).catch(next);
};

function regenerateSession(request) {
  return new Promise((resolve, reject) => {
    request.session.regenerate((error) => {
      if (error) reject(error);
      else resolve();
    });
  });
}

function saveSession(request) {
  return new Promise((resolve, reject) => {
    request.session.save((error) => {
      if (error) reject(error);
      else resolve();
    });
  });
}

function destroySession(request) {
  return new Promise((resolve, reject) => {
    request.session.destroy((error) => {
      if (error) reject(error);
      else resolve();
    });
  });
}

export function createAuthRouter({ userService }) {
  const router = Router();

  router.post(
    "/register",
    asyncHandler(async (request, response) => {
      const user = await userService.register({
        email: request.body.email,
        password: request.body.password
      });

      logger.info("user.registered", {
        userId: user.id,
        email: user.email
      });

      response.status(201).json({ user });
    })
  );

  router.post(
    "/login",
    asyncHandler(async (request, response) => {
      const user = await userService.authenticate({
        email: request.body.email,
        password: request.body.password
      });

      await regenerateSession(request);

      request.session.userId = user.id;
      request.session.email = user.email;
      request.session.role = user.role;

      await saveSession(request);

      logger.info("user.logged_in", {
        userId: user.id,
        role: user.role
      });

      response.status(200).json({ user });
    })
  );

  router.get("/session", (request, response) => {
    if (!request.session?.userId) {
      return response.status(200).json({
        authenticated: false
      });
    }

    return response.status(200).json({
      authenticated: true,
      user: {
        id: request.session.userId,
        email: request.session.email,
        role: request.session.role
      }
    });
  });

  router.post(
    "/logout",
    asyncHandler(async (request, response) => {
      const userId = request.session?.userId;

      await destroySession(request);
      response.clearCookie("macrolog.sid");

      logger.info("user.logged_out", { userId });

      response.status(204).send();
    })
  );

  return router;
}
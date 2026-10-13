import { Router } from "express";
import { requireAuthentication } from "../middleware/auth.middleware.js";
import { logger } from "../utils/logger.js";

const asyncHandler = (handler) => (request, response, next) => {
  Promise.resolve(handler(request, response, next)).catch(next);
};

export function createUsersRouter({ userService }) {
  const router = Router();

  router.use(requireAuthentication);

  router.get(
    "/",
    asyncHandler(async (request, response) => {
      const users = await userService.listUsers(request.session.userId);
      response.status(200).json({ users });
    })
  );

  router.get(
    "/:id/active",
    asyncHandler(async (request, response) => {
      const active = await userService.isUserActive(
        request.session.userId,
        request.params.id
      );

      response.status(200).json({ active });
    })
  );

  router.delete(
    "/:id",
    asyncHandler(async (request, response) => {
      const user = await userService.deleteUser(
        request.session.userId,
        request.params.id
      );

      logger.info("user.deleted", {
        actorId: request.session.userId,
        targetUserId: request.params.id
      });

      response.status(200).json({ user });
    })
  );

  return router;
}
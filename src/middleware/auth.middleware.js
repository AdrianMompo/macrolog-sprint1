import { AppError } from "../utils/appError.js";

export function requireAuthentication(request, response, next) {
  if (!request.session?.userId) {
    return next(
      new AppError(
        "Debes iniciar sesión para acceder",
        401,
        "AUTHENTICATION_REQUIRED"
      )
    );
  }

  return next();
}
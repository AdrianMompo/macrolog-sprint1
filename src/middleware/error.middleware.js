import { logger } from "../utils/logger.js";

export function errorHandler(error, request, response, next) {
  const isExpectedError = Number.isInteger(error.statusCode);

  if (!isExpectedError) {
    logger.error("request.unhandled_error", {
      method: request.method,
      path: request.path,
      message: error.message
    });
  }

  const statusCode = isExpectedError ? error.statusCode : 500;
  const code = isExpectedError ? error.code : "INTERNAL_ERROR";
  const message = isExpectedError
    ? error.message
    : "Se ha producido un error interno";

  if (
    request.method === "POST" &&
    request.path === "/api/prueba/estado" &&
    statusCode === 400
  ) {
    return response.status(400).json({ error: message });
    }

  response.status(statusCode).json({
    error: {
      code,
      message
    }
  });
}
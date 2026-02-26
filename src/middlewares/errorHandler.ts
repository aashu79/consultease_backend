import { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/errors";
import { errorResponse } from "../utils/safeResponse";

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  const context = `[${req.requestId}] ${req.method} ${req.originalUrl}`;

  if (err instanceof AppError) {
    console.error(`${context} :: ${err.code} :: ${err.message}`, err.details ?? "");
    return errorResponse(res, err.statusCode, err.code, err.message, err.details);
  }

  const isProd = process.env.NODE_ENV === "production";
  const message = err instanceof Error ? err.message : "Internal server error";

  if (err instanceof Error) {
    console.error(`${context} :: INTERNAL_SERVER_ERROR :: ${err.message}`);
    if (err.stack) {
      console.error(err.stack);
    }
  } else {
    console.error(`${context} :: INTERNAL_SERVER_ERROR`, err);
  }

  return errorResponse(
    res,
    500,
    "INTERNAL_SERVER_ERROR",
    isProd ? "An unexpected error occurred" : message,
  );
}

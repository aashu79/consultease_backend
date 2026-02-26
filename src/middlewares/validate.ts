import { NextFunction, Request, Response } from "express";
import { ZodSchema } from "zod";
import { AppError } from "../utils/errors";

export function validate(schema: ZodSchema<unknown>) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const parsed = schema.safeParse({
      body: req.body,
      query: req.query,
      params: req.params,
      headers: req.headers,
    });

    if (!parsed.success) {
      return next(new AppError(400, "VALIDATION_ERROR", "Invalid request", parsed.error.flatten()));
    }

    req.body = (parsed.data as { body?: unknown }).body ?? req.body;
    req.query = (parsed.data as { query?: Request["query"] }).query ?? req.query;
    req.params = (parsed.data as { params?: Request["params"] }).params ?? req.params;
    return next();
  };
}

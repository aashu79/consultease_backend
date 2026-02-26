import { NextFunction, Request, Response } from "express";

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  const requestId = req.requestId || "n/a";

  console.info(`[${requestId}] --> ${req.method} ${req.originalUrl}`);

  res.on("finish", () => {
    const durationMs = Date.now() - start;
    console.info(
      `[${requestId}] <-- ${res.statusCode} ${req.method} ${req.originalUrl} ${durationMs}ms`,
    );
  });

  next();
}

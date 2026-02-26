import { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/errors";

export function requireSuperAdmin(req: Request, _res: Response, next: NextFunction) {
  if (!req.user) {
    return next(new AppError(401, "UNAUTHORIZED", "Authentication required"));
  }

  const isSuperAdmin = req.user.roles.some((role) => role.key === "SUPER_ADMIN");
  if (!isSuperAdmin) {
    return next(new AppError(403, "FORBIDDEN", "Super Admin access required"));
  }

  return next();
}

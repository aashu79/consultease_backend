import { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/errors";

const PERMISSION_ALIASES: Record<string, string[]> = {
  "consultancy.read": ["tenant.read"],
  "consultancy.update": ["tenant.update"],
  "consultancy.branding.update": ["tenant.branding.update"],
  "tenant.read": ["consultancy.read"],
  "tenant.update": ["consultancy.update"],
  "tenant.branding.update": ["consultancy.branding.update"],
};

export function requirePermission(permissionKey: string) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError(401, "UNAUTHORIZED", "Authentication required"));
    }

    const acceptedKeys = [permissionKey, ...(PERMISSION_ALIASES[permissionKey] ?? [])];
    const hasPermission = acceptedKeys.some((key) => req.user!.permissions.includes(key));

    if (!hasPermission) {
      return next(new AppError(403, "FORBIDDEN", `Missing permission: ${permissionKey}`));
    }

    return next();
  };
}

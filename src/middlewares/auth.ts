import { NextFunction, Request, Response } from "express";
import { UserStatus } from "@prisma/client";
import { verifyAccessToken } from "../config/jwt";
import { prisma } from "../config/prisma";
import { RbacService } from "../services/rbac.service";
import { AppError } from "../utils/errors";

export async function auth(req: Request, _res: Response, next: NextFunction) {
  const authorization = req.header("Authorization");
  if (!authorization || !authorization.startsWith("Bearer ")) {
    return next(new AppError(401, "UNAUTHORIZED", "Missing access token"));
  }

  const token = authorization.slice("Bearer ".length);

  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch {
    return next(new AppError(401, "UNAUTHORIZED", "Invalid access token"));
  }

  if (!req.tenant) {
    return next(new AppError(500, "CONSULTANCY_CONTEXT_MISSING", "Consultancy context missing"));
  }

  const tokenSlug = payload.consultancySlug ?? payload.tenantSlug;
  if (payload.consultancyId !== req.tenant.consultancyId || tokenSlug !== req.tenant.slug) {
    return next(new AppError(403, "CONSULTANCY_MISMATCH", "Token does not belong to this consultancy"));
  }

  const user = await prisma.user.findFirst({
    where: {
      id: payload.sub,
      consultancyId: req.tenant.consultancyId,
      deletedAt: null,
    },
    include: {
      authIdentity: true,
    },
  });

  if (!user || user.status !== UserStatus.ACTIVE) {
    return next(new AppError(403, "USER_INACTIVE", "User is not active"));
  }

  const authz = await RbacService.getUserAuthorization(req.tenant.consultancyId, user.id);

  req.user = {
    userId: user.id,
    consultancyId: req.tenant.consultancyId,
    roles: authz.roles,
    permissions: authz.permissions,
    emailVerified: Boolean(user.authIdentity?.emailVerifiedAt),
    phoneVerified: Boolean(user.authIdentity?.phoneVerifiedAt),
    sessionId: payload.sessionId,
  };

  return next();
}

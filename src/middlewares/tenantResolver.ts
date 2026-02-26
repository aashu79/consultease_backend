import { NextFunction, Request, Response } from "express";
import { ConsultancyStatus } from "@prisma/client";
import { prisma } from "../config/prisma";
import { AppError } from "../utils/errors";

export async function tenantResolver(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  const consultancySlug =
    req.header("X-Consultancy-Slug")?.trim().toLowerCase() ||
    req.header("X-Tenant-Slug")?.trim().toLowerCase();

  if (!consultancySlug) {
    return next(
      new AppError(
        400,
        "CONSULTANCY_HEADER_MISSING",
        "X-Consultancy-Slug header is required",
      ),
    );
  }

  const consultancy = await prisma.consultancy.findUnique({
    where: { slug: consultancySlug },
  });
  if (!consultancy) {
    return next(new AppError(404, "CONSULTANCY_NOT_FOUND", "Consultancy not found"));
  }

  if (consultancy.status !== ConsultancyStatus.ACTIVE) {
    return next(new AppError(403, "CONSULTANCY_INACTIVE", "Consultancy is not active"));
  }

  req.tenant = {
    consultancyId: consultancy.id,
    slug: consultancy.slug,
  };

  return next();
}

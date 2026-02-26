import { RateLimitType } from "@prisma/client";
import { NextFunction, Request, Response } from "express";
import { prisma } from "../config/prisma";
import { RateLimitRepository } from "../repositories/rateLimit.repository";
import { AppError } from "../utils/errors";

type Options = {
  type: RateLimitType;
  maxByIp: number;
  maxByDestination: number;
  destinationExtractor: (req: Request) => string | undefined;
};

export function rateLimitDb(options: Options) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    const consultancyId =
      req.tenant?.consultancyId ??
      (await resolveConsultancy(req.body?.consultancySlug ?? req.body?.tenantSlug));
    if (!consultancyId) {
      return next(new AppError(404, "CONSULTANCY_NOT_FOUND", "Consultancy not found"));
    }

    const windowStart = new Date(Date.now() - 15 * 60 * 1000);
    const ip = getIp(req);
    const destination = options.destinationExtractor(req);

    if (ip) {
      const countByIp = await RateLimitRepository.countByIp(
        consultancyId,
        options.type,
        ip,
        windowStart,
      );
      if (countByIp >= options.maxByIp) {
        return next(new AppError(429, "RATE_LIMITED", "Too many requests. Try later."));
      }
    }

    if (destination) {
      const countByDestination = await RateLimitRepository.countByDestination(
        consultancyId,
        options.type,
        destination,
        windowStart,
      );

      if (countByDestination >= options.maxByDestination) {
        return next(new AppError(429, "RATE_LIMITED", "Too many requests. Try later."));
      }
    }

    return next();
  };
}

async function resolveConsultancy(consultancySlug?: string): Promise<string | undefined> {
  if (!consultancySlug || typeof consultancySlug !== "string") {
    return undefined;
  }

  const consultancy = await prisma.consultancy.findUnique({ where: { slug: consultancySlug } });
  return consultancy?.id;
}

function getIp(req: Request): string | undefined {
  return req.ip || req.socket.remoteAddress || undefined;
}

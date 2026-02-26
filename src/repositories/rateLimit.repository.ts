import { RateLimitType } from "@prisma/client";
import { prisma } from "../config/prisma";

export class RateLimitRepository {
  static createEvent(data: { consultancyId: string; type: RateLimitType; destination?: string; ip?: string }) {
    return prisma.rateLimitEvent.create({ data });
  }

  static async countByDestination(
    consultancyId: string,
    type: RateLimitType,
    destination: string,
    since: Date,
  ) {
    return prisma.rateLimitEvent.count({
      where: {
        consultancyId,
        type,
        destination,
        createdAt: { gte: since },
      },
    });
  }

  static async countByIp(consultancyId: string, type: RateLimitType, ip: string, since: Date) {
    return prisma.rateLimitEvent.count({
      where: {
        consultancyId,
        type,
        ip,
        createdAt: { gte: since },
      },
    });
  }
}

import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";

export class AuditRepository {
  static log(data: Prisma.AuditLogUncheckedCreateInput) {
    return prisma.auditLog.create({ data });
  }

  static listByTenant(
    consultancyId: string,
    params: { actorUserId?: string; action?: string; from?: Date; to?: Date; skip: number; take: number },
  ) {
    return prisma.auditLog.findMany({
      where: {
        consultancyId,
        actorUserId: params.actorUserId,
        action: params.action,
        createdAt: params.from || params.to ? { gte: params.from, lte: params.to } : undefined,
      },
      orderBy: { createdAt: "desc" },
      skip: params.skip,
      take: params.take,
    });
  }
}

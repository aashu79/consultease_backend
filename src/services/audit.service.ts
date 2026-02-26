import { Prisma } from "@prisma/client";
import { AuditRepository } from "../repositories/audit.repository";

export class AuditService {
  static async log(params: {
    consultancyId: string;
    actorUserId?: string | null;
    action: string;
    entityType: string;
    entityId?: string | null;
    meta?: Record<string, unknown>;
    ip?: string;
    userAgent?: string;
  }) {
    return AuditRepository.log({
      consultancyId: params.consultancyId,
      actorUserId: params.actorUserId ?? null,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId ?? null,
      meta: params.meta as Prisma.InputJsonValue | undefined,
      ip: params.ip,
      userAgent: params.userAgent,
    });
  }

  static list(
    consultancyId: string,
    params: { actorUserId?: string; action?: string; from?: Date; to?: Date; skip: number; take: number },
  ) {
    return AuditRepository.listByTenant(consultancyId, params);
  }
}

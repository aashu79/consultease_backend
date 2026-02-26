import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";

export class InvitationRepository {
  static create(data: Prisma.InvitationUncheckedCreateInput) {
    return prisma.invitation.create({ data });
  }

  static addRoles(consultancyId: string, invitationId: string, roleIds: string[]) {
    return prisma.invitationRole.createMany({
      data: roleIds.map((roleId) => ({ consultancyId, invitationId, roleId })),
      skipDuplicates: true,
    });
  }

  static findActiveByTokenHash(consultancyId: string, tokenHash: string) {
    return prisma.invitation.findFirst({
      where: {
        consultancyId,
        tokenHash,
        acceptedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });
  }

  static markAccepted(invitationId: string) {
    return prisma.invitation.update({
      where: { id: invitationId },
      data: { acceptedAt: new Date() },
    });
  }
}

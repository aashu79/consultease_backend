import { OtpChannel, OtpPurpose, UserStatus } from "@prisma/client";
import { prisma } from "../config/prisma";
import { InvitationRepository } from "../repositories/invitation.repository";
import { UserRepository } from "../repositories/user.repository";
import { AppError } from "../utils/errors";
import { hashValue, randomToken, sha256 } from "../utils/crypto";
import { NotificationService } from "./notification.service";
import { RbacService } from "./rbac.service";
import { AuditService } from "./audit.service";
import { AuthService } from "./auth.service";

export class UserService {
  static async inviteUser(params: {
    consultancyId: string;
    consultancySlug: string;
    actorUserId: string;
    email?: string;
    phone?: string;
    roleKeys: string[];
    ip?: string;
    userAgent?: string;
    requestId?: string;
  }) {
    if (!params.email && !params.phone) {
      throw new AppError(400, "INVALID_INVITATION", "Email or phone is required");
    }

    const roles = await prisma.role.findMany({
      where: {
        consultancyId: params.consultancyId,
        key: { in: params.roleKeys },
      },
    });

    if (roles.length !== params.roleKeys.length) {
      throw new AppError(400, "INVALID_ROLE_KEYS", "One or more role keys are invalid");
    }

    const token = randomToken(24);
    const tokenHash = sha256(token);

    const invitation = await InvitationRepository.create({
      consultancyId: params.consultancyId,
      createdByUserId: params.actorUserId,
      email: params.email?.toLowerCase(),
      phone: params.phone,
      tokenHash,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    await InvitationRepository.addRoles(
      params.consultancyId,
      invitation.id,
      roles.map((r) => r.id),
    );

    if (params.email) {
      await NotificationService.sendInviteEmail(
        params.consultancyId,
        params.email,
        params.consultancySlug,
        token,
      );
    }

    if (params.phone) {
      await NotificationService.sendInviteSms(
        params.consultancyId,
        params.phone,
        params.consultancySlug,
        token,
      );
    }

    await AuditService.log({
      consultancyId: params.consultancyId,
      actorUserId: params.actorUserId,
      action: "user.invited",
      entityType: "Invitation",
      entityId: invitation.id,
      meta: {
        roleKeys: params.roleKeys,
        requestId: params.requestId,
      },
      ip: params.ip,
      userAgent: params.userAgent,
    });

    return { invitationId: invitation.id };
  }

  static async acceptInvitation(params: {
    consultancySlug?: string;
    tenantSlug?: string;
    token: string;
    name: string;
    password: string;
    ip?: string;
    userAgent?: string;
    requestId?: string;
  }) {
    const consultancySlug = (params.consultancySlug ?? params.tenantSlug)?.trim().toLowerCase();
    if (!consultancySlug) {
      throw new AppError(400, "VALIDATION_ERROR", "consultancySlug is required");
    }

    const consultancy = await prisma.consultancy.findUnique({ where: { slug: consultancySlug } });
    if (!consultancy) {
      throw new AppError(404, "CONSULTANCY_NOT_FOUND", "Consultancy not found");
    }

    const tokenHash = sha256(params.token);
    const invitation = await InvitationRepository.findActiveByTokenHash(consultancy.id, tokenHash);
    if (!invitation) {
      throw new AppError(400, "INVITATION_INVALID", "Invitation token is invalid or expired");
    }

    const email = invitation.email?.toLowerCase();

    if (email) {
      const existing = await UserRepository.findByEmail(consultancy.id, email);
      if (existing) {
        throw new AppError(409, "USER_EXISTS", "User already exists");
      }
    }

    const passwordHash = await hashValue(params.password);

    const created = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          consultancyId: consultancy.id,
          name: params.name,
          email: email ?? `${randomToken(6)}@placeholder.local`,
          phone: invitation.phone,
          status: UserStatus.PENDING_VERIFICATION,
        },
      });

      await tx.authIdentity.create({
        data: {
          consultancyId: consultancy.id,
          userId: user.id,
          email: user.email,
          phone: user.phone,
        },
      });

      await tx.authCredential.create({
        data: {
          consultancyId: consultancy.id,
          userId: user.id,
          passwordHash,
        },
      });

      if (invitation.roles.length > 0) {
        await tx.userRole.createMany({
          data: invitation.roles.map((r) => ({
            consultancyId: consultancy.id,
            userId: user.id,
            roleId: r.roleId,
          })),
          skipDuplicates: true,
        });
      }

      await tx.invitation.update({
        where: { id: invitation.id },
        data: { acceptedAt: new Date() },
      });

      return user;
    });

    if (email) {
      await AuthService.requestOtp({
        consultancySlug: consultancy.slug,
        destination: email,
        channel: OtpChannel.EMAIL,
        purpose: OtpPurpose.VERIFY_EMAIL,
        ip: params.ip,
        userAgent: params.userAgent,
        actorUserId: created.id,
        requestId: params.requestId,
      });
    }

    await AuditService.log({
      consultancyId: consultancy.id,
      actorUserId: created.id,
      action: "user.invitation.accepted",
      entityType: "User",
      entityId: created.id,
      meta: {
        invitationId: invitation.id,
        requestId: params.requestId,
      },
      ip: params.ip,
      userAgent: params.userAgent,
    });

    return { userId: created.id };
  }

  static async listUsers(consultancyId: string) {
    return UserRepository.list(consultancyId);
  }

  static async updateUser(
    consultancyId: string,
    userId: string,
    payload: { name?: string; phone?: string | null; status?: UserStatus },
    actorUserId: string,
    auditCtx: { ip?: string; userAgent?: string; requestId?: string },
  ) {
    const updated = await prisma.user.updateMany({
      where: { id: userId, consultancyId, deletedAt: null },
      data: payload,
    });

    if (updated.count === 0) {
      throw new AppError(404, "USER_NOT_FOUND", "User not found");
    }

    await AuditService.log({
      consultancyId,
      actorUserId,
      action: "user.updated",
      entityType: "User",
      entityId: userId,
      meta: { ...payload, requestId: auditCtx.requestId },
      ip: auditCtx.ip,
      userAgent: auditCtx.userAgent,
    });

    return { userId };
  }

  static async assignRoles(
    consultancyId: string,
    targetUserId: string,
    roleKeys: string[],
    actorUserId: string,
    auditCtx: { ip?: string; userAgent?: string; requestId?: string },
  ) {
    const roles = await RbacService.assignRolesToUser(consultancyId, targetUserId, roleKeys);

    await AuditService.log({
      consultancyId,
      actorUserId,
      action: "user.roles.updated",
      entityType: "User",
      entityId: targetUserId,
      meta: { roleKeys, requestId: auditCtx.requestId },
      ip: auditCtx.ip,
      userAgent: auditCtx.userAgent,
    });

    return roles;
  }
}

import { OtpPurpose, OtpChannel, Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";

export class AuthRepository {
  static createIdentity(data: Prisma.AuthIdentityUncheckedCreateInput) {
    return prisma.authIdentity.create({ data });
  }

  static createCredential(data: Prisma.AuthCredentialUncheckedCreateInput) {
    return prisma.authCredential.create({ data });
  }

  static updateCredential(consultancyId: string, userId: string, passwordHash: string) {
    return prisma.authCredential.updateMany({
      where: { consultancyId, userId },
      data: { passwordHash, passwordUpdatedAt: new Date() },
    });
  }

  static updateIdentityVerification(
    consultancyId: string,
    userId: string,
    channel: OtpChannel,
    at: Date,
  ) {
    const data = channel === OtpChannel.EMAIL ? { emailVerifiedAt: at } : { phoneVerifiedAt: at };
    return prisma.authIdentity.updateMany({ where: { consultancyId, userId }, data });
  }

  static invalidateOtp(consultancyId: string, destination: string, purpose: OtpPurpose) {
    return prisma.authOtp.updateMany({
      where: {
        consultancyId,
        destination,
        purpose,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      data: {
        usedAt: new Date(),
      },
    });
  }

  static createOtp(data: Prisma.AuthOtpUncheckedCreateInput) {
    return prisma.authOtp.create({ data });
  }

  static getLatestActiveOtp(consultancyId: string, destination: string, purpose: OtpPurpose, channel: OtpChannel) {
    return prisma.authOtp.findFirst({
      where: {
        consultancyId,
        destination,
        purpose,
        channel,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  static getActiveOtpsAcrossConsultancies(destination: string, purpose: OtpPurpose, channel: OtpChannel) {
    return prisma.authOtp.findMany({
      where: {
        destination,
        purpose,
        channel,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: {
        consultancy: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  static markOtpUsed(otpId: string) {
    return prisma.authOtp.update({
      where: { id: otpId },
      data: { usedAt: new Date() },
    });
  }

  static increaseOtpAttempt(otpId: string) {
    return prisma.authOtp.update({
      where: { id: otpId },
      data: { attempts: { increment: 1 } },
    });
  }

  static createSession(data: Prisma.AuthSessionUncheckedCreateInput) {
    return prisma.authSession.create({ data });
  }

  static findActiveSessions(consultancyId: string, userId: string) {
    return prisma.authSession.findMany({
      where: { consultancyId, userId, revokedAt: null },
    });
  }

  static findActiveSessionById(sessionId: string) {
    return prisma.authSession.findFirst({ where: { id: sessionId, revokedAt: null } });
  }

  static updateSession(sessionId: string, data: Prisma.AuthSessionUpdateInput) {
    return prisma.authSession.update({ where: { id: sessionId }, data });
  }

  static revokeSession(sessionId: string) {
    return prisma.authSession.updateMany({
      where: { id: sessionId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  static revokeAllUserSessions(consultancyId: string, userId: string) {
    return prisma.authSession.updateMany({
      where: { consultancyId, userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}

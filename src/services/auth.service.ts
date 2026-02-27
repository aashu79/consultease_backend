import {
  OtpChannel,
  OtpPurpose,
  RateLimitType,
  UserStatus,
} from "@prisma/client";
import { prisma } from "../config/prisma";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../config/jwt";
import { AuthRepository } from "../repositories/auth.repository";
import { RateLimitRepository } from "../repositories/rateLimit.repository";
import { UserRepository } from "../repositories/user.repository";
import { AppError } from "../utils/errors";
import { generateOtp, hashOtp, verifyOtp } from "../utils/otp";
import { hashValue, randomToken, verifyHash } from "../utils/crypto";
import { NotificationService } from "./notification.service";
import { AuditService } from "./audit.service";
import { RbacService } from "./rbac.service";

function normalizeDestination(
  destination: string,
  channel: OtpChannel,
): string {
  if (channel === OtpChannel.EMAIL) {
    return destination.trim().toLowerCase();
  }
  return destination.trim();
}

function extractConsultancySlug(params: {
  consultancySlug?: string;
  tenantSlug?: string;
}): string | undefined {
  return (params.consultancySlug ?? params.tenantSlug)
    ?.trim()
    .toLowerCase();
}

async function resolveConsultancyBySlug(consultancySlug?: string) {
  if (!consultancySlug) {
    return null;
  }

  const consultancy = await prisma.consultancy.findUnique({
    where: { slug: consultancySlug },
  });
  if (!consultancy) {
    throw new AppError(404, "CONSULTANCY_NOT_FOUND", "Consultancy not found");
  }

  return consultancy;
}

async function inferConsultancyFromDestination(
  destination: string,
  channel: OtpChannel,
) {
  const candidates =
    channel === OtpChannel.EMAIL
      ? await UserRepository.findByEmailAcrossConsultancies(destination)
      : await UserRepository.findByPhoneAcrossConsultancies(destination);

  if (candidates.length === 1) {
    return candidates[0].consultancy;
  }

  if (candidates.length > 1) {
    throw new AppError(
      400,
      "CONSULTANCY_CONTEXT_REQUIRED",
      "Multiple consultancies found. Provide consultancySlug.",
    );
  }

  throw new AppError(
    400,
    "CONSULTANCY_CONTEXT_REQUIRED",
    "consultancySlug is required for this request.",
  );
}

export class AuthService {
  static async requestOtp(params: {
    consultancySlug?: string;
    tenantSlug?: string;
    destination: string;
    channel: OtpChannel;
    purpose: OtpPurpose;
    ip?: string;
    userAgent?: string;
    actorUserId?: string;
    requestId?: string;
  }) {
    const normalizedDestination = normalizeDestination(
      params.destination,
      params.channel,
    );
    const requestedConsultancySlug = extractConsultancySlug(params);
    const consultancy =
      (await resolveConsultancyBySlug(requestedConsultancySlug)) ??
      (await inferConsultancyFromDestination(
        normalizedDestination,
        params.channel,
      ));

    const windowStart = new Date(Date.now() - 15 * 60 * 1000);

    const byDestination = await RateLimitRepository.countByDestination(
      consultancy.id,
      RateLimitType.OTP_REQUEST,
      normalizedDestination,
      windowStart,
    );

    if (byDestination >= 3) {
      throw new AppError(429, "RATE_LIMITED", "Too many requests. Try later.");
    }

    if (params.ip) {
      const byIp = await RateLimitRepository.countByIp(
        consultancy.id,
        RateLimitType.OTP_REQUEST,
        params.ip,
        windowStart,
      );
      if (byIp >= 10) {
        throw new AppError(
          429,
          "RATE_LIMITED",
          "Too many requests. Try later.",
        );
      }
    }

    const user =
      params.channel === OtpChannel.EMAIL
        ? await UserRepository.findByEmail(
            consultancy.id,
            normalizedDestination,
          )
        : await UserRepository.findByPhone(
            consultancy.id,
            normalizedDestination,
          );

    await AuthRepository.invalidateOtp(
      consultancy.id,
      normalizedDestination,
      params.purpose,
    );

    const otp = generateOtp();
    const otpHash = await hashOtp(otp);

    await AuthRepository.createOtp({
      consultancyId: consultancy.id,
      userId: user?.id ?? null,
      channel: params.channel,
      purpose: params.purpose,
      destination: normalizedDestination,
      otpHash,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      requestIp: params.ip,
      userAgent: params.userAgent,
    });

    await RateLimitRepository.createEvent({
      consultancyId: consultancy.id,
      type: RateLimitType.OTP_REQUEST,
      destination: normalizedDestination,
      ip: params.ip,
    });

    if (params.channel === OtpChannel.EMAIL) {
      await NotificationService.sendEmailOtp(
        consultancy.id,
        normalizedDestination,
        otp,
        params.purpose,
      );
    } else {
      await NotificationService.sendSmsOtp(
        consultancy.id,
        normalizedDestination,
        otp,
        params.purpose,
      );
    }

    await AuditService.log({
      consultancyId: consultancy.id,
      actorUserId: params.actorUserId,
      action: "auth.otp.requested",
      entityType: "AuthOtp",
      entityId: null,
      meta: {
        channel: params.channel,
        purpose: params.purpose,
        destination: normalizedDestination,
        requestId: params.requestId,
      },
      ip: params.ip,
      userAgent: params.userAgent,
    });

    return { success: true, consultancySlug: consultancy.slug };
  }

  static async verifyOtp(params: {
    consultancySlug?: string;
    tenantSlug?: string;
    destination: string;
    channel: OtpChannel;
    purpose: OtpPurpose;
    otp: string;
    ip?: string;
    userAgent?: string;
    requestId?: string;
  }) {
    const normalizedDestination = normalizeDestination(
      params.destination,
      params.channel,
    );
    const requestedConsultancySlug = extractConsultancySlug(params);
    let consultancy = await resolveConsultancyBySlug(requestedConsultancySlug);

    if (!consultancy) {
      const activeOtps = await AuthRepository.getActiveOtpsAcrossConsultancies(
        normalizedDestination,
        params.purpose,
        params.channel,
      );

      if (activeOtps.length === 1) {
        consultancy = activeOtps[0].consultancy;
      } else if (activeOtps.length > 1) {
        throw new AppError(
          400,
          "CONSULTANCY_CONTEXT_REQUIRED",
          "Multiple consultancies found. Provide consultancySlug.",
        );
      } else {
        consultancy = await inferConsultancyFromDestination(
          normalizedDestination,
          params.channel,
        );
      }
    }

    const otpRecord = await AuthRepository.getLatestActiveOtp(
      consultancy.id,
      normalizedDestination,
      params.purpose,
      params.channel,
    );

    await RateLimitRepository.createEvent({
      consultancyId: consultancy.id,
      type: RateLimitType.OTP_VERIFY,
      destination: normalizedDestination,
      ip: params.ip,
    });

    if (!otpRecord) {
      throw new AppError(400, "OTP_INVALID", "Invalid or expired OTP");
    }

    const updated = await AuthRepository.increaseOtpAttempt(otpRecord.id);

    if (updated.attempts > updated.maxAttempts) {
      await AuthRepository.markOtpUsed(updated.id);
      throw new AppError(
        429,
        "OTP_ATTEMPTS_EXCEEDED",
        "Invalid or expired OTP",
      );
    }

    const isValid = await verifyOtp(params.otp, updated.otpHash);
    if (!isValid) {
      throw new AppError(400, "OTP_INVALID", "Invalid or expired OTP");
    }

    await AuthRepository.markOtpUsed(updated.id);

    if (updated.userId) {
      if (params.purpose === OtpPurpose.VERIFY_EMAIL) {
        await AuthRepository.updateIdentityVerification(
          consultancy.id,
          updated.userId,
          OtpChannel.EMAIL,
          new Date(),
        );
        await prisma.user.updateMany({
          where: {
            id: updated.userId,
            consultancyId: consultancy.id,
            status: {
              in: [UserStatus.PENDING_VERIFICATION, UserStatus.INVITED],
            },
          },
          data: { status: UserStatus.ACTIVE },
        });
      }

      if (params.purpose === OtpPurpose.VERIFY_PHONE) {
        await AuthRepository.updateIdentityVerification(
          consultancy.id,
          updated.userId,
          OtpChannel.SMS,
          new Date(),
        );
      }
    }

    await AuditService.log({
      consultancyId: consultancy.id,
      actorUserId: updated.userId,
      action: "auth.otp.verified",
      entityType: "AuthOtp",
      entityId: updated.id,
      meta: {
        channel: params.channel,
        purpose: params.purpose,
        destination: normalizedDestination,
        requestId: params.requestId,
      },
      ip: params.ip,
      userAgent: params.userAgent,
    });

    return { verified: true, consultancySlug: consultancy.slug };
  }

  static async login(params: {
    consultancySlug?: string;
    tenantSlug?: string;
    email: string;
    password: string;
    deviceId?: string;
    ip?: string;
    userAgent?: string;
    requestId?: string;
  }) {
    const normalizedEmail = params.email.trim().toLowerCase();

    let consultancy = null as Awaited<
      ReturnType<typeof prisma.consultancy.findUnique>
    > | null;
    let user = null as Awaited<
      ReturnType<typeof UserRepository.findByEmail>
    > | null;

    const providedConsultancySlug = (
      params.consultancySlug ?? params.tenantSlug
    )
      ?.trim()
      .toLowerCase();

    if (providedConsultancySlug) {
      consultancy = await prisma.consultancy.findUnique({
        where: { slug: providedConsultancySlug },
      });
      if (!consultancy) {
        throw new AppError(
          404,
          "CONSULTANCY_NOT_FOUND",
          "Consultancy not found",
        );
      }
      user = await UserRepository.findByEmail(consultancy.id, normalizedEmail);
    } else {
      const candidates =
        await UserRepository.findByEmailAcrossConsultancies(normalizedEmail);

      if (candidates.length === 1) {
        const match = candidates[0];
        consultancy = match.consultancy;
        user = match;
      } else if (candidates.length > 1) {
        throw new AppError(
          400,
          "CONSULTANCY_CONTEXT_REQUIRED",
          "Multiple consultancies found for this email. Provide consultancySlug.",
        );
      }
    }

    if (consultancy) {
      await RateLimitRepository.createEvent({
        consultancyId: consultancy.id,
        type: RateLimitType.LOGIN_ATTEMPT,
        destination: normalizedEmail,
        ip: params.ip,
      });
    }

    if (!user || !user.authCredential) {
      throw new AppError(401, "INVALID_CREDENTIALS", "Invalid credentials");
    }

    const matches = await verifyHash(
      params.password,
      user.authCredential.passwordHash,
    );
    if (!matches) {
      throw new AppError(401, "INVALID_CREDENTIALS", "Invalid credentials");
    }

    if (!user.authIdentity?.emailVerifiedAt) {
      throw new AppError(
        403,
        "EMAIL_NOT_VERIFIED",
        "Verify your email before login",
      );
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new AppError(403, "USER_INACTIVE", "User is not active");
    }

    if (!consultancy) {
      throw new AppError(401, "INVALID_CREDENTIALS", "Invalid credentials");
    }

    const session = await AuthRepository.createSession({
      consultancyId: consultancy.id,
      userId: user.id,
      refreshTokenHash: await hashValue(randomToken()),
      deviceId: params.deviceId,
      ip: params.ip,
      userAgent: params.userAgent,
    });

    const accessToken = signAccessToken({
      sub: user.id,
      consultancyId: consultancy.id,
      consultancySlug: consultancy.slug,
      tenantSlug: consultancy.slug,
      sessionId: session.id,
    });

    const refreshToken = signRefreshToken({
      sub: user.id,
      consultancyId: consultancy.id,
      sessionId: session.id,
    });

    await AuthRepository.updateSession(session.id, {
      refreshTokenHash: await hashValue(refreshToken),
    });

    let authz = await RbacService.getUserAuthorization(
      consultancy.id,
      user.id,
    );
    if (authz.roles.length === 0) {
      const assigned = await RbacService.ensureStudentPortalRoleAssignment(
        consultancy.id,
        user.id,
      );
      if (assigned) {
        authz = await RbacService.getUserAuthorization(consultancy.id, user.id);
      }
    }

    return {
      accessToken,
      refreshToken,
      consultancySlug: consultancy.slug,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        status: user.status,
        roles: authz.roles,
        permissions: authz.permissions,
        emailVerified: Boolean(user.authIdentity?.emailVerifiedAt),
        phoneVerified: Boolean(user.authIdentity?.phoneVerifiedAt),
      },
    };
  }

  static async refresh(refreshToken: string) {
    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw new AppError(401, "INVALID_REFRESH", "Invalid refresh token");
    }

    const session = await AuthRepository.findActiveSessionById(
      payload.sessionId,
    );
    if (
      !session ||
      session.consultancyId !== payload.consultancyId ||
      session.userId !== payload.sub
    ) {
      throw new AppError(401, "INVALID_REFRESH", "Invalid refresh token");
    }

    const validHash = await verifyHash(refreshToken, session.refreshTokenHash);
    if (!validHash) {
      throw new AppError(401, "INVALID_REFRESH", "Invalid refresh token");
    }

    const consultancy = await prisma.consultancy.findUnique({
      where: { id: session.consultancyId },
    });
    if (!consultancy) {
      throw new AppError(404, "CONSULTANCY_NOT_FOUND", "Consultancy not found");
    }

    const newRefreshToken = signRefreshToken({
      sub: session.userId,
      consultancyId: session.consultancyId,
      sessionId: session.id,
    });

    await AuthRepository.updateSession(session.id, {
      refreshTokenHash: await hashValue(newRefreshToken),
      lastUsedAt: new Date(),
    });

    const accessToken = signAccessToken({
      sub: session.userId,
      consultancyId: session.consultancyId,
      consultancySlug: consultancy.slug,
      tenantSlug: consultancy.slug,
      sessionId: session.id,
    });

    return {
      accessToken,
      refreshToken: newRefreshToken,
      consultancySlug: consultancy.slug,
    };
  }

  static async logout(refreshToken: string) {
    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw new AppError(401, "INVALID_REFRESH", "Invalid refresh token");
    }
    await AuthRepository.revokeSession(payload.sessionId);
    return { success: true };
  }

  static async forgotPasswordRequest(params: {
    consultancySlug?: string;
    tenantSlug?: string;
    email: string;
    ip?: string;
    userAgent?: string;
    requestId?: string;
  }) {
    const normalizedEmail = params.email.trim().toLowerCase();

    try {
      await this.requestOtp({
        consultancySlug: params.consultancySlug ?? params.tenantSlug,
        destination: normalizedEmail,
        channel: OtpChannel.EMAIL,
        purpose: OtpPurpose.RESET_PASSWORD,
        ip: params.ip,
        userAgent: params.userAgent,
        requestId: params.requestId,
      });
    } catch {
      return { success: true };
    }

    return { success: true };
  }

  static async forgotPasswordConfirm(params: {
    consultancySlug?: string;
    tenantSlug?: string;
    email: string;
    otp: string;
    newPassword: string;
    ip?: string;
    userAgent?: string;
    requestId?: string;
  }) {
    const normalizedEmail = params.email.trim().toLowerCase();

    const otpVerification = await this.verifyOtp({
      consultancySlug: extractConsultancySlug(params),
      destination: normalizedEmail,
      channel: OtpChannel.EMAIL,
      purpose: OtpPurpose.RESET_PASSWORD,
      otp: params.otp,
      ip: params.ip,
      userAgent: params.userAgent,
      requestId: params.requestId,
    });

    const consultancySlug = otpVerification.consultancySlug;
    const consultancy = await prisma.consultancy.findUnique({
      where: { slug: consultancySlug },
    });
    if (!consultancy) {
      throw new AppError(404, "CONSULTANCY_NOT_FOUND", "Consultancy not found");
    }

    const user = await UserRepository.findByEmail(
      consultancy.id,
      normalizedEmail,
    );
    if (!user) {
      return { success: true };
    }

    const newPasswordHash = await hashValue(params.newPassword);
    await AuthRepository.updateCredential(
      consultancy.id,
      user.id,
      newPasswordHash,
    );
    await AuthRepository.revokeAllUserSessions(consultancy.id, user.id);

    await AuditService.log({
      consultancyId: consultancy.id,
      actorUserId: user.id,
      action: "auth.password.reset",
      entityType: "AuthCredential",
      entityId: user.id,
      meta: { requestId: params.requestId },
      ip: params.ip,
      userAgent: params.userAgent,
    });

    return { success: true };
  }
}

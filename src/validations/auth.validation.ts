import { OtpChannel, OtpPurpose } from "@prisma/client";
import { z } from "zod";
import { strongPasswordRegex } from "./common.validation";

const otpBody = z.object({
  consultancySlug: z.string().min(2).optional(),
  tenantSlug: z.string().min(2).optional(),
  destination: z.string().min(3),
  channel: z.nativeEnum(OtpChannel),
  purpose: z.nativeEnum(OtpPurpose),
});

export const authRequestOtpSchema = z.object({ body: otpBody });

export const authVerifyOtpSchema = z.object({
  body: otpBody.extend({ otp: z.string().length(6) }),
});

export const authLoginSchema = z.object({
  body: z.object({
    consultancySlug: z.string().min(2).optional(),
    tenantSlug: z.string().min(2).optional(),
    email: z.string().email(),
    password: z.string().min(8),
    deviceId: z.string().optional(),
  }),
});

export const authRefreshSchema = z.object({
  body: z.object({ refreshToken: z.string().min(20) }),
});

export const authLogoutSchema = authRefreshSchema;

export const authForgotPasswordRequestSchema = z.object({
  body: z.object({
    consultancySlug: z.string().min(2).optional(),
    tenantSlug: z.string().min(2).optional(),
    email: z.string().email(),
  }),
});

export const authForgotPasswordConfirmSchema = z.object({
  body: z.object({
    consultancySlug: z.string().min(2).optional(),
    tenantSlug: z.string().min(2).optional(),
    email: z.string().email(),
    otp: z.string().length(6),
    newPassword: z.string().regex(strongPasswordRegex),
  }),
});

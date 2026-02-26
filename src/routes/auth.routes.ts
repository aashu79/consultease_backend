import { Router } from "express";
import { OtpChannel, OtpPurpose } from "@prisma/client";
import { z } from "zod";
import { AuthController } from "../controllers/auth.controller";
import { asyncHandler } from "../utils/errors";
import { validate } from "../middlewares/validate";

const strongPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{8,}$/;

const router = Router();

const otpBody = z.object({
  consultancySlug: z.string().min(2).optional(),
  tenantSlug: z.string().min(2).optional(),
  destination: z.string().min(3),
  channel: z.nativeEnum(OtpChannel),
  purpose: z.nativeEnum(OtpPurpose),
});

router.post(
  "/request-otp",
  validate(z.object({ body: otpBody })),
  asyncHandler(AuthController.requestOtp),
);

router.post(
  "/verify-otp",
  validate(
    z.object({
      body: otpBody.extend({ otp: z.string().length(6) }),
    }),
  ),
  asyncHandler(AuthController.verifyOtp),
);

router.post(
  "/login",
  validate(
    z.object({
      body: z.object({
        consultancySlug: z.string().min(2).optional(),
        tenantSlug: z.string().min(2).optional(),
        email: z.string().email(),
        password: z.string().min(8),
        deviceId: z.string().optional(),
      }),
    }),
  ),
  asyncHandler(AuthController.login),
);

router.post(
  "/refresh",
  validate(
    z.object({
      body: z.object({ refreshToken: z.string().min(20) }),
    }),
  ),
  asyncHandler(AuthController.refresh),
);

router.post(
  "/logout",
  validate(
    z.object({
      body: z.object({ refreshToken: z.string().min(20) }),
    }),
  ),
  asyncHandler(AuthController.logout),
);

router.post(
  "/forgot-password/request",
  validate(
    z.object({
      body: z.object({
        consultancySlug: z.string().min(2).optional(),
        tenantSlug: z.string().min(2).optional(),
        email: z.string().email(),
      }),
    }),
  ),
  asyncHandler(AuthController.forgotPasswordRequest),
);

router.post(
  "/forgot-password/confirm",
  validate(
    z.object({
      body: z.object({
        consultancySlug: z.string().min(2).optional(),
        tenantSlug: z.string().min(2).optional(),
        email: z.string().email(),
        otp: z.string().length(6),
        newPassword: z.string().regex(strongPassword),
      }),
    }),
  ),
  asyncHandler(AuthController.forgotPasswordConfirm),
);

export default router;

import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";
import { asyncHandler } from "../utils/errors";
import { validate } from "../middlewares/validate";
import {
  authForgotPasswordConfirmSchema,
  authForgotPasswordRequestSchema,
  authLoginSchema,
  authLogoutSchema,
  authRefreshSchema,
  authRequestOtpSchema,
  authVerifyOtpSchema,
} from "../validations/auth.validation";

const router = Router();

router.post(
  "/request-otp",
  validate(authRequestOtpSchema),
  asyncHandler(AuthController.requestOtp),
);

router.post(
  "/verify-otp",
  validate(authVerifyOtpSchema),
  asyncHandler(AuthController.verifyOtp),
);

router.post(
  "/login",
  validate(authLoginSchema),
  asyncHandler(AuthController.login),
);

router.post(
  "/refresh",
  validate(authRefreshSchema),
  asyncHandler(AuthController.refresh),
);

router.post(
  "/logout",
  validate(authLogoutSchema),
  asyncHandler(AuthController.logout),
);

router.post(
  "/forgot-password/request",
  validate(authForgotPasswordRequestSchema),
  asyncHandler(AuthController.forgotPasswordRequest),
);

router.post(
  "/forgot-password/confirm",
  validate(authForgotPasswordConfirmSchema),
  asyncHandler(AuthController.forgotPasswordConfirm),
);

export default router;

import { Router } from "express";
import { MarketingController } from "../controllers/marketing.controller";
import { auth } from "../middlewares/auth";
import { requireSuperAdmin } from "../middlewares/requireSuperAdmin";
import { validate } from "../middlewares/validate";
import { asyncHandler } from "../utils/errors";
import {
  marketingEmailSchema,
  marketingSmsSchema,
} from "../validations/marketing.validation";

const router = Router();

router.post(
  "/email",
  auth,
  requireSuperAdmin,
  validate(marketingEmailSchema),
  asyncHandler(MarketingController.sendEmail),
);

router.post(
  "/sms",
  auth,
  requireSuperAdmin,
  validate(marketingSmsSchema),
  asyncHandler(MarketingController.sendSms),
);

export default router;

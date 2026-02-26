import { Router } from "express";
import { z } from "zod";
import { MarketingController } from "../controllers/marketing.controller";
import { auth } from "../middlewares/auth";
import { requireSuperAdmin } from "../middlewares/requireSuperAdmin";
import { validate } from "../middlewares/validate";
import { asyncHandler } from "../utils/errors";

const recipientsConfigSchema = z.object({
  recipients: z.array(z.string().min(3)).optional(),
  includeUsers: z.boolean().optional(),
  includeStudents: z.boolean().optional(),
  includeLeads: z.boolean().optional(),
});

const router = Router();

router.post(
  "/email",
  auth,
  requireSuperAdmin,
  validate(
    z.object({
      body: recipientsConfigSchema.extend({
        subject: z.string().min(2).max(200),
        message: z.string().min(2).max(5000),
      }),
    }),
  ),
  asyncHandler(MarketingController.sendEmail),
);

router.post(
  "/sms",
  auth,
  requireSuperAdmin,
  validate(
    z.object({
      body: recipientsConfigSchema.extend({
        message: z.string().min(2).max(1000),
      }),
    }),
  ),
  asyncHandler(MarketingController.sendSms),
);

export default router;

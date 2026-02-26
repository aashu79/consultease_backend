import { Router } from "express";
import { z } from "zod";
import { TenantController } from "../controllers/tenant.controller";
import { asyncHandler } from "../utils/errors";
import { validate } from "../middlewares/validate";
import { auth } from "../middlewares/auth";
import { requirePermission } from "../middlewares/requirePermission";
import { tenantResolver } from "../middlewares/tenantResolver";

const strongPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{8,}$/;

const router = Router();

router.post(
  "/register",
  validate(
    z.object({
      body: z.object({
        name: z.string().min(2),
        country: z.string().min(2),
        timezone: z.string().min(2),
        email: z.string().email(),
        phone: z.string().min(7),
        address: z.string().optional(),
        website: z.string().url().optional(),
        ownerName: z.string().min(2),
        ownerEmail: z.string().email(),
        ownerPhone: z.string().optional(),
        ownerPassword: z.string().regex(strongPassword),
      }),
    }),
  ),
  asyncHandler(TenantController.register),
);

router.get("/me", tenantResolver, auth, requirePermission("consultancy.read"), asyncHandler(TenantController.me));

export default router;

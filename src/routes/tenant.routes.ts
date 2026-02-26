import { Router } from "express";
import { TenantController } from "../controllers/tenant.controller";
import { asyncHandler } from "../utils/errors";
import { validate } from "../middlewares/validate";
import { auth } from "../middlewares/auth";
import { requirePermission } from "../middlewares/requirePermission";
import { tenantResolver } from "../middlewares/tenantResolver";
import { registerTenantSchema } from "../validations/tenant.validation";

const router = Router();

router.post(
  "/register",
  validate(registerTenantSchema),
  asyncHandler(TenantController.register),
);

router.get(
  "/me",
  tenantResolver,
  auth,
  requirePermission("consultancy.read"),
  asyncHandler(TenantController.me),
);

export default router;

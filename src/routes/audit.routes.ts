import { Router } from "express";
import { AuditController } from "../controllers/audit.controller";
import { auth } from "../middlewares/auth";
import { requirePermission } from "../middlewares/requirePermission";
import { validate } from "../middlewares/validate";
import { asyncHandler } from "../utils/errors";
import { listAuditLogsSchema } from "../validations/audit.validation";

const router = Router();

router.get(
  "/",
  auth,
  requirePermission("audit.read"),
  validate(listAuditLogsSchema),
  asyncHandler(AuditController.list),
);

export default router;

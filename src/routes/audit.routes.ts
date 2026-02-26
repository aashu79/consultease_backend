import { Router } from "express";
import { z } from "zod";
import { AuditController } from "../controllers/audit.controller";
import { auth } from "../middlewares/auth";
import { requirePermission } from "../middlewares/requirePermission";
import { validate } from "../middlewares/validate";
import { asyncHandler } from "../utils/errors";

const router = Router();

router.get(
  "/",
  auth,
  requirePermission("audit.read"),
  validate(
    z.object({
      query: z.object({
        actorUserId: z.string().uuid().optional(),
        action: z.string().optional(),
        from: z.string().optional(),
        to: z.string().optional(),
        page: z.string().optional(),
        limit: z.string().optional(),
      }),
    }),
  ),
  asyncHandler(AuditController.list),
);

export default router;

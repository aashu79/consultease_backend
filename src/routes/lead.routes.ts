import { Router } from "express";
import { LeadStage } from "@prisma/client";
import { z } from "zod";
import { LeadController } from "../controllers/lead.controller";
import { auth } from "../middlewares/auth";
import { requirePermission } from "../middlewares/requirePermission";
import { validate } from "../middlewares/validate";
import { asyncHandler } from "../utils/errors";

const router = Router();

router.post(
  "/",
  auth,
  requirePermission("lead.create"),
  validate(
    z.object({
      body: z.object({
        fullName: z.string().min(2),
        email: z.string().email().optional(),
        phone: z.string().min(7).optional(),
        source: z.string().optional(),
        assignedToUserId: z.string().uuid().optional(),
        notes: z.string().optional(),
      }),
    }),
  ),
  asyncHandler(LeadController.create),
);

router.get(
  "/",
  auth,
  requirePermission("lead.read"),
  validate(
    z.object({
      query: z.object({
        stage: z.nativeEnum(LeadStage).optional(),
        assignedTo: z.string().uuid().optional(),
        search: z.string().optional(),
        page: z.string().optional(),
        limit: z.string().optional(),
      }),
    }),
  ),
  asyncHandler(LeadController.list),
);

router.patch(
  "/:id",
  auth,
  requirePermission("lead.update"),
  validate(
    z.object({
      params: z.object({ id: z.string().uuid() }),
      body: z.object({
        fullName: z.string().min(2).optional(),
        email: z.string().email().optional(),
        phone: z.string().min(7).optional(),
        source: z.string().optional(),
        assignedToUserId: z.string().uuid().nullable().optional(),
        notes: z.string().optional(),
        stage: z.nativeEnum(LeadStage).optional(),
        status: z.enum(["OPEN", "WON", "LOST"]).optional(),
      }),
    }),
  ),
  asyncHandler(LeadController.update),
);

router.post(
  "/:id/activities",
  auth,
  requirePermission("lead.update"),
  validate(
    z.object({
      params: z.object({ id: z.string().uuid() }),
      body: z.object({ type: z.string().min(2), note: z.string().optional() }),
    }),
  ),
  asyncHandler(LeadController.addActivity),
);

router.post(
  "/:id/convert-to-student",
  auth,
  requirePermission("lead.convert"),
  validate(
    z.object({
      params: z.object({ id: z.string().uuid() }),
      body: z.object({
        intake: z.string().optional(),
        targetCountry: z.string().optional(),
      }),
    }),
  ),
  asyncHandler(LeadController.convertToStudent),
);

export default router;

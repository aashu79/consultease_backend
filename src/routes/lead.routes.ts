import { Router } from "express";
import { LeadController } from "../controllers/lead.controller";
import { auth } from "../middlewares/auth";
import { requirePermission } from "../middlewares/requirePermission";
import { validate } from "../middlewares/validate";
import { asyncHandler } from "../utils/errors";
import {
  addLeadActivitySchema,
  convertLeadSchema,
  createLeadSchema,
  listLeadsSchema,
  updateLeadSchema,
} from "../validations/lead.validation";

const router = Router();

router.post(
  "/",
  auth,
  requirePermission("lead.create"),
  validate(createLeadSchema),
  asyncHandler(LeadController.create),
);

router.get(
  "/",
  auth,
  requirePermission("lead.read"),
  validate(listLeadsSchema),
  asyncHandler(LeadController.list),
);

router.patch(
  "/:id",
  auth,
  requirePermission("lead.update"),
  validate(updateLeadSchema),
  asyncHandler(LeadController.update),
);

router.post(
  "/:id/activities",
  auth,
  requirePermission("lead.update"),
  validate(addLeadActivitySchema),
  asyncHandler(LeadController.addActivity),
);

router.post(
  "/:id/convert-to-student",
  auth,
  requirePermission("lead.convert"),
  validate(convertLeadSchema),
  asyncHandler(LeadController.convertToStudent),
);

export default router;

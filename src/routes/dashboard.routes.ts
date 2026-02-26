import { Router } from "express";
import { z } from "zod";
import { DashboardController } from "../controllers/dashboard.controller";
import { auth } from "../middlewares/auth";
import { requirePermission } from "../middlewares/requirePermission";
import { validate } from "../middlewares/validate";
import { asyncHandler } from "../utils/errors";

const router = Router();

router.get(
  "/students/:studentId/dashboard",
  auth,
  requirePermission("student.read"),
  validate(z.object({ params: z.object({ studentId: z.string().uuid() }) })),
  asyncHandler(DashboardController.studentDashboard),
);

export default router;

import { Router } from "express";
import { DashboardController } from "../controllers/dashboard.controller";
import { auth } from "../middlewares/auth";
import { requirePermission } from "../middlewares/requirePermission";
import { validate } from "../middlewares/validate";
import { asyncHandler } from "../utils/errors";
import { studentDashboardSchema } from "../validations/dashboard.validation";

const router = Router();

router.get(
  "/students/me/dashboard",
  auth,
  asyncHandler(DashboardController.myStudentDashboard),
);

router.get(
  "/students/:studentId/dashboard",
  auth,
  requirePermission("student.read"),
  validate(studentDashboardSchema),
  asyncHandler(DashboardController.studentDashboard),
);

export default router;

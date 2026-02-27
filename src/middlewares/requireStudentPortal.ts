import { NextFunction, Request, Response } from "express";
import { StudentDataService } from "../services/student.data.service";
import { AppError } from "../utils/errors";

export async function requireStudentPortal(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  if (!req.user) {
    return next(new AppError(401, "UNAUTHORIZED", "Authentication required"));
  }

  if (!req.tenant) {
    return next(
      new AppError(500, "CONSULTANCY_CONTEXT_MISSING", "Consultancy context missing"),
    );
  }

  const student = await StudentDataService.findByPortalUserId(
    req.tenant.consultancyId,
    req.user.userId,
  );

  if (!student) {
    return next(
      new AppError(
        404,
        "STUDENT_PORTAL_PROFILE_NOT_FOUND",
        "No student profile linked to this account",
      ),
    );
  }

  req.studentPortal = { studentId: student.id };
  return next();
}

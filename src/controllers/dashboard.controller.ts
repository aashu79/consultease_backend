import { Request, Response } from "express";
import { StudentService } from "../services/student.service";
import { successResponse } from "../utils/safeResponse";

export class DashboardController {
  static async studentDashboard(req: Request, res: Response) {
    const data = await StudentService.getDashboard(req.tenant!.consultancyId, req.params.studentId);
    return successResponse(res, data);
  }

  static async myStudentDashboard(req: Request, res: Response) {
    const data = await StudentService.getDashboardByPortalUser(
      req.tenant!.consultancyId,
      req.user!.userId,
    );
    return successResponse(res, data);
  }
}

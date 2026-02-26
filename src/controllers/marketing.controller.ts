import { Request, Response } from "express";
import { MarketingService } from "../services/marketing.service";
import { successResponse } from "../utils/safeResponse";

export class MarketingController {
  static async sendEmail(req: Request, res: Response) {
    const data = await MarketingService.sendPromotionalEmail({
      consultancyId: req.tenant!.consultancyId,
      actorUserId: req.user!.userId,
      subject: req.body.subject,
      message: req.body.message,
      recipients: req.body.recipients,
      includeUsers: req.body.includeUsers,
      includeStudents: req.body.includeStudents,
      includeLeads: req.body.includeLeads,
      ip: req.ip,
      userAgent: req.get("user-agent"),
      requestId: req.requestId,
    });

    return successResponse(res, data);
  }

  static async sendSms(req: Request, res: Response) {
    const data = await MarketingService.sendPromotionalSms({
      consultancyId: req.tenant!.consultancyId,
      actorUserId: req.user!.userId,
      message: req.body.message,
      recipients: req.body.recipients,
      includeUsers: req.body.includeUsers,
      includeStudents: req.body.includeStudents,
      includeLeads: req.body.includeLeads,
      ip: req.ip,
      userAgent: req.get("user-agent"),
      requestId: req.requestId,
    });

    return successResponse(res, data);
  }
}

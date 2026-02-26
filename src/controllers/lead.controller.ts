import { Request, Response } from "express";
import { LeadService } from "../services/lead.service";
import { successResponse } from "../utils/safeResponse";

export class LeadController {
  static async create(req: Request, res: Response) {
    const data = await LeadService.createLead(
      req.tenant!.consultancyId,
      req.body,
      req.user!.userId,
      { ip: req.ip, userAgent: req.get("user-agent"), requestId: req.requestId },
    );
    return successResponse(res, data, 201);
  }

  static async list(req: Request, res: Response) {
    const data = await LeadService.listLeads(req.tenant!.consultancyId, req.query as any);
    return successResponse(res, data);
  }

  static async update(req: Request, res: Response) {
    const data = await LeadService.updateLead(
      req.tenant!.consultancyId,
      req.params.id,
      req.body,
      req.user!.userId,
      { ip: req.ip, userAgent: req.get("user-agent"), requestId: req.requestId },
    );
    return successResponse(res, data);
  }

  static async addActivity(req: Request, res: Response) {
    const data = await LeadService.addActivity(
      req.tenant!.consultancyId,
      req.params.id,
      req.user!.userId,
      req.body,
      { ip: req.ip, userAgent: req.get("user-agent"), requestId: req.requestId },
    );
    return successResponse(res, data, 201);
  }

  static async convertToStudent(req: Request, res: Response) {
    const data = await LeadService.convertToStudent(
      req.tenant!.consultancyId,
      req.params.id,
      req.body,
      req.user!.userId,
      { ip: req.ip, userAgent: req.get("user-agent"), requestId: req.requestId },
    );
    return successResponse(res, data, 201);
  }
}

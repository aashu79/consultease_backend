import { Request, Response } from "express";
import { TenantService } from "../services/tenant.service";
import { successResponse } from "../utils/safeResponse";

export class TenantController {
  static async register(req: Request, res: Response) {
    const result = await TenantService.registerTenant({
      ...req.body,
      ip: req.ip,
      userAgent: req.get("user-agent"),
      requestId: req.requestId,
    });

    return successResponse(res, result, 201);
  }

  static async me(req: Request, res: Response) {
    const tenancy = await TenantService.getTenantProfile(req.tenant!.consultancyId);
    return successResponse(res, tenancy);
  }
}

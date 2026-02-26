import { Request, Response } from "express";
import { getPagination } from "../utils/pagination";
import { successResponse } from "../utils/safeResponse";
import { AuditService } from "../services/audit.service";

export class AuditController {
  static async list(req: Request, res: Response) {
    const { skip, limit, page } = getPagination({
      page: req.query.page as string | undefined,
      limit: req.query.limit as string | undefined,
    });

    const data = await AuditService.list(req.tenant!.consultancyId, {
      actorUserId: req.query.actorUserId as string | undefined,
      action: req.query.action as string | undefined,
      from: req.query.from ? new Date(String(req.query.from)) : undefined,
      to: req.query.to ? new Date(String(req.query.to)) : undefined,
      skip,
      take: limit,
    });

    return successResponse(res, { items: data, page, limit });
  }
}

import { Request, Response } from "express";
import { AuthService } from "../services/auth.service";
import { successResponse } from "../utils/safeResponse";

function resolveConsultancySlug(req: Request): string | undefined {
  return (
    req.body?.consultancySlug ||
    req.body?.tenantSlug ||
    req.header("X-Consultancy-Slug") ||
    req.header("X-Tenant-Slug")
  )
    ?.trim()
    .toLowerCase();
}

export class AuthController {
  static async requestOtp(req: Request, res: Response) {
    const data = await AuthService.requestOtp({
      ...req.body,
      consultancySlug: resolveConsultancySlug(req),
      ip: req.ip,
      userAgent: req.get("user-agent"),
      requestId: req.requestId,
      actorUserId: req.user?.userId,
    });
    return successResponse(res, data);
  }

  static async verifyOtp(req: Request, res: Response) {
    const data = await AuthService.verifyOtp({
      ...req.body,
      consultancySlug: resolveConsultancySlug(req),
      ip: req.ip,
      userAgent: req.get("user-agent"),
      requestId: req.requestId,
    });
    return successResponse(res, data);
  }

  static async login(req: Request, res: Response) {
    const data = await AuthService.login({
      ...req.body,
      consultancySlug: resolveConsultancySlug(req),
      ip: req.ip,
      userAgent: req.get("user-agent"),
    });
    return successResponse(res, data);
  }

  static async refresh(req: Request, res: Response) {
    const data = await AuthService.refresh(req.body.refreshToken);
    return successResponse(res, data);
  }

  static async logout(req: Request, res: Response) {
    const data = await AuthService.logout(req.body.refreshToken);
    return successResponse(res, data);
  }

  static async forgotPasswordRequest(req: Request, res: Response) {
    const data = await AuthService.forgotPasswordRequest({
      ...req.body,
      consultancySlug: resolveConsultancySlug(req),
      ip: req.ip,
      userAgent: req.get("user-agent"),
      requestId: req.requestId,
    });
    return successResponse(res, data);
  }

  static async forgotPasswordConfirm(req: Request, res: Response) {
    const data = await AuthService.forgotPasswordConfirm({
      ...req.body,
      consultancySlug: resolveConsultancySlug(req),
      ip: req.ip,
      userAgent: req.get("user-agent"),
      requestId: req.requestId,
    });
    return successResponse(res, data);
  }
}

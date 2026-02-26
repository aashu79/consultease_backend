import { Request, Response } from "express";
import { UserService } from "../services/user.service";
import { successResponse } from "../utils/safeResponse";

export class UserController {
  static async invite(req: Request, res: Response) {
    const data = await UserService.inviteUser({
      consultancyId: req.tenant!.consultancyId,
      consultancySlug: req.tenant!.slug,
      actorUserId: req.user!.userId,
      email: req.body.email,
      phone: req.body.phone,
      roleKeys: req.body.roleKeys,
      ip: req.ip,
      userAgent: req.get("user-agent"),
      requestId: req.requestId,
    });
    return successResponse(res, data, 201);
  }

  static async acceptInvitation(req: Request, res: Response) {
    const data = await UserService.acceptInvitation({
      ...req.body,
      ip: req.ip,
      userAgent: req.get("user-agent"),
      requestId: req.requestId,
    });
    return successResponse(res, data, 201);
  }

  static async list(req: Request, res: Response) {
    const data = await UserService.listUsers(req.tenant!.consultancyId);
    return successResponse(res, data);
  }

  static async update(req: Request, res: Response) {
    const data = await UserService.updateUser(
      req.tenant!.consultancyId,
      req.params.id,
      req.body,
      req.user!.userId,
      {
        ip: req.ip,
        userAgent: req.get("user-agent"),
        requestId: req.requestId,
      },
    );
    return successResponse(res, data);
  }

  static async assignRoles(req: Request, res: Response) {
    const data = await UserService.assignRoles(
      req.tenant!.consultancyId,
      req.params.id,
      req.body.roleKeys,
      req.user!.userId,
      {
        ip: req.ip,
        userAgent: req.get("user-agent"),
        requestId: req.requestId,
      },
    );

    return successResponse(res, data);
  }
}

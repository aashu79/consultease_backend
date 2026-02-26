import { Request, Response } from "express";
import { RbacService } from "../services/rbac.service";
import { successResponse } from "../utils/safeResponse";

export class RbacController {
  static async createRole(req: Request, res: Response) {
    const data = await RbacService.createRole(req.tenant!.consultancyId, req.body);
    return successResponse(res, data, 201);
  }

  static async listRoles(req: Request, res: Response) {
    const data = await RbacService.listRoles(req.tenant!.consultancyId);
    return successResponse(res, data);
  }

  static async updateRole(req: Request, res: Response) {
    const data = await RbacService.updateRole(req.tenant!.consultancyId, req.params.id, req.body);
    return successResponse(res, data);
  }

  static async setRolePermissions(req: Request, res: Response) {
    await RbacService.setRolePermissions(req.tenant!.consultancyId, req.params.id, req.body.permissions);
    return successResponse(res, { roleId: req.params.id });
  }
}

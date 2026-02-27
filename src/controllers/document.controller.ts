import { Request, Response } from "express";
import { DocumentService } from "../services/document.service";
import { successResponse } from "../utils/safeResponse";

export class DocumentController {
  static async createRequest(req: Request, res: Response) {
    const data = await DocumentService.createRequest(
      req.tenant!.consultancyId,
      req.params.studentId,
      req.user!.userId,
      req.body,
      { ip: req.ip, userAgent: req.get("user-agent"), requestId: req.requestId },
    );
    return successResponse(res, data, 201);
  }

  static async listRequests(req: Request, res: Response) {
    const data = await DocumentService.listRequests(req.tenant!.consultancyId, req.params.studentId);
    return successResponse(res, data);
  }

  static async listDocuments(req: Request, res: Response) {
    const data = await DocumentService.listStudentDocuments(
      req.tenant!.consultancyId,
      req.params.studentId,
    );
    return successResponse(res, data);
  }

  static async updateRequest(req: Request, res: Response) {
    const data = await DocumentService.updateRequest(
      req.tenant!.consultancyId,
      req.params.id,
      req.user!.userId,
      req.body,
      { ip: req.ip, userAgent: req.get("user-agent"), requestId: req.requestId },
    );
    return successResponse(res, data);
  }

  static async cancelRequest(req: Request, res: Response) {
    const data = await DocumentService.cancelRequest(
      req.tenant!.consultancyId,
      req.params.id,
      req.user!.userId,
      { ip: req.ip, userAgent: req.get("user-agent"), requestId: req.requestId },
    );
    return successResponse(res, data);
  }

  static async confirmUpload(req: Request, res: Response) {
    const data = await DocumentService.confirmUpload(
      req.tenant!.consultancyId,
      req.body.documentVersionId,
      req.user!.userId,
      { ip: req.ip, userAgent: req.get("user-agent"), requestId: req.requestId },
    );
    return successResponse(res, data);
  }

  static async verify(req: Request, res: Response) {
    const data = await DocumentService.verifyDocument(
      req.tenant!.consultancyId,
      req.params.versionId,
      req.user!.userId,
      req.body,
      { ip: req.ip, userAgent: req.get("user-agent"), requestId: req.requestId },
    );
    return successResponse(res, data);
  }
}

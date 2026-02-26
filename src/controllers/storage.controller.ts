import { Request, Response } from "express";
import { DocumentService } from "../services/document.service";
import { ProfileService } from "../services/profile.service";
import { successResponse } from "../utils/safeResponse";

export class StorageController {
  static async signUpload(req: Request, res: Response) {
    const data = await DocumentService.signUpload(
      req.tenant!.consultancyId,
      req.user!.userId,
      req.body,
      { ip: req.ip, userAgent: req.get("user-agent"), requestId: req.requestId },
    );
    return successResponse(res, data);
  }

  static async signDownload(req: Request, res: Response) {
    const data = await DocumentService.signDownload(
      req.tenant!.consultancyId,
      req.body.documentVersionId,
      req.body.expiresInSeconds,
    );
    return successResponse(res, data);
  }

  static async signUserProfileUpload(req: Request, res: Response) {
    const data = await ProfileService.signUserProfileUpload({
      consultancyId: req.tenant!.consultancyId,
      userId: req.body.userId,
      fileName: req.body.fileName,
      mimeType: req.body.mimeType,
      sizeBytes: req.body.sizeBytes,
      expiresInSeconds: req.body.expiresInSeconds,
    });

    return successResponse(res, data);
  }

  static async confirmUserProfileUpload(req: Request, res: Response) {
    const data = await ProfileService.confirmUserProfileUpload({
      consultancyId: req.tenant!.consultancyId,
      userId: req.body.userId,
      objectKey: req.body.objectKey,
      mimeType: req.body.mimeType,
      actorUserId: req.user!.userId,
      ip: req.ip,
      userAgent: req.get("user-agent"),
      requestId: req.requestId,
    });

    return successResponse(res, data);
  }

  static async signUserProfileDownload(req: Request, res: Response) {
    const data = await ProfileService.signUserProfileDownload({
      consultancyId: req.tenant!.consultancyId,
      userId: req.body.userId,
      expiresInSeconds: req.body.expiresInSeconds,
    });

    return successResponse(res, data);
  }

  static async signStudentProfileUpload(req: Request, res: Response) {
    const data = await ProfileService.signStudentProfileUpload({
      consultancyId: req.tenant!.consultancyId,
      studentId: req.body.studentId,
      fileName: req.body.fileName,
      mimeType: req.body.mimeType,
      sizeBytes: req.body.sizeBytes,
      expiresInSeconds: req.body.expiresInSeconds,
    });

    return successResponse(res, data);
  }

  static async confirmStudentProfileUpload(req: Request, res: Response) {
    const data = await ProfileService.confirmStudentProfileUpload({
      consultancyId: req.tenant!.consultancyId,
      studentId: req.body.studentId,
      objectKey: req.body.objectKey,
      mimeType: req.body.mimeType,
      actorUserId: req.user!.userId,
      ip: req.ip,
      userAgent: req.get("user-agent"),
      requestId: req.requestId,
    });

    return successResponse(res, data);
  }

  static async signStudentProfileDownload(req: Request, res: Response) {
    const data = await ProfileService.signStudentProfileDownload({
      consultancyId: req.tenant!.consultancyId,
      studentId: req.body.studentId,
      expiresInSeconds: req.body.expiresInSeconds,
    });

    return successResponse(res, data);
  }
}

import { Request, Response } from "express";
import { DocumentService } from "../services/document.service";
import { ProfileService } from "../services/profile.service";
import { StudentService } from "../services/student.service";
import { successResponse } from "../utils/safeResponse";

export class StudentPortalController {
  static async myProfile(req: Request, res: Response) {
    const data = await StudentService.getDetailedProfile(
      req.tenant!.consultancyId,
      req.studentPortal!.studentId,
    );
    return successResponse(res, data);
  }

  static async upsertMyProfile(req: Request, res: Response) {
    const data = await StudentService.upsertDetailedProfile(
      req.tenant!.consultancyId,
      req.studentPortal!.studentId,
      req.body,
      req.user!.userId,
      { ip: req.ip, userAgent: req.get("user-agent"), requestId: req.requestId },
    );
    return successResponse(res, data);
  }

  static async myDocumentRequests(req: Request, res: Response) {
    const data = await DocumentService.listRequests(
      req.tenant!.consultancyId,
      req.studentPortal!.studentId,
    );
    return successResponse(res, data);
  }

  static async myDocuments(req: Request, res: Response) {
    const data = await DocumentService.listStudentDocuments(
      req.tenant!.consultancyId,
      req.studentPortal!.studentId,
    );
    return successResponse(res, data);
  }

  static async signMyDocumentUpload(req: Request, res: Response) {
    const data = await DocumentService.signUploadForStudentPortal(
      req.tenant!.consultancyId,
      req.studentPortal!.studentId,
      req.user!.userId,
      req.body,
      { ip: req.ip, userAgent: req.get("user-agent"), requestId: req.requestId },
    );
    return successResponse(res, data);
  }

  static async confirmMyDocumentUpload(req: Request, res: Response) {
    const data = await DocumentService.confirmUploadForStudentPortal(
      req.tenant!.consultancyId,
      req.studentPortal!.studentId,
      req.body.documentVersionId,
      req.user!.userId,
      { ip: req.ip, userAgent: req.get("user-agent"), requestId: req.requestId },
    );
    return successResponse(res, data);
  }

  static async signMyDocumentDownload(req: Request, res: Response) {
    const data = await DocumentService.signDownloadForStudentPortal(
      req.tenant!.consultancyId,
      req.studentPortal!.studentId,
      req.body.documentVersionId,
      req.body.expiresInSeconds,
    );
    return successResponse(res, data);
  }

  static async signMyProfileUpload(req: Request, res: Response) {
    const data = await ProfileService.signStudentProfileUpload({
      consultancyId: req.tenant!.consultancyId,
      studentId: req.studentPortal!.studentId,
      fileName: req.body.fileName,
      mimeType: req.body.mimeType,
      sizeBytes: req.body.sizeBytes,
      expiresInSeconds: req.body.expiresInSeconds,
    });
    return successResponse(res, data);
  }

  static async confirmMyProfileUpload(req: Request, res: Response) {
    const data = await ProfileService.confirmStudentProfileUpload({
      consultancyId: req.tenant!.consultancyId,
      studentId: req.studentPortal!.studentId,
      objectKey: req.body.objectKey,
      mimeType: req.body.mimeType,
      actorUserId: req.user!.userId,
      ip: req.ip,
      userAgent: req.get("user-agent"),
      requestId: req.requestId,
    });
    return successResponse(res, data);
  }

  static async signMyProfileDownload(req: Request, res: Response) {
    const data = await ProfileService.signStudentProfileDownload({
      consultancyId: req.tenant!.consultancyId,
      studentId: req.studentPortal!.studentId,
      expiresInSeconds: req.body.expiresInSeconds,
    });
    return successResponse(res, data);
  }
}

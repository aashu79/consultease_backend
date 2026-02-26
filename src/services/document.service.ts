import { DocumentRequestStatus, DocumentVerificationStatus, DocumentUploadState } from "@prisma/client";
import crypto from "crypto";
import { env } from "../config/env";
import { storageProvider } from "../config/providers";
import { DocumentRepository } from "../repositories/document.repository";
import { AppError } from "../utils/errors";
import { StorageService } from "./storage.service";
import { AuditService } from "./audit.service";
import { StudentDataService } from "./student.data.service";

const storageService = new StorageService(storageProvider);

export class DocumentService {
  static async createRequest(
    consultancyId: string,
    studentId: string,
    actorUserId: string,
    payload: {
      title: string;
      documentTypeKey: string;
      instructions?: string;
      dueAt?: string;
      caseId?: string;
    },
    auditCtx: { ip?: string; userAgent?: string; requestId?: string },
  ) {
    const student = await StudentDataService.findById(consultancyId, studentId);
    if (!student) {
      throw new AppError(404, "STUDENT_NOT_FOUND", "Student not found");
    }

    const request = await DocumentRepository.createRequest({
      consultancyId,
      studentId,
      requestedByUserId: actorUserId,
      title: payload.title,
      documentTypeKey: payload.documentTypeKey,
      instructions: payload.instructions,
      dueAt: payload.dueAt ? new Date(payload.dueAt) : undefined,
      caseId: payload.caseId,
      status: DocumentRequestStatus.OPEN,
    });

    await AuditService.log({
      consultancyId,
      actorUserId,
      action: "document.request.created",
      entityType: "DocumentRequest",
      entityId: request.id,
      meta: { studentId, requestId: auditCtx.requestId },
      ip: auditCtx.ip,
      userAgent: auditCtx.userAgent,
    });

    return request;
  }

  static async listRequests(consultancyId: string, studentId: string) {
    return DocumentRepository.listRequests(consultancyId, studentId);
  }

  static async updateRequest(
    consultancyId: string,
    requestId: string,
    actorUserId: string,
    payload: {
      title?: string;
      instructions?: string;
      dueAt?: string;
      status?: DocumentRequestStatus;
    },
    auditCtx: { ip?: string; userAgent?: string; requestId?: string },
  ) {
    const updated = await DocumentRepository.updateRequest(consultancyId, requestId, {
      title: payload.title,
      instructions: payload.instructions,
      dueAt: payload.dueAt ? new Date(payload.dueAt) : undefined,
      status: payload.status,
    });

    if (updated.count === 0) {
      throw new AppError(404, "REQUEST_NOT_FOUND", "Document request not found");
    }

    await AuditService.log({
      consultancyId,
      actorUserId,
      action: "document.request.updated",
      entityType: "DocumentRequest",
      entityId: requestId,
      meta: { ...payload, requestId: auditCtx.requestId },
      ip: auditCtx.ip,
      userAgent: auditCtx.userAgent,
    });

    return { requestId };
  }

  static async cancelRequest(
    consultancyId: string,
    requestId: string,
    actorUserId: string,
    auditCtx: { ip?: string; userAgent?: string; requestId?: string },
  ) {
    const updated = await DocumentRepository.cancelRequest(consultancyId, requestId);
    if (updated.count === 0) {
      throw new AppError(404, "REQUEST_NOT_FOUND", "Document request not found");
    }

    await AuditService.log({
      consultancyId,
      actorUserId,
      action: "document.request.cancelled",
      entityType: "DocumentRequest",
      entityId: requestId,
      meta: { requestId: auditCtx.requestId },
      ip: auditCtx.ip,
      userAgent: auditCtx.userAgent,
    });

    return { requestId };
  }

  static async signUpload(
    consultancyId: string,
    actorUserId: string,
    payload: {
      studentId: string;
      documentTypeKey: string;
      fileName: string;
      mimeType: string;
      sizeBytes: number;
      requestId?: string;
      expiresInSeconds?: number;
    },
    auditCtx: { ip?: string; userAgent?: string; requestId?: string },
  ) {
    const safeFileName = storageService.validateUploadInput({
      mimeType: payload.mimeType,
      sizeBytes: payload.sizeBytes,
      fileName: payload.fileName,
    });

    const student = await StudentDataService.findById(consultancyId, payload.studentId);
    if (!student) {
      throw new AppError(404, "STUDENT_NOT_FOUND", "Student not found");
    }

    if (payload.requestId) {
      const request = await DocumentRepository.findRequestById(consultancyId, payload.requestId);
      if (!request || request.studentId !== payload.studentId) {
        throw new AppError(400, "INVALID_REQUEST", "Invalid document request for upload");
      }
      if (
        request.status === DocumentRequestStatus.CANCELLED ||
        request.status === DocumentRequestStatus.FULFILLED
      ) {
        throw new AppError(400, "REQUEST_CLOSED", "Document request is not open");
      }
    }

    const documentFile = await DocumentRepository.createOrFindDocumentFile(
      consultancyId,
      payload.studentId,
      payload.documentTypeKey,
    );

    const versionNumber = await DocumentRepository.nextVersionNumber(documentFile.id);
    const versionId = crypto.randomUUID();
    const objectKey = storageService.buildDocumentObjectKey({
      consultancyId,
      studentId: payload.studentId,
      documentTypeKey: payload.documentTypeKey,
      documentVersionId: versionId,
      fileName: safeFileName,
    });

    const version = await DocumentRepository.createVersion({
      id: versionId,
      consultancyId,
      documentFileId: documentFile.id,
      uploadedByUserId: actorUserId,
      requestId: payload.requestId,
      versionNumber,
      fileName: safeFileName,
      mimeType: payload.mimeType,
      sizeBytes: BigInt(payload.sizeBytes),
      bucket: env.STORAGE_BUCKET,
      objectKey,
    });

    const signed = await storageService.signUpload({
      bucket: env.STORAGE_BUCKET,
      objectKey,
      mimeType: payload.mimeType,
      expiresInSeconds: payload.expiresInSeconds,
    });

    await AuditService.log({
      consultancyId,
      actorUserId,
      action: "document.version.created",
      entityType: "DocumentVersion",
      entityId: version.id,
      meta: {
        requestId: auditCtx.requestId,
        studentId: payload.studentId,
        documentTypeKey: payload.documentTypeKey,
      },
      ip: auditCtx.ip,
      userAgent: auditCtx.userAgent,
    });

    return {
      documentVersionId: version.id,
      bucket: env.STORAGE_BUCKET,
      objectKey,
      uploadUrl: signed.uploadUrl,
      expiresInSeconds: signed.expiresInSeconds,
    };
  }

  static async confirmUpload(
    consultancyId: string,
    documentVersionId: string,
    actorUserId: string,
    auditCtx: { ip?: string; userAgent?: string; requestId?: string },
  ) {
    const version = await DocumentRepository.findVersionById(consultancyId, documentVersionId);
    if (!version) {
      throw new AppError(404, "VERSION_NOT_FOUND", "Document version not found");
    }

    if (version.uploadState === DocumentUploadState.CONFIRMED) {
      return version;
    }

    const head = await storageService.headObject({
      bucket: version.bucket,
      objectKey: version.objectKey,
    });

    const confirmed = await DocumentRepository.confirmUpload(
      consultancyId,
      version.id,
      head.sizeBytes,
      head.etag,
    );

    if (!confirmed) {
      throw new AppError(404, "VERSION_NOT_FOUND", "Document version not found");
    }

    await AuditService.log({
      consultancyId,
      actorUserId,
      action: "document.version.confirmed",
      entityType: "DocumentVersion",
      entityId: version.id,
      meta: {
        requestId: auditCtx.requestId,
        sizeBytes: String(head.sizeBytes),
      },
      ip: auditCtx.ip,
      userAgent: auditCtx.userAgent,
    });

    return confirmed;
  }

  static async signDownload(
    consultancyId: string,
    documentVersionId: string,
    expiresInSeconds?: number,
  ) {
    const version = await DocumentRepository.findVersionById(consultancyId, documentVersionId);
    if (!version || version.uploadState !== DocumentUploadState.CONFIRMED) {
      throw new AppError(404, "VERSION_NOT_FOUND", "Document version not found");
    }

    const signed = await storageService.signDownload({
      bucket: version.bucket,
      objectKey: version.objectKey,
      expiresInSeconds,
    });

    return {
      documentVersionId: version.id,
      downloadUrl: signed.downloadUrl,
      expiresInSeconds: signed.expiresInSeconds,
    };
  }

  static async verifyDocument(
    consultancyId: string,
    versionId: string,
    actorUserId: string,
    payload: { status: DocumentVerificationStatus; reason?: string },
    auditCtx: { ip?: string; userAgent?: string; requestId?: string },
  ) {
    const version = await DocumentRepository.findVersionById(consultancyId, versionId);
    if (!version) {
      throw new AppError(404, "VERSION_NOT_FOUND", "Document version not found");
    }

    if (payload.status === DocumentVerificationStatus.REJECTED && !payload.reason) {
      throw new AppError(400, "REASON_REQUIRED", "Reason is required for rejection");
    }

    const verification = await DocumentRepository.createVerification({
      consultancyId,
      documentVersionId: versionId,
      verifiedByUserId: actorUserId,
      status: payload.status,
      reason: payload.reason,
    });

    await DocumentRepository.applyVerificationOutcome(consultancyId, versionId, payload.status);

    await AuditService.log({
      consultancyId,
      actorUserId,
      action: payload.status === DocumentVerificationStatus.VERIFIED ? "document.verified" : "document.rejected",
      entityType: "DocumentVersion",
      entityId: versionId,
      meta: {
        requestId: auditCtx.requestId,
        verificationId: verification.id,
      },
      ip: auditCtx.ip,
      userAgent: auditCtx.userAgent,
    });

    return verification;
  }
}

import crypto from "crypto";
import { env } from "../config/env";
import { storageProvider } from "../config/providers";
import { AppError } from "../utils/errors";
import { ProfileRepository } from "../repositories/profile.repository";
import { StorageService } from "./storage.service";
import { AuditService } from "./audit.service";

const storageService = new StorageService(storageProvider);

export class ProfileService {
  static async signUserProfileUpload(params: {
    consultancyId: string;
    userId: string;
    fileName: string;
    mimeType: string;
    sizeBytes: number;
    expiresInSeconds?: number;
  }) {
    const user = await ProfileRepository.findUserById(params.consultancyId, params.userId);
    if (!user) {
      throw new AppError(404, "USER_NOT_FOUND", "User not found");
    }

    const safeFileName = storageService.validateProfileUploadInput({
      fileName: params.fileName,
      mimeType: params.mimeType,
      sizeBytes: params.sizeBytes,
    });

    const objectKey = storageService.buildUserProfileObjectKey({
      consultancyId: params.consultancyId,
      userId: params.userId,
      fileName: `${crypto.randomUUID()}-${safeFileName}`,
    });

    const signed = await storageService.signUpload({
      bucket: env.STORAGE_BUCKET,
      objectKey,
      mimeType: params.mimeType,
      expiresInSeconds: params.expiresInSeconds,
    });

    return {
      bucket: env.STORAGE_BUCKET,
      objectKey,
      uploadUrl: signed.uploadUrl,
      expiresInSeconds: signed.expiresInSeconds,
    };
  }

  static async confirmUserProfileUpload(params: {
    consultancyId: string;
    userId: string;
    objectKey: string;
    mimeType: string;
    actorUserId: string;
    ip?: string;
    userAgent?: string;
    requestId?: string;
  }) {
    this.assertObjectKeyPrefix(
      params.objectKey,
      `${params.consultancyId}/users/${params.userId}/profile/`,
    );

    let head;
    try {
      head = await storageService.headObject({ bucket: env.STORAGE_BUCKET, objectKey: params.objectKey });
    } catch {
      throw new AppError(400, "UPLOAD_NOT_FOUND", "Uploaded object was not found");
    }

    const updated = await ProfileRepository.updateUserProfile(params.consultancyId, params.userId, {
      objectKey: params.objectKey,
      mimeType: params.mimeType,
      sizeBytes: head.sizeBytes,
    });

    if (updated.count === 0) {
      throw new AppError(404, "USER_NOT_FOUND", "User not found");
    }

    await AuditService.log({
      consultancyId: params.consultancyId,
      actorUserId: params.actorUserId,
      action: "user.profile.updated",
      entityType: "User",
      entityId: params.userId,
      meta: { objectKey: params.objectKey, requestId: params.requestId },
      ip: params.ip,
      userAgent: params.userAgent,
    });

    return {
      userId: params.userId,
      bucket: env.STORAGE_BUCKET,
      objectKey: params.objectKey,
      sizeBytes: String(head.sizeBytes),
    };
  }

  static async signUserProfileDownload(params: {
    consultancyId: string;
    userId: string;
    expiresInSeconds?: number;
  }) {
    const user = await ProfileRepository.findUserById(params.consultancyId, params.userId);
    if (!user || !user.profileImageObjectKey) {
      throw new AppError(404, "PROFILE_IMAGE_NOT_FOUND", "Profile image not found");
    }

    const signed = await storageService.signDownload({
      bucket: env.STORAGE_BUCKET,
      objectKey: user.profileImageObjectKey,
      expiresInSeconds: params.expiresInSeconds,
    });

    return {
      userId: params.userId,
      bucket: env.STORAGE_BUCKET,
      objectKey: user.profileImageObjectKey,
      downloadUrl: signed.downloadUrl,
      expiresInSeconds: signed.expiresInSeconds,
    };
  }

  static async signStudentProfileUpload(params: {
    consultancyId: string;
    studentId: string;
    fileName: string;
    mimeType: string;
    sizeBytes: number;
    expiresInSeconds?: number;
  }) {
    const student = await ProfileRepository.findStudentById(params.consultancyId, params.studentId);
    if (!student) {
      throw new AppError(404, "STUDENT_NOT_FOUND", "Student not found");
    }

    const safeFileName = storageService.validateProfileUploadInput({
      fileName: params.fileName,
      mimeType: params.mimeType,
      sizeBytes: params.sizeBytes,
    });

    const objectKey = storageService.buildStudentProfileObjectKey({
      consultancyId: params.consultancyId,
      studentId: params.studentId,
      fileName: `${crypto.randomUUID()}-${safeFileName}`,
    });

    const signed = await storageService.signUpload({
      bucket: env.STORAGE_BUCKET,
      objectKey,
      mimeType: params.mimeType,
      expiresInSeconds: params.expiresInSeconds,
    });

    return {
      bucket: env.STORAGE_BUCKET,
      objectKey,
      uploadUrl: signed.uploadUrl,
      expiresInSeconds: signed.expiresInSeconds,
    };
  }

  static async confirmStudentProfileUpload(params: {
    consultancyId: string;
    studentId: string;
    objectKey: string;
    mimeType: string;
    actorUserId: string;
    ip?: string;
    userAgent?: string;
    requestId?: string;
  }) {
    this.assertObjectKeyPrefix(
      params.objectKey,
      `${params.consultancyId}/students/${params.studentId}/profile/`,
    );

    let head;
    try {
      head = await storageService.headObject({ bucket: env.STORAGE_BUCKET, objectKey: params.objectKey });
    } catch {
      throw new AppError(400, "UPLOAD_NOT_FOUND", "Uploaded object was not found");
    }

    const updated = await ProfileRepository.updateStudentProfile(params.consultancyId, params.studentId, {
      objectKey: params.objectKey,
      mimeType: params.mimeType,
      sizeBytes: head.sizeBytes,
    });

    if (updated.count === 0) {
      throw new AppError(404, "STUDENT_NOT_FOUND", "Student not found");
    }

    await AuditService.log({
      consultancyId: params.consultancyId,
      actorUserId: params.actorUserId,
      action: "student.profile.updated",
      entityType: "Student",
      entityId: params.studentId,
      meta: { objectKey: params.objectKey, requestId: params.requestId },
      ip: params.ip,
      userAgent: params.userAgent,
    });

    return {
      studentId: params.studentId,
      bucket: env.STORAGE_BUCKET,
      objectKey: params.objectKey,
      sizeBytes: String(head.sizeBytes),
    };
  }

  static async signStudentProfileDownload(params: {
    consultancyId: string;
    studentId: string;
    expiresInSeconds?: number;
  }) {
    const student = await ProfileRepository.findStudentById(params.consultancyId, params.studentId);
    if (!student || !student.profileImageObjectKey) {
      throw new AppError(404, "PROFILE_IMAGE_NOT_FOUND", "Profile image not found");
    }

    const signed = await storageService.signDownload({
      bucket: env.STORAGE_BUCKET,
      objectKey: student.profileImageObjectKey,
      expiresInSeconds: params.expiresInSeconds,
    });

    return {
      studentId: params.studentId,
      bucket: env.STORAGE_BUCKET,
      objectKey: student.profileImageObjectKey,
      downloadUrl: signed.downloadUrl,
      expiresInSeconds: signed.expiresInSeconds,
    };
  }

  private static assertObjectKeyPrefix(objectKey: string, prefix: string) {
    if (!objectKey.startsWith(prefix)) {
      throw new AppError(400, "INVALID_OBJECT_KEY", "Invalid object key");
    }
  }
}

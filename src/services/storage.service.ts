import { env } from "../config/env";
import { AppError } from "../utils/errors";
import { sanitizeFileName } from "../utils/crypto";
import { StorageProvider } from "./storage.provider";

const ALLOWED_MIME_TYPES = new Set(["application/pdf", "image/jpeg", "image/jpg", "image/png"]);
const ALLOWED_PROFILE_MIME_TYPES = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);

export class StorageService {
  constructor(private readonly provider: StorageProvider) {}

  validateUploadInput(input: { mimeType: string; sizeBytes: number; fileName: string }) {
    if (!ALLOWED_MIME_TYPES.has(input.mimeType)) {
      throw new AppError(400, "INVALID_MIME_TYPE", "Unsupported file type");
    }

    if (input.sizeBytes <= 0 || input.sizeBytes > env.STORAGE_MAX_FILE_SIZE_BYTES) {
      throw new AppError(400, "INVALID_FILE_SIZE", "Invalid file size");
    }

    const safeFileName = sanitizeFileName(input.fileName);
    if (!safeFileName) {
      throw new AppError(400, "INVALID_FILE_NAME", "Invalid file name");
    }

    return safeFileName;
  }

  validateProfileUploadInput(input: { mimeType: string; sizeBytes: number; fileName: string }) {
    if (!ALLOWED_PROFILE_MIME_TYPES.has(input.mimeType)) {
      throw new AppError(400, "INVALID_MIME_TYPE", "Unsupported profile image type");
    }

    if (input.sizeBytes <= 0 || input.sizeBytes > env.STORAGE_MAX_FILE_SIZE_BYTES) {
      throw new AppError(400, "INVALID_FILE_SIZE", "Invalid file size");
    }

    const safeFileName = sanitizeFileName(input.fileName);
    if (!safeFileName) {
      throw new AppError(400, "INVALID_FILE_NAME", "Invalid file name");
    }

    return safeFileName;
  }

  buildDocumentObjectKey(params: {
    consultancyId: string;
    studentId: string;
    documentTypeKey: string;
    documentVersionId: string;
    fileName: string;
  }) {
    return `${params.consultancyId}/students/${params.studentId}/documents/${params.documentTypeKey}/${params.documentVersionId}/${params.fileName}`;
  }

  buildBrandingObjectKey(params: { consultancyId: string; fileName: string }) {
    return `${params.consultancyId}/branding/${params.fileName}`;
  }

  buildUserProfileObjectKey(params: { consultancyId: string; userId: string; fileName: string }) {
    return `${params.consultancyId}/users/${params.userId}/profile/${params.fileName}`;
  }

  buildStudentProfileObjectKey(params: { consultancyId: string; studentId: string; fileName: string }) {
    return `${params.consultancyId}/students/${params.studentId}/profile/${params.fileName}`;
  }

  buildStudentRequestObjectKey(params: {
    consultancyId: string;
    studentId: string;
    requestId: string;
    fileName: string;
  }) {
    return `${params.consultancyId}/students/${params.studentId}/requests/${params.requestId}/${params.fileName}`;
  }

  async signUpload(input: {
    bucket: string;
    objectKey: string;
    mimeType: string;
    expiresInSeconds?: number;
  }) {
    const expiresInSeconds = this.resolveExpiry(input.expiresInSeconds);
    const uploadUrl = await this.provider.getSignedUploadUrl({
      bucket: input.bucket,
      objectKey: input.objectKey,
      mimeType: input.mimeType,
      expiresInSeconds,
    });

    return {
      uploadUrl,
      expiresInSeconds,
    };
  }

  async signDownload(input: { bucket: string; objectKey: string; expiresInSeconds?: number }) {
    const expiresInSeconds = this.resolveExpiry(input.expiresInSeconds);
    const downloadUrl = await this.provider.getSignedDownloadUrl({
      bucket: input.bucket,
      objectKey: input.objectKey,
      expiresInSeconds,
    });

    return {
      downloadUrl,
      expiresInSeconds,
    };
  }

  async headObject(input: { bucket: string; objectKey: string }) {
    return this.provider.headObject({
      bucket: input.bucket,
      objectKey: input.objectKey,
    });
  }

  private resolveExpiry(requested?: number): number {
    const base = requested ?? env.STORAGE_SIGNED_URL_EXPIRES_SECONDS;
    return Math.max(60, Math.min(base, env.STORAGE_SIGNED_URL_MAX_EXPIRES_SECONDS));
  }
}

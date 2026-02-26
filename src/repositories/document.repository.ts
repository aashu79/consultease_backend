import {
  DocumentRequestStatus,
  DocumentUploadState,
  DocumentVerificationStatus,
  Prisma,
  StorageProvider,
} from "@prisma/client";
import { prisma } from "../config/prisma";

export class DocumentRepository {
  static createRequest(data: Prisma.DocumentRequestUncheckedCreateInput) {
    return prisma.documentRequest.create({ data });
  }

  static listRequests(consultancyId: string, studentId: string) {
    return prisma.documentRequest.findMany({
      where: { consultancyId, studentId },
      orderBy: { createdAt: "desc" },
      include: {
        versions: {
          include: {
            verifications: { orderBy: { createdAt: "desc" }, take: 1 },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });
  }

  static findRequestById(consultancyId: string, requestId: string) {
    return prisma.documentRequest.findFirst({ where: { id: requestId, consultancyId } });
  }

  static updateRequest(consultancyId: string, requestId: string, data: Prisma.DocumentRequestUpdateInput) {
    return prisma.documentRequest.updateMany({ where: { id: requestId, consultancyId }, data });
  }

  static cancelRequest(consultancyId: string, requestId: string) {
    return prisma.documentRequest.updateMany({
      where: { id: requestId, consultancyId, status: { not: DocumentRequestStatus.CANCELLED } },
      data: { status: DocumentRequestStatus.CANCELLED },
    });
  }

  static createOrFindDocumentFile(consultancyId: string, studentId: string, documentTypeKey: string) {
    return prisma.documentFile.upsert({
      where: {
        consultancyId_studentId_documentTypeKey: {
          consultancyId,
          studentId,
          documentTypeKey,
        },
      },
      create: { consultancyId, studentId, documentTypeKey },
      update: {},
    });
  }

  static async nextVersionNumber(documentFileId: string): Promise<number> {
    const latest = await prisma.documentVersion.findFirst({
      where: { documentFileId },
      orderBy: { versionNumber: "desc" },
      select: { versionNumber: true },
    });
    return (latest?.versionNumber ?? 0) + 1;
  }

  static createVersion(data: {
    id?: string;
    consultancyId: string;
    documentFileId: string;
    uploadedByUserId?: string;
    uploadedByStudentId?: string;
    requestId?: string;
    versionNumber: number;
    fileName: string;
    mimeType: string;
    sizeBytes: bigint;
    bucket: string;
    objectKey: string;
  }) {
    return prisma.documentVersion.create({
      data: {
        id: data.id,
        consultancyId: data.consultancyId,
        documentFileId: data.documentFileId,
        uploadedByUserId: data.uploadedByUserId,
        uploadedByStudentId: data.uploadedByStudentId,
        requestId: data.requestId,
        versionNumber: data.versionNumber,
        fileName: data.fileName,
        mimeType: data.mimeType,
        sizeBytes: data.sizeBytes,
        bucket: data.bucket,
        objectKey: data.objectKey,
        storageProvider: StorageProvider.MINIO,
        uploadState: DocumentUploadState.UPLOADING,
      },
    });
  }

  static updateVersion(
    consultancyId: string,
    versionId: string,
    data: Prisma.DocumentVersionUpdateInput,
  ) {
    return prisma.documentVersion.updateMany({
      where: { id: versionId, consultancyId },
      data,
    });
  }

  static findVersionById(consultancyId: string, versionId: string) {
    return prisma.documentVersion.findFirst({
      where: { id: versionId, consultancyId },
      include: {
        documentFile: true,
        request: true,
        verifications: {
          orderBy: { createdAt: "desc" },
        },
      },
    });
  }

  static async confirmUpload(consultancyId: string, versionId: string, actualSize: bigint, checksum?: string | null) {
    return prisma.$transaction(async (tx) => {
      const version = await tx.documentVersion.findFirst({
        where: {
          id: versionId,
          consultancyId,
        },
      });

      if (!version) {
        return null;
      }

      const updatedVersion = await tx.documentVersion.update({
        where: { id: version.id },
        data: {
          sizeBytes: actualSize,
          checksumSha256: checksum,
          uploadState: DocumentUploadState.CONFIRMED,
        },
      });

      await tx.documentFile.update({
        where: { id: version.documentFileId },
        data: { currentVersionId: version.id },
      });

      if (version.uploadedByUserId) {
        await tx.documentVerification.create({
          data: {
            consultancyId,
            documentVersionId: version.id,
            verifiedByUserId: version.uploadedByUserId,
            status: DocumentVerificationStatus.PENDING,
          },
        });
      }

      if (version.requestId) {
        await tx.documentRequest.updateMany({
          where: { id: version.requestId, consultancyId, status: { in: [DocumentRequestStatus.OPEN, DocumentRequestStatus.PARTIALLY_SUBMITTED] } },
          data: { status: DocumentRequestStatus.SUBMITTED },
        });
      }

      return updatedVersion;
    });
  }

  static createVerification(data: {
    consultancyId: string;
    documentVersionId: string;
    verifiedByUserId: string;
    status: DocumentVerificationStatus;
    reason?: string;
  }) {
    return prisma.documentVerification.create({
      data,
    });
  }

  static async applyVerificationOutcome(
    consultancyId: string,
    versionId: string,
    status: DocumentVerificationStatus,
  ) {
    const version = await prisma.documentVersion.findFirst({
      where: { id: versionId, consultancyId },
      select: { requestId: true },
    });

    if (!version?.requestId) {
      return;
    }

    if (status === DocumentVerificationStatus.VERIFIED) {
      await prisma.documentRequest.updateMany({
        where: { id: version.requestId, consultancyId },
        data: { status: DocumentRequestStatus.FULFILLED },
      });
    }
  }
}

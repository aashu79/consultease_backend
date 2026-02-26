import { prisma } from "../config/prisma";

export class ProfileRepository {
  static findUserById(consultancyId: string, userId: string) {
    return prisma.user.findFirst({
      where: { id: userId, consultancyId, deletedAt: null },
      select: {
        id: true,
        profileImageObjectKey: true,
        profileImageMimeType: true,
        profileImageSizeBytes: true,
        profileImageUpdatedAt: true,
      },
    });
  }

  static updateUserProfile(
    consultancyId: string,
    userId: string,
    data: { objectKey: string; mimeType: string; sizeBytes: bigint },
  ) {
    return prisma.user.updateMany({
      where: { id: userId, consultancyId, deletedAt: null },
      data: {
        profileImageObjectKey: data.objectKey,
        profileImageMimeType: data.mimeType,
        profileImageSizeBytes: data.sizeBytes,
        profileImageUpdatedAt: new Date(),
      },
    });
  }

  static findStudentById(consultancyId: string, studentId: string) {
    return prisma.student.findFirst({
      where: { id: studentId, consultancyId },
      select: {
        id: true,
        profileImageObjectKey: true,
        profileImageMimeType: true,
        profileImageSizeBytes: true,
        profileImageUpdatedAt: true,
      },
    });
  }

  static updateStudentProfile(
    consultancyId: string,
    studentId: string,
    data: { objectKey: string; mimeType: string; sizeBytes: bigint },
  ) {
    return prisma.student.updateMany({
      where: { id: studentId, consultancyId },
      data: {
        profileImageObjectKey: data.objectKey,
        profileImageMimeType: data.mimeType,
        profileImageSizeBytes: data.sizeBytes,
        profileImageUpdatedAt: new Date(),
      },
    });
  }
}

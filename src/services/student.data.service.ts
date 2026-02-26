import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";

const detailedProfileInclude: Prisma.StudentInclude = {
  portalUser: {
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      status: true,
      authIdentity: {
        select: {
          emailVerifiedAt: true,
          phoneVerifiedAt: true,
        },
      },
    },
  },
  assignments: true,
  cases: { orderBy: { createdAt: "desc" } },
  educationRecords: { orderBy: [{ year: "desc" }, { createdAt: "desc" }] },
  testScores: { orderBy: [{ testDate: "desc" }, { createdAt: "desc" }] },
};

export class StudentDataService {
  static create(data: Prisma.StudentUncheckedCreateInput) {
    return prisma.student.create({ data });
  }

  static list(
    consultancyId: string,
    params: { search?: string; skip: number; take: number },
  ) {
    return prisma.student.findMany({
      where: {
        consultancyId,
        OR: params.search
          ? [
              { fullName: { contains: params.search, mode: "insensitive" } },
              { email: { contains: params.search, mode: "insensitive" } },
              { phone: { contains: params.search, mode: "insensitive" } },
            ]
          : undefined,
      },
      skip: params.skip,
      take: params.take,
      orderBy: { createdAt: "desc" },
    });
  }

  static findById(consultancyId: string, studentId: string) {
    return prisma.student.findFirst({
      where: { id: studentId, consultancyId },
      include: {
        portalUser: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            status: true,
          },
        },
        assignments: true,
        cases: { orderBy: { createdAt: "desc" } },
      },
    });
  }

  static findByPortalUserId(consultancyId: string, portalUserId: string) {
    return prisma.student.findFirst({
      where: { consultancyId, portalUserId },
    });
  }

  static findDetailedProfile(consultancyId: string, studentId: string) {
    return prisma.student.findFirst({
      where: { id: studentId, consultancyId },
      include: detailedProfileInclude,
    });
  }

  static upsertDetailedProfile(
    consultancyId: string,
    studentId: string,
    payload: {
      studentData: Prisma.StudentUpdateInput;
      educationRecords?: Array<{
        level: string;
        institution: string;
        board?: string | null;
        score?: string | null;
        year?: number | null;
      }>;
      testScores?: Array<{
        testName: string;
        score: string;
        testDate?: Date | null;
      }>;
    },
  ) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.student.findFirst({
        where: { id: studentId, consultancyId },
      });

      if (!existing) {
        return null;
      }

      await tx.student.update({
        where: { id: studentId },
        data: payload.studentData,
      });

      if (payload.educationRecords) {
        await tx.educationRecord.deleteMany({
          where: { consultancyId, studentId },
        });

        if (payload.educationRecords.length > 0) {
          await tx.educationRecord.createMany({
            data: payload.educationRecords.map((record) => ({
              consultancyId,
              studentId,
              level: record.level,
              institution: record.institution,
              board: record.board ?? null,
              score: record.score ?? null,
              year: record.year ?? null,
            })),
          });
        }
      }

      if (payload.testScores) {
        await tx.testScore.deleteMany({
          where: { consultancyId, studentId },
        });

        if (payload.testScores.length > 0) {
          await tx.testScore.createMany({
            data: payload.testScores.map((score) => ({
              consultancyId,
              studentId,
              testName: score.testName,
              score: score.score,
              testDate: score.testDate ?? null,
            })),
          });
        }
      }

      return tx.student.findFirst({
        where: { id: studentId, consultancyId },
        include: detailedProfileInclude,
      });
    });
  }

  static update(consultancyId: string, studentId: string, data: Prisma.StudentUpdateInput) {
    return prisma.student.updateMany({ where: { id: studentId, consultancyId }, data });
  }

  static listEducationRecords(consultancyId: string, studentId: string) {
    return prisma.educationRecord.findMany({
      where: { consultancyId, studentId },
      orderBy: [{ year: "desc" }, { createdAt: "desc" }],
    });
  }

  static createEducationRecord(data: Prisma.EducationRecordUncheckedCreateInput) {
    return prisma.educationRecord.create({ data });
  }

  static updateEducationRecord(
    consultancyId: string,
    studentId: string,
    educationRecordId: string,
    data: Prisma.EducationRecordUpdateInput,
  ) {
    return prisma.educationRecord.updateMany({
      where: { id: educationRecordId, consultancyId, studentId },
      data,
    });
  }

  static deleteEducationRecord(
    consultancyId: string,
    studentId: string,
    educationRecordId: string,
  ) {
    return prisma.educationRecord.deleteMany({
      where: { id: educationRecordId, consultancyId, studentId },
    });
  }

  static listTestScores(consultancyId: string, studentId: string) {
    return prisma.testScore.findMany({
      where: { consultancyId, studentId },
      orderBy: [{ testDate: "desc" }, { createdAt: "desc" }],
    });
  }

  static createTestScore(data: Prisma.TestScoreUncheckedCreateInput) {
    return prisma.testScore.create({ data });
  }

  static updateTestScore(
    consultancyId: string,
    studentId: string,
    testScoreId: string,
    data: Prisma.TestScoreUpdateInput,
  ) {
    return prisma.testScore.updateMany({
      where: { id: testScoreId, consultancyId, studentId },
      data,
    });
  }

  static deleteTestScore(
    consultancyId: string,
    studentId: string,
    testScoreId: string,
  ) {
    return prisma.testScore.deleteMany({
      where: { id: testScoreId, consultancyId, studentId },
    });
  }

  static createCase(data: Prisma.StudentCaseUncheckedCreateInput) {
    return prisma.studentCase.create({ data });
  }

  static updateCase(consultancyId: string, caseId: string, data: Prisma.StudentCaseUpdateInput) {
    return prisma.studentCase.updateMany({ where: { id: caseId, consultancyId }, data });
  }

  static upsertAssignment(
    consultancyId: string,
    studentId: string,
    data: { counselorId?: string | null; docOfficerId?: string | null; visaOfficerId?: string | null },
  ) {
    return prisma.studentAssignment.upsert({
      where: { consultancyId_studentId: { consultancyId, studentId } },
      create: {
        consultancyId,
        studentId,
        counselorId: data.counselorId ?? null,
        docOfficerId: data.docOfficerId ?? null,
        visaOfficerId: data.visaOfficerId ?? null,
      },
      update: {
        counselorId: data.counselorId,
        docOfficerId: data.docOfficerId,
        visaOfficerId: data.visaOfficerId,
      },
    });
  }

  static getDashboard(consultancyId: string, studentId: string) {
    return prisma.student.findFirst({
      where: { id: studentId, consultancyId },
      include: {
        cases: { orderBy: { updatedAt: "desc" }, take: 5 },
        documentRequests: {
          orderBy: { createdAt: "desc" },
          include: {
            versions: {
              orderBy: { createdAt: "desc" },
              include: {
                verifications: {
                  orderBy: { createdAt: "desc" },
                  take: 1,
                },
              },
            },
          },
        },
        documentFiles: {
          include: {
            currentVersion: {
              include: {
                verifications: { orderBy: { createdAt: "desc" }, take: 1 },
              },
            },
          },
        },
      },
    });
  }

  static getPortalAccount(consultancyId: string, studentId: string) {
    return prisma.student.findFirst({
      where: { id: studentId, consultancyId },
      select: {
        id: true,
        portalUserId: true,
        portalUser: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            status: true,
            authIdentity: {
              select: {
                emailVerifiedAt: true,
                phoneVerifiedAt: true,
              },
            },
          },
        },
      },
    });
  }

  static linkPortalUser(consultancyId: string, studentId: string, portalUserId: string) {
    return prisma.student.updateMany({
      where: { consultancyId, id: studentId },
      data: { portalUserId },
    });
  }
}


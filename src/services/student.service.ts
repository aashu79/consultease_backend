import { OtpChannel, OtpPurpose, Prisma, StudentCaseStatus, StudentStatus, UserStatus } from "@prisma/client";
import { prisma } from "../config/prisma";
import { StudentDataService } from "./student.data.service";
import { getPagination } from "../utils/pagination";
import { AppError } from "../utils/errors";
import { AuditService } from "./audit.service";
import { hashValue } from "../utils/crypto";
import { UserRepository } from "../repositories/user.repository";
import { AuthService } from "./auth.service";

export class StudentService {
  private static throwIfPortalUniqueConstraint(error: unknown): never {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const target = Array.isArray(error.meta?.target)
        ? error.meta.target.map((item) => String(item))
        : [];

      if (target.includes("email")) {
        throw new AppError(409, "USER_EXISTS", "A user with this email already exists");
      }

      if (target.includes("phone")) {
        throw new AppError(409, "PHONE_ALREADY_IN_USE", "A user with this phone already exists");
      }

      throw new AppError(409, "DUPLICATE_VALUE", "Duplicate value violates unique constraint");
    }

    throw error;
  }

  static async createStudent(
    consultancyId: string,
    payload: {
      fullName: string;
      dob?: string;
      gender?: string;
      email?: string;
      phone?: string;
      address?: string;
      passportNo?: string;
      passportExpiry?: string;
      nationality?: string;
      status?: StudentStatus;
    },
    actorUserId: string,
    auditCtx: { ip?: string; userAgent?: string; requestId?: string },
  ) {
    const student = await StudentDataService.create({
      consultancyId,
      fullName: payload.fullName,
      dob: payload.dob ? new Date(payload.dob) : undefined,
      gender: payload.gender,
      email: payload.email?.toLowerCase(),
      phone: payload.phone,
      address: payload.address,
      passportNo: payload.passportNo,
      passportExpiry: payload.passportExpiry ? new Date(payload.passportExpiry) : undefined,
      nationality: payload.nationality,
      status: payload.status ?? StudentStatus.ACTIVE,
    });

    await AuditService.log({
      consultancyId,
      actorUserId,
      action: "student.created",
      entityType: "Student",
      entityId: student.id,
      meta: { requestId: auditCtx.requestId },
      ip: auditCtx.ip,
      userAgent: auditCtx.userAgent,
    });

    return student;
  }

  static async listStudents(
    consultancyId: string,
    query: { search?: string; page?: string; limit?: string },
  ) {
    const { page, limit, skip } = getPagination({ page: query.page, limit: query.limit });
    const items = await StudentDataService.list(consultancyId, {
      search: query.search,
      skip,
      take: limit,
    });

    return { items, page, limit };
  }

  static async getStudent(consultancyId: string, studentId: string) {
    const student = await StudentDataService.findById(consultancyId, studentId);
    if (!student) {
      throw new AppError(404, "STUDENT_NOT_FOUND", "Student not found");
    }
    return student;
  }

  static async updateStudent(
    consultancyId: string,
    studentId: string,
    payload: {
      fullName?: string;
      dob?: string;
      gender?: string;
      email?: string;
      phone?: string;
      address?: string;
      passportNo?: string;
      passportExpiry?: string;
      nationality?: string;
      status?: StudentStatus;
    },
    actorUserId: string,
    auditCtx: { ip?: string; userAgent?: string; requestId?: string },
  ) {
    const updated = await StudentDataService.update(consultancyId, studentId, {
      fullName: payload.fullName,
      dob: payload.dob ? new Date(payload.dob) : undefined,
      gender: payload.gender,
      email: payload.email,
      phone: payload.phone,
      address: payload.address,
      passportNo: payload.passportNo,
      passportExpiry: payload.passportExpiry ? new Date(payload.passportExpiry) : undefined,
      nationality: payload.nationality,
      status: payload.status,
    });

    if (updated.count === 0) {
      throw new AppError(404, "STUDENT_NOT_FOUND", "Student not found");
    }

    await AuditService.log({
      consultancyId,
      actorUserId,
      action: "student.updated",
      entityType: "Student",
      entityId: studentId,
      meta: { ...payload, requestId: auditCtx.requestId },
      ip: auditCtx.ip,
      userAgent: auditCtx.userAgent,
    });

    return { studentId };
  }

  static async getDetailedProfile(consultancyId: string, studentId: string) {
    const profile = await StudentDataService.findDetailedProfile(consultancyId, studentId);
    if (!profile) {
      throw new AppError(404, "STUDENT_NOT_FOUND", "Student not found");
    }
    return profile;
  }

  static async upsertDetailedProfile(
    consultancyId: string,
    studentId: string,
    payload: {
      fullName?: string;
      dob?: string;
      gender?: string;
      email?: string;
      phone?: string;
      address?: string;
      passportNo?: string;
      passportExpiry?: string;
      nationality?: string;
      status?: StudentStatus;
      educationRecords?: Array<{
        level: string;
        institution: string;
        board?: string;
        score?: string;
        year?: number;
      }>;
      testScores?: Array<{
        testName: string;
        score: string;
        testDate?: string;
      }>;
    },
    actorUserId: string,
    auditCtx: { ip?: string; userAgent?: string; requestId?: string },
  ) {
    const profile = await StudentDataService.upsertDetailedProfile(consultancyId, studentId, {
      studentData: {
        fullName: payload.fullName,
        dob: payload.dob ? new Date(payload.dob) : undefined,
        gender: payload.gender,
        email: payload.email?.toLowerCase(),
        phone: payload.phone,
        address: payload.address,
        passportNo: payload.passportNo,
        passportExpiry: payload.passportExpiry ? new Date(payload.passportExpiry) : undefined,
        nationality: payload.nationality,
        status: payload.status,
      },
      educationRecords: payload.educationRecords?.map((record) => ({
        level: record.level,
        institution: record.institution,
        board: record.board,
        score: record.score,
        year: record.year,
      })),
      testScores: payload.testScores?.map((testScore) => ({
        testName: testScore.testName,
        score: testScore.score,
        testDate: testScore.testDate ? new Date(testScore.testDate) : undefined,
      })),
    });

    if (!profile) {
      throw new AppError(404, "STUDENT_NOT_FOUND", "Student not found");
    }

    await AuditService.log({
      consultancyId,
      actorUserId,
      action: "student.profile.upserted",
      entityType: "Student",
      entityId: studentId,
      meta: {
        educationRecordsCount: payload.educationRecords?.length,
        testScoresCount: payload.testScores?.length,
        requestId: auditCtx.requestId,
      },
      ip: auditCtx.ip,
      userAgent: auditCtx.userAgent,
    });

    return profile;
  }

  static async listEducationRecords(consultancyId: string, studentId: string) {
    await this.getStudent(consultancyId, studentId);
    return StudentDataService.listEducationRecords(consultancyId, studentId);
  }

  static async createEducationRecord(
    consultancyId: string,
    studentId: string,
    payload: {
      level: string;
      institution: string;
      board?: string;
      score?: string;
      year?: number;
    },
    actorUserId: string,
    auditCtx: { ip?: string; userAgent?: string; requestId?: string },
  ) {
    await this.getStudent(consultancyId, studentId);

    const educationRecord = await StudentDataService.createEducationRecord({
      consultancyId,
      studentId,
      level: payload.level,
      institution: payload.institution,
      board: payload.board,
      score: payload.score,
      year: payload.year,
    });

    await AuditService.log({
      consultancyId,
      actorUserId,
      action: "student.education.created",
      entityType: "EducationRecord",
      entityId: educationRecord.id,
      meta: { studentId, requestId: auditCtx.requestId },
      ip: auditCtx.ip,
      userAgent: auditCtx.userAgent,
    });

    return educationRecord;
  }

  static async updateEducationRecord(
    consultancyId: string,
    studentId: string,
    educationRecordId: string,
    payload: {
      level?: string;
      institution?: string;
      board?: string;
      score?: string;
      year?: number;
    },
    actorUserId: string,
    auditCtx: { ip?: string; userAgent?: string; requestId?: string },
  ) {
    const updated = await StudentDataService.updateEducationRecord(
      consultancyId,
      studentId,
      educationRecordId,
      {
        level: payload.level,
        institution: payload.institution,
        board: payload.board,
        score: payload.score,
        year: payload.year,
      },
    );

    if (updated.count === 0) {
      throw new AppError(404, "EDUCATION_RECORD_NOT_FOUND", "Education record not found");
    }

    await AuditService.log({
      consultancyId,
      actorUserId,
      action: "student.education.updated",
      entityType: "EducationRecord",
      entityId: educationRecordId,
      meta: { studentId, ...payload, requestId: auditCtx.requestId },
      ip: auditCtx.ip,
      userAgent: auditCtx.userAgent,
    });

    return { educationRecordId };
  }

  static async deleteEducationRecord(
    consultancyId: string,
    studentId: string,
    educationRecordId: string,
    actorUserId: string,
    auditCtx: { ip?: string; userAgent?: string; requestId?: string },
  ) {
    const deleted = await StudentDataService.deleteEducationRecord(
      consultancyId,
      studentId,
      educationRecordId,
    );

    if (deleted.count === 0) {
      throw new AppError(404, "EDUCATION_RECORD_NOT_FOUND", "Education record not found");
    }

    await AuditService.log({
      consultancyId,
      actorUserId,
      action: "student.education.deleted",
      entityType: "EducationRecord",
      entityId: educationRecordId,
      meta: { studentId, requestId: auditCtx.requestId },
      ip: auditCtx.ip,
      userAgent: auditCtx.userAgent,
    });

    return { educationRecordId };
  }

  static async listTestScores(consultancyId: string, studentId: string) {
    await this.getStudent(consultancyId, studentId);
    return StudentDataService.listTestScores(consultancyId, studentId);
  }

  static async createTestScore(
    consultancyId: string,
    studentId: string,
    payload: {
      testName: string;
      score: string;
      testDate?: string;
    },
    actorUserId: string,
    auditCtx: { ip?: string; userAgent?: string; requestId?: string },
  ) {
    await this.getStudent(consultancyId, studentId);

    const testScore = await StudentDataService.createTestScore({
      consultancyId,
      studentId,
      testName: payload.testName,
      score: payload.score,
      testDate: payload.testDate ? new Date(payload.testDate) : undefined,
    });

    await AuditService.log({
      consultancyId,
      actorUserId,
      action: "student.test_score.created",
      entityType: "TestScore",
      entityId: testScore.id,
      meta: { studentId, requestId: auditCtx.requestId },
      ip: auditCtx.ip,
      userAgent: auditCtx.userAgent,
    });

    return testScore;
  }

  static async updateTestScore(
    consultancyId: string,
    studentId: string,
    testScoreId: string,
    payload: {
      testName?: string;
      score?: string;
      testDate?: string;
    },
    actorUserId: string,
    auditCtx: { ip?: string; userAgent?: string; requestId?: string },
  ) {
    const updated = await StudentDataService.updateTestScore(
      consultancyId,
      studentId,
      testScoreId,
      {
        testName: payload.testName,
        score: payload.score,
        testDate: payload.testDate ? new Date(payload.testDate) : undefined,
      },
    );

    if (updated.count === 0) {
      throw new AppError(404, "TEST_SCORE_NOT_FOUND", "Test score not found");
    }

    await AuditService.log({
      consultancyId,
      actorUserId,
      action: "student.test_score.updated",
      entityType: "TestScore",
      entityId: testScoreId,
      meta: { studentId, ...payload, requestId: auditCtx.requestId },
      ip: auditCtx.ip,
      userAgent: auditCtx.userAgent,
    });

    return { testScoreId };
  }

  static async deleteTestScore(
    consultancyId: string,
    studentId: string,
    testScoreId: string,
    actorUserId: string,
    auditCtx: { ip?: string; userAgent?: string; requestId?: string },
  ) {
    const deleted = await StudentDataService.deleteTestScore(
      consultancyId,
      studentId,
      testScoreId,
    );

    if (deleted.count === 0) {
      throw new AppError(404, "TEST_SCORE_NOT_FOUND", "Test score not found");
    }

    await AuditService.log({
      consultancyId,
      actorUserId,
      action: "student.test_score.deleted",
      entityType: "TestScore",
      entityId: testScoreId,
      meta: { studentId, requestId: auditCtx.requestId },
      ip: auditCtx.ip,
      userAgent: auditCtx.userAgent,
    });

    return { testScoreId };
  }

  static async createCase(
    consultancyId: string,
    studentId: string,
    payload: {
      intake: string;
      targetCountry: string;
      status?: StudentCaseStatus;
    },
    actorUserId: string,
    auditCtx: { ip?: string; userAgent?: string; requestId?: string },
  ) {
    await this.getStudent(consultancyId, studentId);

    const studentCase = await StudentDataService.createCase({
      consultancyId,
      studentId,
      intake: payload.intake,
      targetCountry: payload.targetCountry,
      status: payload.status ?? StudentCaseStatus.ACTIVE,
    });

    await AuditService.log({
      consultancyId,
      actorUserId,
      action: "case.created",
      entityType: "StudentCase",
      entityId: studentCase.id,
      meta: { studentId, requestId: auditCtx.requestId },
      ip: auditCtx.ip,
      userAgent: auditCtx.userAgent,
    });

    return studentCase;
  }

  static async updateCase(
    consultancyId: string,
    caseId: string,
    payload: {
      intake?: string;
      targetCountry?: string;
      status?: StudentCaseStatus;
    },
    actorUserId: string,
    auditCtx: { ip?: string; userAgent?: string; requestId?: string },
  ) {
    const updated = await StudentDataService.updateCase(consultancyId, caseId, {
      intake: payload.intake,
      targetCountry: payload.targetCountry,
      status: payload.status,
    });

    if (updated.count === 0) {
      throw new AppError(404, "CASE_NOT_FOUND", "Case not found");
    }

    await AuditService.log({
      consultancyId,
      actorUserId,
      action: "case.updated",
      entityType: "StudentCase",
      entityId: caseId,
      meta: { ...payload, requestId: auditCtx.requestId },
      ip: auditCtx.ip,
      userAgent: auditCtx.userAgent,
    });

    return { caseId };
  }

  static async assignStaff(
    consultancyId: string,
    studentId: string,
    payload: { counselorId?: string | null; docOfficerId?: string | null; visaOfficerId?: string | null },
    actorUserId: string,
    auditCtx: { ip?: string; userAgent?: string; requestId?: string },
  ) {
    await this.getStudent(consultancyId, studentId);

    const assignment = await StudentDataService.upsertAssignment(consultancyId, studentId, payload);

    await AuditService.log({
      consultancyId,
      actorUserId,
      action: "student.assignment.updated",
      entityType: "StudentAssignment",
      entityId: assignment.id,
      meta: { studentId, ...payload, requestId: auditCtx.requestId },
      ip: auditCtx.ip,
      userAgent: auditCtx.userAgent,
    });

    return assignment;
  }

  static async getPortalAccount(consultancyId: string, studentId: string) {
    const student = await StudentDataService.getPortalAccount(consultancyId, studentId);
    if (!student) {
      throw new AppError(404, "STUDENT_NOT_FOUND", "Student not found");
    }

    return {
      studentId: student.id,
      hasPortalAccount: Boolean(student.portalUser),
      portalAccount: student.portalUser
        ? {
            userId: student.portalUser.id,
            name: student.portalUser.name,
            email: student.portalUser.email,
            phone: student.portalUser.phone,
            status: student.portalUser.status,
            emailVerified: Boolean(student.portalUser.authIdentity?.emailVerifiedAt),
            phoneVerified: Boolean(student.portalUser.authIdentity?.phoneVerifiedAt),
          }
        : null,
    };
  }

  static async createPortalAccount(
    consultancyId: string,
    consultancySlug: string,
    studentId: string,
    payload: {
      email: string;
      password: string;
      name?: string;
      phone?: string;
      autoActivate?: boolean;
      sendVerificationOtp?: boolean;
    },
    actorUserId: string,
    auditCtx: { ip?: string; userAgent?: string; requestId?: string },
  ) {
    const student = await StudentDataService.findById(consultancyId, studentId);
    if (!student) {
      throw new AppError(404, "STUDENT_NOT_FOUND", "Student not found");
    }
    if (student.portalUserId) {
      throw new AppError(409, "PORTAL_ACCOUNT_EXISTS", "Student portal account already exists");
    }

    const email = payload.email.trim().toLowerCase();
    const existingUser = await UserRepository.findByEmail(consultancyId, email);
    if (existingUser) {
      throw new AppError(409, "USER_EXISTS", "A user with this email already exists");
    }

    let phoneToUse = payload.phone?.trim() || student.phone?.trim() || undefined;
    if (phoneToUse) {
      const existingPhoneUser = await UserRepository.findByPhone(consultancyId, phoneToUse);
      if (existingPhoneUser) {
        // If phone was explicitly requested, fail; if inherited from student profile, skip phone on user account.
        if (payload.phone?.trim()) {
          throw new AppError(409, "PHONE_ALREADY_IN_USE", "A user with this phone already exists");
        }
        phoneToUse = undefined;
      }
    }

    const autoActivate = payload.autoActivate ?? true;
    const sendVerificationOtp = payload.sendVerificationOtp ?? !autoActivate;
    const passwordHash = await hashValue(payload.password);

    let portalUser;
    try {
      portalUser = await prisma.$transaction(async (tx) => {
        const createdUser = await tx.user.create({
          data: {
            consultancyId,
            name: payload.name ?? student.fullName,
            email,
            phone: phoneToUse ?? null,
            status: autoActivate ? UserStatus.ACTIVE : UserStatus.PENDING_VERIFICATION,
          },
        });

        await tx.authIdentity.create({
          data: {
            consultancyId,
            userId: createdUser.id,
            email,
            phone: phoneToUse ?? null,
            emailVerifiedAt: autoActivate ? new Date() : null,
          },
        });

        await tx.authCredential.create({
          data: {
            consultancyId,
            userId: createdUser.id,
            passwordHash,
          },
        });

        await tx.student.update({
          where: { id: studentId },
          data: { portalUserId: createdUser.id },
        });

        return createdUser;
      });
    } catch (error) {
      this.throwIfPortalUniqueConstraint(error);
    }

    if (sendVerificationOtp) {
      await AuthService.requestOtp({
        consultancySlug,
        destination: email,
        channel: OtpChannel.EMAIL,
        purpose: OtpPurpose.VERIFY_EMAIL,
        ip: auditCtx.ip,
        userAgent: auditCtx.userAgent,
        actorUserId,
        requestId: auditCtx.requestId,
      });
    }

    await AuditService.log({
      consultancyId,
      actorUserId,
      action: "student.portal_account.created",
      entityType: "Student",
      entityId: studentId,
      meta: {
        portalUserId: portalUser.id,
        autoActivate,
        sendVerificationOtp,
        requestId: auditCtx.requestId,
      },
      ip: auditCtx.ip,
      userAgent: auditCtx.userAgent,
    });

    return {
      studentId,
      portalUserId: portalUser.id,
      consultancySlug,
      email,
      status: portalUser.status,
      requiresEmailVerification: !autoActivate,
    };
  }

  static async updatePortalAccount(
    consultancyId: string,
    consultancySlug: string,
    studentId: string,
    payload: {
      email?: string;
      password?: string;
      name?: string;
      phone?: string | null;
      status?: UserStatus;
      autoActivate?: boolean;
      sendVerificationOtp?: boolean;
    },
    actorUserId: string,
    auditCtx: { ip?: string; userAgent?: string; requestId?: string },
  ) {
    const portalRecord = await StudentDataService.getPortalAccount(consultancyId, studentId);
    if (!portalRecord) {
      throw new AppError(404, "STUDENT_NOT_FOUND", "Student not found");
    }
    if (!portalRecord.portalUserId) {
      throw new AppError(404, "PORTAL_ACCOUNT_NOT_FOUND", "Student portal account not found");
    }

    const normalizedEmail = payload.email?.trim().toLowerCase();
    const normalizedPhone =
      payload.phone === null
        ? null
        : payload.phone !== undefined
          ? payload.phone.trim() || null
          : undefined;

    if (
      normalizedEmail &&
      normalizedEmail !== (portalRecord.portalUser?.email ?? "").trim().toLowerCase()
    ) {
      const existingByEmail = await UserRepository.findByEmail(consultancyId, normalizedEmail);
      if (existingByEmail && existingByEmail.id !== portalRecord.portalUserId) {
        throw new AppError(409, "USER_EXISTS", "A user with this email already exists");
      }
    }

    if (typeof normalizedPhone === "string") {
      const existingByPhone = await UserRepository.findByPhone(consultancyId, normalizedPhone);
      if (existingByPhone && existingByPhone.id !== portalRecord.portalUserId) {
        throw new AppError(409, "PHONE_ALREADY_IN_USE", "A user with this phone already exists");
      }
    }

    const updates: {
      user?: {
        name?: string;
        phone?: string | null;
        email?: string;
        status?: UserStatus;
      };
      identity?: {
        email?: string;
        phone?: string | null;
        emailVerifiedAt?: Date | null;
      };
      passwordHash?: string;
    } = {};

    if (payload.name !== undefined || payload.phone !== undefined || payload.status !== undefined || payload.email !== undefined) {
      updates.user = {
        name: payload.name,
        phone: normalizedPhone,
        status: payload.status,
        email: normalizedEmail,
      };
    }

    if (payload.email !== undefined || payload.phone !== undefined || payload.autoActivate !== undefined) {
      updates.identity = {
        email: normalizedEmail,
        phone: normalizedPhone,
        emailVerifiedAt: payload.autoActivate === true ? new Date() : payload.autoActivate === false ? null : undefined,
      };
    }

    if (payload.password) {
      updates.passwordHash = await hashValue(payload.password);
    }

    try {
      await prisma.$transaction(async (tx) => {
        if (updates.user) {
          await tx.user.update({
            where: { id: portalRecord.portalUserId! },
            data: updates.user,
          });
        }

        if (updates.identity) {
          await tx.authIdentity.update({
            where: { userId: portalRecord.portalUserId! },
            data: updates.identity,
          });
        }

        if (updates.passwordHash) {
          await tx.authCredential.update({
            where: { userId: portalRecord.portalUserId! },
            data: { passwordHash: updates.passwordHash, passwordUpdatedAt: new Date() },
          });
        }
      });
    } catch (error) {
      this.throwIfPortalUniqueConstraint(error);
    }

    const shouldSendOtp = payload.sendVerificationOtp ?? (payload.autoActivate === false);
    const finalEmail = (payload.email ?? portalRecord.portalUser?.email ?? "").trim().toLowerCase();
    if (shouldSendOtp && finalEmail) {
      await AuthService.requestOtp({
        consultancySlug,
        destination: finalEmail,
        channel: OtpChannel.EMAIL,
        purpose: OtpPurpose.VERIFY_EMAIL,
        ip: auditCtx.ip,
        userAgent: auditCtx.userAgent,
        actorUserId,
        requestId: auditCtx.requestId,
      });
    }

    await AuditService.log({
      consultancyId,
      actorUserId,
      action: "student.portal_account.updated",
      entityType: "Student",
      entityId: studentId,
      meta: {
        portalUserId: portalRecord.portalUserId,
        fields: Object.keys(payload),
        requestId: auditCtx.requestId,
      },
      ip: auditCtx.ip,
      userAgent: auditCtx.userAgent,
    });

    return this.getPortalAccount(consultancyId, studentId);
  }

  static async getDashboard(consultancyId: string, studentId: string) {
    const student = await StudentDataService.getDashboard(consultancyId, studentId);
    if (!student) {
      throw new AppError(404, "STUDENT_NOT_FOUND", "Student not found");
    }

    const openRequests = student.documentRequests.filter((r) => r.status === "OPEN" || r.status === "SUBMITTED" || r.status === "PARTIALLY_SUBMITTED");
    const recentlyFulfilled = student.documentRequests.filter((r) => r.status === "FULFILLED").slice(0, 10);

    const documentsByType = student.documentFiles.map((docFile) => {
      const latestVersion = docFile.currentVersion;
      const latestVerification = latestVersion?.verifications[0];

      return {
        documentTypeKey: docFile.documentTypeKey,
        latestVersion,
        verificationStatus: latestVerification?.status ?? "PENDING",
        lastUpdatedAt: latestVersion?.createdAt ?? docFile.updatedAt,
      };
    });

    return {
      student: {
        id: student.id,
        fullName: student.fullName,
        email: student.email,
        phone: student.phone,
        status: student.status,
      },
      cases: student.cases,
      documentRequests: {
        open: openRequests,
        recentlyFulfilled,
      },
      documentsByType,
    };
  }

  static async getDashboardByPortalUser(consultancyId: string, portalUserId: string) {
    const student = await StudentDataService.findByPortalUserId(consultancyId, portalUserId);
    if (!student) {
      throw new AppError(
        404,
        "STUDENT_PORTAL_PROFILE_NOT_FOUND",
        "No student profile linked to this account",
      );
    }

    return this.getDashboard(consultancyId, student.id);
  }
}

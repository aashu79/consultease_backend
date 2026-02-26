import { StudentCaseStatus, StudentStatus } from "@prisma/client";
import { StudentDataService } from "./student.data.service";
import { getPagination } from "../utils/pagination";
import { AppError } from "../utils/errors";
import { AuditService } from "./audit.service";

export class StudentService {
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
}

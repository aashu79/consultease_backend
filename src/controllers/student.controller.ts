import { Request, Response } from "express";
import { StudentService } from "../services/student.service";
import { successResponse } from "../utils/safeResponse";

export class StudentController {
  static async create(req: Request, res: Response) {
    const data = await StudentService.createStudent(
      req.tenant!.consultancyId,
      req.body,
      req.user!.userId,
      { ip: req.ip, userAgent: req.get("user-agent"), requestId: req.requestId },
    );
    return successResponse(res, data, 201);
  }

  static async list(req: Request, res: Response) {
    const data = await StudentService.listStudents(req.tenant!.consultancyId, req.query as any);
    return successResponse(res, data);
  }

  static async getById(req: Request, res: Response) {
    const data = await StudentService.getStudent(req.tenant!.consultancyId, req.params.id);
    return successResponse(res, data);
  }

  static async update(req: Request, res: Response) {
    const data = await StudentService.updateStudent(
      req.tenant!.consultancyId,
      req.params.id,
      req.body,
      req.user!.userId,
      { ip: req.ip, userAgent: req.get("user-agent"), requestId: req.requestId },
    );
    return successResponse(res, data);
  }

  static async getProfile(req: Request, res: Response) {
    const data = await StudentService.getDetailedProfile(
      req.tenant!.consultancyId,
      req.params.id,
    );
    return successResponse(res, data);
  }

  static async upsertProfile(req: Request, res: Response) {
    const data = await StudentService.upsertDetailedProfile(
      req.tenant!.consultancyId,
      req.params.id,
      req.body,
      req.user!.userId,
      { ip: req.ip, userAgent: req.get("user-agent"), requestId: req.requestId },
    );
    return successResponse(res, data);
  }

  static async listEducationRecords(req: Request, res: Response) {
    const data = await StudentService.listEducationRecords(
      req.tenant!.consultancyId,
      req.params.id,
    );
    return successResponse(res, data);
  }

  static async createEducationRecord(req: Request, res: Response) {
    const data = await StudentService.createEducationRecord(
      req.tenant!.consultancyId,
      req.params.id,
      req.body,
      req.user!.userId,
      { ip: req.ip, userAgent: req.get("user-agent"), requestId: req.requestId },
    );
    return successResponse(res, data, 201);
  }

  static async updateEducationRecord(req: Request, res: Response) {
    const data = await StudentService.updateEducationRecord(
      req.tenant!.consultancyId,
      req.params.id,
      req.params.educationRecordId,
      req.body,
      req.user!.userId,
      { ip: req.ip, userAgent: req.get("user-agent"), requestId: req.requestId },
    );
    return successResponse(res, data);
  }

  static async deleteEducationRecord(req: Request, res: Response) {
    const data = await StudentService.deleteEducationRecord(
      req.tenant!.consultancyId,
      req.params.id,
      req.params.educationRecordId,
      req.user!.userId,
      { ip: req.ip, userAgent: req.get("user-agent"), requestId: req.requestId },
    );
    return successResponse(res, data);
  }

  static async listTestScores(req: Request, res: Response) {
    const data = await StudentService.listTestScores(
      req.tenant!.consultancyId,
      req.params.id,
    );
    return successResponse(res, data);
  }

  static async createTestScore(req: Request, res: Response) {
    const data = await StudentService.createTestScore(
      req.tenant!.consultancyId,
      req.params.id,
      req.body,
      req.user!.userId,
      { ip: req.ip, userAgent: req.get("user-agent"), requestId: req.requestId },
    );
    return successResponse(res, data, 201);
  }

  static async updateTestScore(req: Request, res: Response) {
    const data = await StudentService.updateTestScore(
      req.tenant!.consultancyId,
      req.params.id,
      req.params.testScoreId,
      req.body,
      req.user!.userId,
      { ip: req.ip, userAgent: req.get("user-agent"), requestId: req.requestId },
    );
    return successResponse(res, data);
  }

  static async deleteTestScore(req: Request, res: Response) {
    const data = await StudentService.deleteTestScore(
      req.tenant!.consultancyId,
      req.params.id,
      req.params.testScoreId,
      req.user!.userId,
      { ip: req.ip, userAgent: req.get("user-agent"), requestId: req.requestId },
    );
    return successResponse(res, data);
  }

  static async createCase(req: Request, res: Response) {
    const data = await StudentService.createCase(
      req.tenant!.consultancyId,
      req.params.id,
      req.body,
      req.user!.userId,
      { ip: req.ip, userAgent: req.get("user-agent"), requestId: req.requestId },
    );
    return successResponse(res, data, 201);
  }

  static async updateCase(req: Request, res: Response) {
    const data = await StudentService.updateCase(
      req.tenant!.consultancyId,
      req.params.id,
      req.body,
      req.user!.userId,
      { ip: req.ip, userAgent: req.get("user-agent"), requestId: req.requestId },
    );
    return successResponse(res, data);
  }

  static async assign(req: Request, res: Response) {
    const data = await StudentService.assignStaff(
      req.tenant!.consultancyId,
      req.params.id,
      req.body,
      req.user!.userId,
      { ip: req.ip, userAgent: req.get("user-agent"), requestId: req.requestId },
    );
    return successResponse(res, data);
  }

  static async getPortalAccount(req: Request, res: Response) {
    const data = await StudentService.getPortalAccount(
      req.tenant!.consultancyId,
      req.params.id,
    );
    return successResponse(res, data);
  }

  static async createPortalAccount(req: Request, res: Response) {
    const data = await StudentService.createPortalAccount(
      req.tenant!.consultancyId,
      req.tenant!.slug,
      req.params.id,
      req.body,
      req.user!.userId,
      { ip: req.ip, userAgent: req.get("user-agent"), requestId: req.requestId },
    );
    return successResponse(res, data, 201);
  }

  static async updatePortalAccount(req: Request, res: Response) {
    const data = await StudentService.updatePortalAccount(
      req.tenant!.consultancyId,
      req.tenant!.slug,
      req.params.id,
      req.body,
      req.user!.userId,
      { ip: req.ip, userAgent: req.get("user-agent"), requestId: req.requestId },
    );
    return successResponse(res, data);
  }
}

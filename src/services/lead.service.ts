import { LeadStage } from "@prisma/client";
import { LeadRepository } from "../repositories/lead.repository";
import { getPagination } from "../utils/pagination";
import { AuditService } from "./audit.service";
import { AppError } from "../utils/errors";

export class LeadService {
  static async createLead(
    consultancyId: string,
    payload: {
      fullName: string;
      email?: string;
      phone?: string;
      source?: string;
      assignedToUserId?: string;
      notes?: string;
    },
    actorUserId: string,
    auditCtx: { ip?: string; userAgent?: string; requestId?: string },
  ) {
    const lead = await LeadRepository.create({
      consultancyId,
      fullName: payload.fullName,
      email: payload.email?.toLowerCase(),
      phone: payload.phone,
      source: payload.source,
      assignedToUserId: payload.assignedToUserId,
      notes: payload.notes,
    });

    await AuditService.log({
      consultancyId,
      actorUserId,
      action: "lead.created",
      entityType: "Lead",
      entityId: lead.id,
      meta: { requestId: auditCtx.requestId },
      ip: auditCtx.ip,
      userAgent: auditCtx.userAgent,
    });

    return lead;
  }

  static async listLeads(consultancyId: string, query: { stage?: string; assignedTo?: string; search?: string; page?: string; limit?: string }) {
    const { skip, limit, page } = getPagination({ page: query.page, limit: query.limit });

    return LeadRepository.list(consultancyId, {
      stage: query.stage as LeadStage | undefined,
      assignedToUserId: query.assignedTo,
      search: query.search,
      skip,
      take: limit,
    }).then((items) => ({ items, page, limit }));
  }

  static async updateLead(
    consultancyId: string,
    leadId: string,
    payload: {
      fullName?: string;
      email?: string;
      phone?: string;
      source?: string;
      assignedToUserId?: string | null;
      notes?: string;
      stage?: string;
      status?: string;
    },
    actorUserId: string,
    auditCtx: { ip?: string; userAgent?: string; requestId?: string },
  ) {
    const updated = await LeadRepository.update(consultancyId, leadId, {
      fullName: payload.fullName,
      email: payload.email,
      phone: payload.phone,
      source: payload.source,
      assignedToUserId: payload.assignedToUserId,
      notes: payload.notes,
      stage: payload.stage as LeadStage | undefined,
      status: payload.status as never,
    });

    if (updated.count === 0) {
      throw new AppError(404, "LEAD_NOT_FOUND", "Lead not found");
    }

    await AuditService.log({
      consultancyId,
      actorUserId,
      action: "lead.updated",
      entityType: "Lead",
      entityId: leadId,
      meta: { ...payload, requestId: auditCtx.requestId },
      ip: auditCtx.ip,
      userAgent: auditCtx.userAgent,
    });

    return { leadId };
  }

  static async addActivity(
    consultancyId: string,
    leadId: string,
    actorUserId: string,
    payload: { type: string; note?: string },
    auditCtx: { ip?: string; userAgent?: string; requestId?: string },
  ) {
    const lead = await LeadRepository.findById(consultancyId, leadId);
    if (!lead) {
      throw new AppError(404, "LEAD_NOT_FOUND", "Lead not found");
    }

    const activity = await LeadRepository.addActivity({
      consultancyId,
      leadId,
      actorUserId,
      type: payload.type,
      note: payload.note,
    });

    await AuditService.log({
      consultancyId,
      actorUserId,
      action: "lead.activity.created",
      entityType: "LeadActivity",
      entityId: activity.id,
      meta: { leadId, requestId: auditCtx.requestId },
      ip: auditCtx.ip,
      userAgent: auditCtx.userAgent,
    });

    return activity;
  }

  static async convertToStudent(
    consultancyId: string,
    leadId: string,
    payload: { intake?: string; targetCountry?: string },
    actorUserId: string,
    auditCtx: { ip?: string; userAgent?: string; requestId?: string },
  ) {
    const result = await LeadRepository.convertToStudent(consultancyId, leadId, payload);
    if (!result) {
      throw new AppError(404, "LEAD_NOT_FOUND", "Lead not found");
    }

    await AuditService.log({
      consultancyId,
      actorUserId,
      action: "lead.converted",
      entityType: "Lead",
      entityId: leadId,
      meta: {
        studentId: result.student.id,
        studentCaseId: result.studentCase?.id,
        requestId: auditCtx.requestId,
      },
      ip: auditCtx.ip,
      userAgent: auditCtx.userAgent,
    });

    return result;
  }
}

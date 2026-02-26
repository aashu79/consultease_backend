import { LeadStatus, LeadStage, Prisma, StudentCaseStatus, StudentStatus } from "@prisma/client";
import { prisma } from "../config/prisma";

export class LeadRepository {
  static create(data: Prisma.LeadUncheckedCreateInput) {
    return prisma.lead.create({ data });
  }

  static list(
    consultancyId: string,
    filters: { stage?: LeadStage; assignedToUserId?: string; search?: string; skip: number; take: number },
  ) {
    return prisma.lead.findMany({
      where: {
        consultancyId,
        stage: filters.stage,
        assignedToUserId: filters.assignedToUserId,
        OR: filters.search
          ? [
              { fullName: { contains: filters.search, mode: "insensitive" } },
              { email: { contains: filters.search, mode: "insensitive" } },
              { phone: { contains: filters.search, mode: "insensitive" } },
            ]
          : undefined,
      },
      skip: filters.skip,
      take: filters.take,
      orderBy: { createdAt: "desc" },
    });
  }

  static findById(consultancyId: string, leadId: string) {
    return prisma.lead.findFirst({
      where: { id: leadId, consultancyId },
      include: { activities: { orderBy: { createdAt: "desc" } } },
    });
  }

  static update(consultancyId: string, leadId: string, data: Prisma.LeadUncheckedUpdateInput) {
    return prisma.lead.updateMany({
      where: { id: leadId, consultancyId },
      data,
    });
  }

  static addActivity(data: Prisma.LeadActivityUncheckedCreateInput) {
    return prisma.leadActivity.create({ data });
  }

  static convertToStudent(
    consultancyId: string,
    leadId: string,
    payload: { intake?: string; targetCountry?: string },
  ) {
    return prisma.$transaction(async (tx) => {
      const lead = await tx.lead.findFirst({ where: { id: leadId, consultancyId } });
      if (!lead) {
        return null;
      }

      const student = await tx.student.create({
        data: {
          consultancyId,
          fullName: lead.fullName,
          email: lead.email,
          phone: lead.phone,
          status: StudentStatus.ACTIVE,
        },
      });

      const studentCase = payload.intake && payload.targetCountry
        ? await tx.studentCase.create({
            data: {
              consultancyId,
              studentId: student.id,
              intake: payload.intake,
              targetCountry: payload.targetCountry,
              status: StudentCaseStatus.ACTIVE,
            },
          })
        : null;

      await tx.lead.update({
        where: { id: lead.id },
        data: {
          stage: LeadStage.CONVERTED,
          status: LeadStatus.WON,
        },
      });

      return { student, studentCase, leadId: lead.id };
    });
  }
}

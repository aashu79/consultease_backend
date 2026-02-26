import { Prisma, ConsultancyStatus } from "@prisma/client";
import { prisma } from "../config/prisma";

export class ConsultancyRepository {
  static findBySlug(slug: string) {
    return prisma.consultancy.findUnique({ where: { slug } });
  }

  static findById(id: string) {
    return prisma.consultancy.findUnique({ where: { id } });
  }

  static create(data: Prisma.ConsultancyCreateInput) {
    return prisma.consultancy.create({ data });
  }

  static update(consultancyId: string, data: Prisma.ConsultancyUpdateInput) {
    return prisma.consultancy.update({
      where: { id: consultancyId },
      data,
    });
  }

  static ensureActive(consultancyId: string) {
    return prisma.consultancy.findFirst({
      where: { id: consultancyId, status: ConsultancyStatus.ACTIVE },
    });
  }
}

import { Prisma, UserStatus } from "@prisma/client";
import { prisma } from "../config/prisma";

export class UserRepository {
  static findById(consultancyId: string, userId: string) {
    return prisma.user.findFirst({
      where: { id: userId, consultancyId, deletedAt: null },
      include: { authIdentity: true },
    });
  }

  static findByEmail(consultancyId: string, email: string) {
    return prisma.user.findFirst({
      where: { consultancyId, email, deletedAt: null },
      include: { authCredential: true, authIdentity: true },
    });
  }

  static findByEmailAcrossConsultancies(email: string) {
    return prisma.user.findMany({
      where: {
        email,
        deletedAt: null,
        consultancy: {
          status: "ACTIVE",
        },
      },
      include: {
        authCredential: true,
        authIdentity: true,
        consultancy: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  static findByPhoneAcrossConsultancies(phone: string) {
    return prisma.user.findMany({
      where: {
        phone,
        deletedAt: null,
        consultancy: {
          status: "ACTIVE",
        },
      },
      include: {
        authCredential: true,
        authIdentity: true,
        consultancy: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  static findByPhone(consultancyId: string, phone: string) {
    return prisma.user.findFirst({
      where: { consultancyId, phone, deletedAt: null },
      include: { authIdentity: true },
    });
  }

  static list(consultancyId: string) {
    return prisma.user.findMany({
      where: { consultancyId, deletedAt: null },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
        authIdentity: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  static create(data: Prisma.UserUncheckedCreateInput) {
    return prisma.user.create({ data });
  }

  static update(consultancyId: string, userId: string, data: Prisma.UserUpdateInput) {
    return prisma.user.updateMany({ where: { id: userId, consultancyId, deletedAt: null }, data });
  }

  static suspend(consultancyId: string, userId: string) {
    return prisma.user.updateMany({
      where: { id: userId, consultancyId, deletedAt: null },
      data: { status: UserStatus.SUSPENDED },
    });
  }

  static softDelete(consultancyId: string, userId: string) {
    return prisma.user.updateMany({
      where: { id: userId, consultancyId, deletedAt: null },
      data: { deletedAt: new Date() },
    });
  }
}

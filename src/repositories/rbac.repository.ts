import { prisma } from "../config/prisma";

export class RbacRepository {
  static getAllPermissions() {
    return prisma.permission.findMany({ orderBy: { key: "asc" } });
  }

  static getPermissionByKeys(keys: string[]) {
    return prisma.permission.findMany({ where: { key: { in: keys } } });
  }

  static listRoles(consultancyId: string) {
    return prisma.role.findMany({
      where: { consultancyId },
      include: {
        rolePermissions: { include: { permission: true } },
      },
      orderBy: { createdAt: "asc" },
    });
  }

  static findRoleByKey(consultancyId: string, key: string) {
    return prisma.role.findFirst({ where: { consultancyId, key } });
  }

  static findRolesByKeys(consultancyId: string, keys: string[]) {
    return prisma.role.findMany({ where: { consultancyId, key: { in: keys } } });
  }

  static createRole(consultancyId: string, name: string, key: string, isSystem = false) {
    return prisma.role.create({ data: { consultancyId, name, key, isSystem } });
  }

  static updateRole(consultancyId: string, roleId: string, data: { name?: string; key?: string }) {
    return prisma.role.updateMany({
      where: { id: roleId, consultancyId },
      data,
    });
  }

  static replaceRolePermissions(roleId: string, permissions: { permissionId: string; allowed: boolean }[]) {
    return prisma.$transaction([
      prisma.rolePermission.deleteMany({ where: { roleId } }),
      prisma.rolePermission.createMany({
        data: permissions.map((p) => ({ roleId, permissionId: p.permissionId, allowed: p.allowed })),
      }),
    ]);
  }

  static assignRolesToUser(consultancyId: string, userId: string, roleIds: string[]) {
    return prisma.$transaction([
      prisma.userRole.deleteMany({ where: { consultancyId, userId } }),
      prisma.userRole.createMany({
        data: roleIds.map((roleId) => ({ consultancyId, userId, roleId })),
        skipDuplicates: true,
      }),
    ]);
  }

  static getUserAuthz(consultancyId: string, userId: string) {
    return prisma.userRole.findMany({
      where: { consultancyId, userId },
      include: {
        role: {
          include: {
            rolePermissions: {
              where: { allowed: true },
              include: { permission: true },
            },
          },
        },
      },
    });
  }
}

import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";
import {
  DEFAULT_ROLE_NAMES,
  DEFAULT_ROLE_PERMISSION_KEYS,
  PERMISSION_KEYS,
} from "../config/permissions";
import { AppError } from "../utils/errors";
import { RbacRepository } from "../repositories/rbac.repository";

export class RbacService {
  static async seedGlobalPermissions() {
    await prisma.$transaction(
      PERMISSION_KEYS.map((key) =>
        prisma.permission.upsert({
          where: { key },
          update: {
            module: key.split(".")[0],
            description: key,
          },
          create: {
            key,
            module: key.split(".")[0],
            description: key,
          },
        }),
      ),
    );
  }

  static async seedTenantDefaults(
    tx: Prisma.TransactionClient,
    consultancyId: string,
    ownerUserId: string,
  ) {
    const permissions = await tx.permission.findMany();
    const permissionMap = new Map(permissions.map((p) => [p.key, p.id]));
    const roleKeys = Object.keys(DEFAULT_ROLE_PERMISSION_KEYS);

    await tx.role.createMany({
      data: roleKeys.map((roleKey) => ({
        consultancyId,
        key: roleKey,
        name: DEFAULT_ROLE_NAMES[roleKey] ?? roleKey,
        isSystem: true,
      })),
    });

    const createdRoles = await tx.role.findMany({
      where: {
        consultancyId,
        key: { in: roleKeys },
      },
      select: {
        id: true,
        key: true,
      },
    });

    const roleIdsByKey = new Map(
      createdRoles.map((role) => [role.key, role.id]),
    );

    const rolePermissionRows: Prisma.RolePermissionCreateManyInput[] = [];
    for (const [roleKey, keys] of Object.entries(
      DEFAULT_ROLE_PERMISSION_KEYS,
    )) {
      const roleId = roleIdsByKey.get(roleKey);
      if (!roleId) {
        continue;
      }

      for (const permissionKey of keys) {
        const permissionId = permissionMap.get(permissionKey);
        if (!permissionId) {
          continue;
        }
        rolePermissionRows.push({
          roleId,
          permissionId,
          allowed: true,
        });
      }
    }

    if (rolePermissionRows.length > 0) {
      await tx.rolePermission.createMany({
        data: rolePermissionRows,
        skipDuplicates: true,
      });
    }

    const superAdminRoleId = roleIdsByKey.get("SUPER_ADMIN");
    if (!superAdminRoleId) {
      throw new AppError(500, "SEED_ERROR", "SUPER_ADMIN role not created");
    }

    await tx.userRole.create({
      data: {
        consultancyId,
        userId: ownerUserId,
        roleId: superAdminRoleId,
      },
    });
  }

  static async listRoles(consultancyId: string) {
    return RbacRepository.listRoles(consultancyId);
  }

  static async createRole(
    consultancyId: string,
    payload: { key: string; name: string },
  ) {
    const key = payload.key.toUpperCase().replace(/[^A-Z0-9_]/g, "_");
    return RbacRepository.createRole(consultancyId, payload.name, key, false);
  }

  static async updateRole(
    consultancyId: string,
    roleId: string,
    payload: { key?: string; name?: string },
  ) {
    const updateData: { key?: string; name?: string } = {};
    if (payload.key) {
      updateData.key = payload.key.toUpperCase().replace(/[^A-Z0-9_]/g, "_");
    }
    if (payload.name) {
      updateData.name = payload.name;
    }

    const updated = await RbacRepository.updateRole(
      consultancyId,
      roleId,
      updateData,
    );
    if (updated.count === 0) {
      throw new AppError(404, "ROLE_NOT_FOUND", "Role not found");
    }

    return { roleId, ...updateData };
  }

  static async setRolePermissions(
    consultancyId: string,
    roleId: string,
    rows: { permissionKey: string; allowed: boolean }[],
  ) {
    const role = await prisma.role.findFirst({
      where: { id: roleId, consultancyId },
    });
    if (!role) {
      throw new AppError(404, "ROLE_NOT_FOUND", "Role not found");
    }

    const keys = rows.map((r) => r.permissionKey);
    const permissions = await RbacRepository.getPermissionByKeys(keys);
    const map = new Map(permissions.map((p) => [p.key, p.id]));

    await RbacRepository.replaceRolePermissions(
      roleId,
      rows
        .filter((r) => map.has(r.permissionKey))
        .map((r) => ({
          permissionId: map.get(r.permissionKey) as string,
          allowed: r.allowed,
        })),
    );
  }

  static async assignRolesToUser(
    consultancyId: string,
    userId: string,
    roleKeys: string[],
  ) {
    const roles = await RbacRepository.findRolesByKeys(consultancyId, roleKeys);
    if (roles.length !== roleKeys.length) {
      throw new AppError(400, "INVALID_ROLE_KEYS", "Some roles are invalid");
    }

    await RbacRepository.assignRolesToUser(
      consultancyId,
      userId,
      roles.map((role) => role.id),
    );

    return roles;
  }

  static async getUserAuthorization(consultancyId: string, userId: string) {
    const records = await RbacRepository.getUserAuthz(consultancyId, userId);
    const roles = records.map((row) => ({
      id: row.role.id,
      key: row.role.key,
      name: row.role.name,
    }));
    const permissionSet = new Set<string>();

    for (const row of records) {
      for (const rp of row.role.rolePermissions) {
        if (rp.allowed) {
          permissionSet.add(rp.permission.key);
        }
      }
    }

    return {
      roles,
      permissions: Array.from(permissionSet),
    };
  }
}

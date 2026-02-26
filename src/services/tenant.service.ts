import { UserStatus } from "@prisma/client";
import { prisma } from "../config/prisma";
import { hashValue } from "../utils/crypto";
import { AppError } from "../utils/errors";
import { RbacService } from "./rbac.service";
import { AuthService } from "./auth.service";
import { AuditService } from "./audit.service";
import { buildBaseConsultancySlug } from "../utils/slug";

export class TenantService {
  private static async generateUniqueConsultancySlug(name: string): Promise<string> {
    const baseSlug = buildBaseConsultancySlug(name);
    let candidate = baseSlug;
    let suffix = 1;

    while (true) {
      const existing = await prisma.consultancy.findUnique({ where: { slug: candidate } });
      if (!existing) {
        return candidate;
      }

      suffix += 1;
      candidate = `${baseSlug}-${suffix}`;
    }
  }

  static async registerTenant(payload: {
    name: string;
    slug?: string;
    country: string;
    timezone: string;
    email: string;
    phone: string;
    address?: string;
    website?: string;
    ownerName: string;
    ownerEmail: string;
    ownerPhone?: string;
    ownerPassword: string;
    ip?: string;
    userAgent?: string;
    requestId?: string;
  }) {
    const generatedSlug = await this.generateUniqueConsultancySlug(payload.name);

    const passwordHash = await hashValue(payload.ownerPassword);

    const result = await prisma.$transaction(
      async (tx) => {
        const consultancy = await tx.consultancy.create({
          data: {
            name: payload.name,
            slug: generatedSlug,
            country: payload.country,
            timezone: payload.timezone,
            email: payload.email,
            phone: payload.phone,
            address: payload.address,
            website: payload.website,
          },
        });

        const owner = await tx.user.create({
          data: {
            consultancyId: consultancy.id,
            name: payload.ownerName,
            email: payload.ownerEmail,
            phone: payload.ownerPhone,
            status: UserStatus.PENDING_VERIFICATION,
          },
        });

        await tx.authIdentity.create({
          data: {
            consultancyId: consultancy.id,
            userId: owner.id,
            email: owner.email,
            phone: owner.phone,
          },
        });

        await tx.authCredential.create({
          data: {
            consultancyId: consultancy.id,
            userId: owner.id,
            passwordHash,
          },
        });

        await RbacService.seedTenantDefaults(tx, consultancy.id, owner.id);

        return { consultancy, owner };
      },
      {
        maxWait: 20_000,
        timeout: 30_000,
      },
    );

    await AuditService.log({
      consultancyId: result.consultancy.id,
      actorUserId: result.owner.id,
      action: "consultancy.created",
      entityType: "Consultancy",
      entityId: result.consultancy.id,
      meta: { requestId: payload.requestId },
      ip: payload.ip,
      userAgent: payload.userAgent,
    });

    await AuthService.requestOtp({
      consultancySlug: generatedSlug,
      destination: payload.ownerEmail,
      channel: "EMAIL",
      purpose: "VERIFY_EMAIL",
      ip: payload.ip,
      userAgent: payload.userAgent,
      actorUserId: result.owner.id,
      requestId: payload.requestId,
    });

    return {
      consultancyId: result.consultancy.id,
      ownerUserId: result.owner.id,
      slug: result.consultancy.slug,
    };
  }

  static async getTenantProfile(consultancyId: string) {
    const tenancy = await prisma.consultancy.findUnique({ where: { id: consultancyId } });
    if (!tenancy) {
      throw new AppError(404, "CONSULTANCY_NOT_FOUND", "Consultancy not found");
    }
    return tenancy;
  }
}

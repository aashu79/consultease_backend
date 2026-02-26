import { UserStatus } from "@prisma/client";
import { z } from "zod";
import { strongPasswordRegex } from "./common.validation";

export const inviteUserSchema = z.object({
  body: z.object({
    email: z.string().email().optional(),
    phone: z.string().min(7).optional(),
    roleKeys: z.array(z.string().min(2)).min(1),
  }),
});

export const updateUserSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    name: z.string().min(2).optional(),
    phone: z.string().min(7).nullable().optional(),
    status: z.nativeEnum(UserStatus).optional(),
  }),
});

export const assignUserRolesSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({ roleKeys: z.array(z.string().min(2)).min(1) }),
});

export const acceptInvitationSchema = z.object({
  body: z
    .object({
      consultancySlug: z.string().min(2).optional(),
      tenantSlug: z.string().min(2).optional(),
      token: z.string().min(10),
      name: z.string().min(2),
      password: z.string().regex(strongPasswordRegex),
    })
    .refine((data) => Boolean(data.consultancySlug || data.tenantSlug), {
      message: "consultancySlug is required",
      path: ["consultancySlug"],
    }),
});

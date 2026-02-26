import { z } from "zod";

export const createRoleSchema = z.object({
  body: z.object({ key: z.string().min(2), name: z.string().min(2) }),
});

export const updateRoleSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({ key: z.string().min(2).optional(), name: z.string().min(2).optional() }),
});

export const setRolePermissionsSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    permissions: z
      .array(
        z.object({
          permissionKey: z.string().min(3),
          allowed: z.boolean(),
        }),
      )
      .min(1),
  }),
});

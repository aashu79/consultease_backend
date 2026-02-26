import { Router } from "express";
import { z } from "zod";
import { RbacController } from "../controllers/rbac.controller";
import { auth } from "../middlewares/auth";
import { requirePermission } from "../middlewares/requirePermission";
import { validate } from "../middlewares/validate";
import { asyncHandler } from "../utils/errors";

const router = Router();

router.post(
  "/",
  auth,
  requirePermission("role.create"),
  validate(
    z.object({ body: z.object({ key: z.string().min(2), name: z.string().min(2) }) }),
  ),
  asyncHandler(RbacController.createRole),
);

router.get("/", auth, requirePermission("role.read"), asyncHandler(RbacController.listRoles));

router.patch(
  "/:id",
  auth,
  requirePermission("role.update"),
  validate(
    z.object({
      params: z.object({ id: z.string().uuid() }),
      body: z.object({ key: z.string().min(2).optional(), name: z.string().min(2).optional() }),
    }),
  ),
  asyncHandler(RbacController.updateRole),
);

router.post(
  "/:id/permissions",
  auth,
  requirePermission("permission.manage"),
  validate(
    z.object({
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
    }),
  ),
  asyncHandler(RbacController.setRolePermissions),
);

export default router;

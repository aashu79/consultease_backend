import { Router } from "express";
import { RbacController } from "../controllers/rbac.controller";
import { auth } from "../middlewares/auth";
import { requirePermission } from "../middlewares/requirePermission";
import { validate } from "../middlewares/validate";
import { asyncHandler } from "../utils/errors";
import {
  createRoleSchema,
  setRolePermissionsSchema,
  updateRoleSchema,
} from "../validations/rbac.validation";

const router = Router();

router.post(
  "/",
  auth,
  requirePermission("role.create"),
  validate(createRoleSchema),
  asyncHandler(RbacController.createRole),
);

router.get("/", auth, requirePermission("role.read"), asyncHandler(RbacController.listRoles));

router.patch(
  "/:id",
  auth,
  requirePermission("role.update"),
  validate(updateRoleSchema),
  asyncHandler(RbacController.updateRole),
);

router.post(
  "/:id/permissions",
  auth,
  requirePermission("permission.manage"),
  validate(setRolePermissionsSchema),
  asyncHandler(RbacController.setRolePermissions),
);

export default router;

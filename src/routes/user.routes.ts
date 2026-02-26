import { Router } from "express";
import { UserController } from "../controllers/user.controller";
import { asyncHandler } from "../utils/errors";
import { validate } from "../middlewares/validate";
import { auth } from "../middlewares/auth";
import { requirePermission } from "../middlewares/requirePermission";
import {
  acceptInvitationSchema,
  assignUserRolesSchema,
  inviteUserSchema,
  updateUserSchema,
} from "../validations/user.validation";

const router = Router();

router.post(
  "/invite",
  auth,
  requirePermission("user.create"),
  validate(inviteUserSchema),
  asyncHandler(UserController.invite),
);

router.get("/", auth, requirePermission("user.read"), asyncHandler(UserController.list));

router.patch(
  "/:id",
  auth,
  requirePermission("user.update"),
  validate(updateUserSchema),
  asyncHandler(UserController.update),
);

router.post(
  "/:id/roles",
  auth,
  requirePermission("role.assign"),
  validate(assignUserRolesSchema),
  asyncHandler(UserController.assignRoles),
);

export const invitationRouter = Router();

invitationRouter.post(
  "/accept",
  validate(acceptInvitationSchema),
  asyncHandler(UserController.acceptInvitation),
);

export default router;

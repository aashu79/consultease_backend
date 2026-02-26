import { Router } from "express";
import { UserStatus } from "@prisma/client";
import { z } from "zod";
import { UserController } from "../controllers/user.controller";
import { asyncHandler } from "../utils/errors";
import { validate } from "../middlewares/validate";
import { auth } from "../middlewares/auth";
import { requirePermission } from "../middlewares/requirePermission";

const strongPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{8,}$/;

const router = Router();

router.post(
  "/invite",
  auth,
  requirePermission("user.create"),
  validate(
    z.object({
      body: z.object({
        email: z.string().email().optional(),
        phone: z.string().min(7).optional(),
        roleKeys: z.array(z.string().min(2)).min(1),
      }),
    }),
  ),
  asyncHandler(UserController.invite),
);

router.get("/", auth, requirePermission("user.read"), asyncHandler(UserController.list));

router.patch(
  "/:id",
  auth,
  requirePermission("user.update"),
  validate(
    z.object({
      params: z.object({ id: z.string().uuid() }),
      body: z.object({
        name: z.string().min(2).optional(),
        phone: z.string().min(7).nullable().optional(),
        status: z.nativeEnum(UserStatus).optional(),
      }),
    }),
  ),
  asyncHandler(UserController.update),
);

router.post(
  "/:id/roles",
  auth,
  requirePermission("role.assign"),
  validate(
    z.object({
      params: z.object({ id: z.string().uuid() }),
      body: z.object({ roleKeys: z.array(z.string().min(2)).min(1) }),
    }),
  ),
  asyncHandler(UserController.assignRoles),
);

export const invitationRouter = Router();

invitationRouter.post(
  "/accept",
  validate(
    z.object({
      body: z.object({
        consultancySlug: z.string().min(2).optional(),
        tenantSlug: z.string().min(2).optional(),
        token: z.string().min(10),
        name: z.string().min(2),
        password: z.string().regex(strongPassword),
      }).refine(
        (data) => Boolean(data.consultancySlug || data.tenantSlug),
        {
          message: "consultancySlug is required",
          path: ["consultancySlug"],
        },
      ),
    }),
  ),
  asyncHandler(UserController.acceptInvitation),
);

export default router;

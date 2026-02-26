import { Router } from "express";
import { z } from "zod";
import { StorageController } from "../controllers/storage.controller";
import { auth } from "../middlewares/auth";
import { requirePermission } from "../middlewares/requirePermission";
import { validate } from "../middlewares/validate";
import { asyncHandler } from "../utils/errors";

const router = Router();

router.post(
  "/sign-upload",
  auth,
  requirePermission("storage.sign.upload"),
  requirePermission("doc.upload"),
  validate(
    z.object({
      body: z.object({
        studentId: z.string().uuid(),
        documentTypeKey: z.string().min(2),
        fileName: z.string().min(1),
        mimeType: z.string().min(3),
        sizeBytes: z.number().int().positive(),
        requestId: z.string().uuid().optional(),
        expiresInSeconds: z.number().int().positive().optional(),
      }),
    }),
  ),
  asyncHandler(StorageController.signUpload),
);

router.post(
  "/sign-download",
  auth,
  requirePermission("storage.sign.download"),
  requirePermission("doc.read"),
  validate(
    z.object({
      body: z.object({
        documentVersionId: z.string().uuid(),
        expiresInSeconds: z.number().int().positive().optional(),
      }),
    }),
  ),
  asyncHandler(StorageController.signDownload),
);

router.post(
  "/sign-upload/user-profile",
  auth,
  requirePermission("storage.sign.upload"),
  requirePermission("user.update"),
  validate(
    z.object({
      body: z.object({
        userId: z.string().uuid(),
        fileName: z.string().min(1),
        mimeType: z.string().min(3),
        sizeBytes: z.number().int().positive(),
        expiresInSeconds: z.number().int().positive().optional(),
      }),
    }),
  ),
  asyncHandler(StorageController.signUserProfileUpload),
);

router.post(
  "/confirm-upload/user-profile",
  auth,
  requirePermission("user.update"),
  validate(
    z.object({
      body: z.object({
        userId: z.string().uuid(),
        objectKey: z.string().min(10),
        mimeType: z.string().min(3),
      }),
    }),
  ),
  asyncHandler(StorageController.confirmUserProfileUpload),
);

router.post(
  "/sign-download/user-profile",
  auth,
  requirePermission("storage.sign.download"),
  requirePermission("user.read"),
  validate(
    z.object({
      body: z.object({
        userId: z.string().uuid(),
        expiresInSeconds: z.number().int().positive().optional(),
      }),
    }),
  ),
  asyncHandler(StorageController.signUserProfileDownload),
);

router.post(
  "/sign-upload/student-profile",
  auth,
  requirePermission("storage.sign.upload"),
  requirePermission("student.update"),
  validate(
    z.object({
      body: z.object({
        studentId: z.string().uuid(),
        fileName: z.string().min(1),
        mimeType: z.string().min(3),
        sizeBytes: z.number().int().positive(),
        expiresInSeconds: z.number().int().positive().optional(),
      }),
    }),
  ),
  asyncHandler(StorageController.signStudentProfileUpload),
);

router.post(
  "/confirm-upload/student-profile",
  auth,
  requirePermission("student.update"),
  validate(
    z.object({
      body: z.object({
        studentId: z.string().uuid(),
        objectKey: z.string().min(10),
        mimeType: z.string().min(3),
      }),
    }),
  ),
  asyncHandler(StorageController.confirmStudentProfileUpload),
);

router.post(
  "/sign-download/student-profile",
  auth,
  requirePermission("storage.sign.download"),
  requirePermission("student.read"),
  validate(
    z.object({
      body: z.object({
        studentId: z.string().uuid(),
        expiresInSeconds: z.number().int().positive().optional(),
      }),
    }),
  ),
  asyncHandler(StorageController.signStudentProfileDownload),
);

export default router;

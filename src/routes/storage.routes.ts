import { Router } from "express";
import { StorageController } from "../controllers/storage.controller";
import { auth } from "../middlewares/auth";
import { requirePermission } from "../middlewares/requirePermission";
import { validate } from "../middlewares/validate";
import { asyncHandler } from "../utils/errors";
import {
  confirmStudentProfileUploadSchema,
  confirmUserProfileUploadSchema,
  signStorageDownloadSchema,
  signStorageUploadSchema,
  signStudentProfileDownloadSchema,
  signStudentProfileUploadSchema,
  signUserProfileDownloadSchema,
  signUserProfileUploadSchema,
} from "../validations/storage.validation";

const router = Router();

router.post(
  "/sign-upload",
  auth,
  requirePermission("storage.sign.upload"),
  requirePermission("doc.upload"),
  validate(signStorageUploadSchema),
  asyncHandler(StorageController.signUpload),
);

router.post(
  "/sign-download",
  auth,
  requirePermission("storage.sign.download"),
  requirePermission("doc.read"),
  validate(signStorageDownloadSchema),
  asyncHandler(StorageController.signDownload),
);

router.post(
  "/sign-upload/user-profile",
  auth,
  requirePermission("storage.sign.upload"),
  requirePermission("user.update"),
  validate(signUserProfileUploadSchema),
  asyncHandler(StorageController.signUserProfileUpload),
);

router.post(
  "/confirm-upload/user-profile",
  auth,
  requirePermission("user.update"),
  validate(confirmUserProfileUploadSchema),
  asyncHandler(StorageController.confirmUserProfileUpload),
);

router.post(
  "/sign-download/user-profile",
  auth,
  requirePermission("storage.sign.download"),
  requirePermission("user.read"),
  validate(signUserProfileDownloadSchema),
  asyncHandler(StorageController.signUserProfileDownload),
);

router.post(
  "/sign-upload/student-profile",
  auth,
  requirePermission("storage.sign.upload"),
  requirePermission("student.update"),
  validate(signStudentProfileUploadSchema),
  asyncHandler(StorageController.signStudentProfileUpload),
);

router.post(
  "/confirm-upload/student-profile",
  auth,
  requirePermission("student.update"),
  validate(confirmStudentProfileUploadSchema),
  asyncHandler(StorageController.confirmStudentProfileUpload),
);

router.post(
  "/sign-download/student-profile",
  auth,
  requirePermission("storage.sign.download"),
  requirePermission("student.read"),
  validate(signStudentProfileDownloadSchema),
  asyncHandler(StorageController.signStudentProfileDownload),
);

export default router;

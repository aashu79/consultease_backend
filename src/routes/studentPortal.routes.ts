import { Router } from "express";
import { StudentPortalController } from "../controllers/studentPortal.controller";
import { auth } from "../middlewares/auth";
import { requireStudentPortal } from "../middlewares/requireStudentPortal";
import { validate } from "../middlewares/validate";
import { asyncHandler } from "../utils/errors";
import {
  confirmMyDocumentUploadSchema,
  confirmMyStudentProfileUploadSchema,
  signMyDocumentDownloadSchema,
  signMyDocumentUploadSchema,
  signMyStudentProfileDownloadSchema,
  signMyStudentProfileUploadSchema,
  upsertMyStudentProfileSchema,
} from "../validations/studentPortal.validation";

const router = Router();

router.get(
  "/students/me/profile",
  auth,
  asyncHandler(requireStudentPortal),
  asyncHandler(StudentPortalController.myProfile),
);

router.put(
  "/students/me/profile",
  auth,
  asyncHandler(requireStudentPortal),
  validate(upsertMyStudentProfileSchema),
  asyncHandler(StudentPortalController.upsertMyProfile),
);

router.get(
  "/students/me/document-requests",
  auth,
  asyncHandler(requireStudentPortal),
  asyncHandler(StudentPortalController.myDocumentRequests),
);

router.get(
  "/students/me/documents",
  auth,
  asyncHandler(requireStudentPortal),
  asyncHandler(StudentPortalController.myDocuments),
);

router.post(
  "/students/me/documents/sign-upload",
  auth,
  asyncHandler(requireStudentPortal),
  validate(signMyDocumentUploadSchema),
  asyncHandler(StudentPortalController.signMyDocumentUpload),
);

router.post(
  "/students/me/documents/confirm-upload",
  auth,
  asyncHandler(requireStudentPortal),
  validate(confirmMyDocumentUploadSchema),
  asyncHandler(StudentPortalController.confirmMyDocumentUpload),
);

router.post(
  "/students/me/documents/sign-download",
  auth,
  asyncHandler(requireStudentPortal),
  validate(signMyDocumentDownloadSchema),
  asyncHandler(StudentPortalController.signMyDocumentDownload),
);

router.post(
  "/students/me/profile-image/sign-upload",
  auth,
  asyncHandler(requireStudentPortal),
  validate(signMyStudentProfileUploadSchema),
  asyncHandler(StudentPortalController.signMyProfileUpload),
);

router.post(
  "/students/me/profile-image/confirm-upload",
  auth,
  asyncHandler(requireStudentPortal),
  validate(confirmMyStudentProfileUploadSchema),
  asyncHandler(StudentPortalController.confirmMyProfileUpload),
);

router.post(
  "/students/me/profile-image/sign-download",
  auth,
  asyncHandler(requireStudentPortal),
  validate(signMyStudentProfileDownloadSchema),
  asyncHandler(StudentPortalController.signMyProfileDownload),
);

export default router;

import { Router } from "express";
import { DocumentVerificationStatus } from "@prisma/client";
import { DocumentController } from "../controllers/document.controller";
import { auth } from "../middlewares/auth";
import { requirePermission } from "../middlewares/requirePermission";
import { validate } from "../middlewares/validate";
import { asyncHandler } from "../utils/errors";
import {
  cancelDocumentRequestSchema,
  confirmDocumentUploadSchema,
  createDocumentRequestSchema,
  listDocumentRequestsSchema,
  listStudentDocumentsSchema,
  updateDocumentRequestSchema,
  verifyDocumentSchema,
} from "../validations/document.validation";

const router = Router();

router.post(
  "/students/:studentId/document-requests",
  auth,
  requirePermission("doc.request.create"),
  validate(createDocumentRequestSchema),
  asyncHandler(DocumentController.createRequest),
);

router.get(
  "/students/:studentId/document-requests",
  auth,
  requirePermission("doc.request.read"),
  validate(listDocumentRequestsSchema),
  asyncHandler(DocumentController.listRequests),
);

router.get(
  "/students/:studentId/documents",
  auth,
  requirePermission("doc.read"),
  validate(listStudentDocumentsSchema),
  asyncHandler(DocumentController.listDocuments),
);

router.patch(
  "/document-requests/:id",
  auth,
  requirePermission("doc.request.update"),
  validate(updateDocumentRequestSchema),
  asyncHandler(DocumentController.updateRequest),
);

router.post(
  "/document-requests/:id/cancel",
  auth,
  requirePermission("doc.request.cancel"),
  validate(cancelDocumentRequestSchema),
  asyncHandler(DocumentController.cancelRequest),
);

router.post(
  "/documents/confirm-upload",
  auth,
  requirePermission("doc.upload"),
  validate(confirmDocumentUploadSchema),
  asyncHandler(DocumentController.confirmUpload),
);

router.post(
  "/documents/:versionId/verify",
  auth,
  validate(verifyDocumentSchema),
  (req, res, next) => {
    if (req.body.status === DocumentVerificationStatus.VERIFIED) {
      return requirePermission("doc.verify")(req, res, next);
    }
    return requirePermission("doc.reject")(req, res, next);
  },
  asyncHandler(DocumentController.verify),
);

export default router;

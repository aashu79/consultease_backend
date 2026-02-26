import { Router } from "express";
import { DocumentRequestStatus, DocumentVerificationStatus } from "@prisma/client";
import { z } from "zod";
import { DocumentController } from "../controllers/document.controller";
import { auth } from "../middlewares/auth";
import { requirePermission } from "../middlewares/requirePermission";
import { validate } from "../middlewares/validate";
import { asyncHandler } from "../utils/errors";

const router = Router();

router.post(
  "/students/:studentId/document-requests",
  auth,
  requirePermission("doc.request.create"),
  validate(
    z.object({
      params: z.object({ studentId: z.string().uuid() }),
      body: z.object({
        title: z.string().min(2),
        documentTypeKey: z.string().min(2),
        instructions: z.string().optional(),
        dueAt: z.string().optional(),
        caseId: z.string().uuid().optional(),
      }),
    }),
  ),
  asyncHandler(DocumentController.createRequest),
);

router.get(
  "/students/:studentId/document-requests",
  auth,
  requirePermission("doc.request.read"),
  validate(z.object({ params: z.object({ studentId: z.string().uuid() }) })),
  asyncHandler(DocumentController.listRequests),
);

router.patch(
  "/document-requests/:id",
  auth,
  requirePermission("doc.request.update"),
  validate(
    z.object({
      params: z.object({ id: z.string().uuid() }),
      body: z.object({
        title: z.string().min(2).optional(),
        instructions: z.string().optional(),
        dueAt: z.string().optional(),
        status: z.nativeEnum(DocumentRequestStatus).optional(),
      }),
    }),
  ),
  asyncHandler(DocumentController.updateRequest),
);

router.post(
  "/document-requests/:id/cancel",
  auth,
  requirePermission("doc.request.cancel"),
  validate(z.object({ params: z.object({ id: z.string().uuid() }) })),
  asyncHandler(DocumentController.cancelRequest),
);

router.post(
  "/documents/confirm-upload",
  auth,
  requirePermission("doc.upload"),
  validate(
    z.object({
      body: z.object({
        documentVersionId: z.string().uuid(),
      }),
    }),
  ),
  asyncHandler(DocumentController.confirmUpload),
);

router.post(
  "/documents/:versionId/verify",
  auth,
  validate(
    z.object({
      params: z.object({ versionId: z.string().uuid() }),
      body: z.object({
        status: z.nativeEnum(DocumentVerificationStatus),
        reason: z.string().optional(),
      }),
    }),
  ),
  (req, res, next) => {
    if (req.body.status === DocumentVerificationStatus.VERIFIED) {
      return requirePermission("doc.verify")(req, res, next);
    }
    return requirePermission("doc.reject")(req, res, next);
  },
  asyncHandler(DocumentController.verify),
);

export default router;

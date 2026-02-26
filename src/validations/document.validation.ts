import { DocumentRequestStatus, DocumentVerificationStatus } from "@prisma/client";
import { z } from "zod";

export const createDocumentRequestSchema = z.object({
  params: z.object({ studentId: z.string().uuid() }),
  body: z.object({
    title: z.string().min(2),
    documentTypeKey: z.string().min(2),
    instructions: z.string().optional(),
    dueAt: z.string().optional(),
    caseId: z.string().uuid().optional(),
  }),
});

export const listDocumentRequestsSchema = z.object({
  params: z.object({ studentId: z.string().uuid() }),
});

export const updateDocumentRequestSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    title: z.string().min(2).optional(),
    instructions: z.string().optional(),
    dueAt: z.string().optional(),
    status: z.nativeEnum(DocumentRequestStatus).optional(),
  }),
});

export const cancelDocumentRequestSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
});

export const confirmDocumentUploadSchema = z.object({
  body: z.object({
    documentVersionId: z.string().uuid(),
  }),
});

export const verifyDocumentSchema = z.object({
  params: z.object({ versionId: z.string().uuid() }),
  body: z.object({
    status: z.nativeEnum(DocumentVerificationStatus),
    reason: z.string().optional(),
  }),
});

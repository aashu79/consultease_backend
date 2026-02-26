import { z } from "zod";

export const signStorageUploadSchema = z.object({
  body: z.object({
    studentId: z.string().uuid(),
    documentTypeKey: z.string().min(2),
    fileName: z.string().min(1),
    mimeType: z.string().min(3),
    sizeBytes: z.number().int().positive(),
    requestId: z.string().uuid().optional(),
    expiresInSeconds: z.number().int().positive().optional(),
  }),
});

export const signStorageDownloadSchema = z.object({
  body: z.object({
    documentVersionId: z.string().uuid(),
    expiresInSeconds: z.number().int().positive().optional(),
  }),
});

export const signUserProfileUploadSchema = z.object({
  body: z.object({
    userId: z.string().uuid(),
    fileName: z.string().min(1),
    mimeType: z.string().min(3),
    sizeBytes: z.number().int().positive(),
    expiresInSeconds: z.number().int().positive().optional(),
  }),
});

export const confirmUserProfileUploadSchema = z.object({
  body: z.object({
    userId: z.string().uuid(),
    objectKey: z.string().min(10),
    mimeType: z.string().min(3),
  }),
});

export const signUserProfileDownloadSchema = z.object({
  body: z.object({
    userId: z.string().uuid(),
    expiresInSeconds: z.number().int().positive().optional(),
  }),
});

export const signStudentProfileUploadSchema = z.object({
  body: z.object({
    studentId: z.string().uuid(),
    fileName: z.string().min(1),
    mimeType: z.string().min(3),
    sizeBytes: z.number().int().positive(),
    expiresInSeconds: z.number().int().positive().optional(),
  }),
});

export const confirmStudentProfileUploadSchema = z.object({
  body: z.object({
    studentId: z.string().uuid(),
    objectKey: z.string().min(10),
    mimeType: z.string().min(3),
  }),
});

export const signStudentProfileDownloadSchema = z.object({
  body: z.object({
    studentId: z.string().uuid(),
    expiresInSeconds: z.number().int().positive().optional(),
  }),
});

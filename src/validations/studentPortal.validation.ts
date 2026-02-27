import { z } from "zod";
import { educationRecordSchema, testScoreSchema } from "./student.validation";

export const upsertMyStudentProfileSchema = z.object({
  body: z
    .object({
      fullName: z.string().min(2).optional(),
      dob: z.string().optional(),
      gender: z.string().optional(),
      email: z.string().email().optional(),
      phone: z.string().min(7).optional(),
      address: z.string().optional(),
      passportNo: z.string().optional(),
      passportExpiry: z.string().optional(),
      nationality: z.string().optional(),
      educationRecords: z.array(educationRecordSchema).optional(),
      testScores: z.array(testScoreSchema).optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: "At least one field is required",
    }),
});

export const signMyDocumentUploadSchema = z.object({
  body: z.object({
    documentTypeKey: z.string().min(2),
    fileName: z.string().min(1),
    mimeType: z.string().min(3),
    sizeBytes: z.number().int().positive(),
    requestId: z.string().uuid().optional(),
    expiresInSeconds: z.number().int().positive().optional(),
  }),
});

export const confirmMyDocumentUploadSchema = z.object({
  body: z.object({
    documentVersionId: z.string().uuid(),
  }),
});

export const signMyDocumentDownloadSchema = z.object({
  body: z.object({
    documentVersionId: z.string().uuid(),
    expiresInSeconds: z.number().int().positive().optional(),
  }),
});

export const signMyStudentProfileUploadSchema = z.object({
  body: z.object({
    fileName: z.string().min(1),
    mimeType: z.string().min(3),
    sizeBytes: z.number().int().positive(),
    expiresInSeconds: z.number().int().positive().optional(),
  }),
});

export const confirmMyStudentProfileUploadSchema = z.object({
  body: z.object({
    objectKey: z.string().min(10),
    mimeType: z.string().min(3),
  }),
});

export const signMyStudentProfileDownloadSchema = z.object({
  body: z.object({
    expiresInSeconds: z.number().int().positive().optional(),
  }),
});

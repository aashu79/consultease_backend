import { StudentCaseStatus, StudentStatus, UserStatus } from "@prisma/client";
import { z } from "zod";
import { strongPasswordRegex } from "./common.validation";

export const educationRecordSchema = z.object({
  level: z.string().min(1),
  institution: z.string().min(1),
  board: z.string().optional(),
  score: z.string().optional(),
  year: z.number().int().min(1900).max(2200).optional(),
});

export const educationRecordUpdateSchema = z
  .object({
    level: z.string().min(1).optional(),
    institution: z.string().min(1).optional(),
    board: z.string().optional(),
    score: z.string().optional(),
    year: z.number().int().min(1900).max(2200).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, "Provide at least one field to update");

export const testScoreSchema = z.object({
  testName: z.string().min(2),
  score: z.string().min(1),
  testDate: z.string().optional(),
});

export const testScoreUpdateSchema = z
  .object({
    testName: z.string().min(2).optional(),
    score: z.string().min(1).optional(),
    testDate: z.string().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, "Provide at least one field to update");

export const studentIdParamSchema = z.object({ params: z.object({ id: z.string().uuid() }) });

export const createStudentSchema = z.object({
  body: z.object({
    fullName: z.string().min(2),
    dob: z.string().optional(),
    gender: z.string().optional(),
    email: z.string().email().optional(),
    phone: z.string().min(7).optional(),
    address: z.string().optional(),
    passportNo: z.string().optional(),
    passportExpiry: z.string().optional(),
    nationality: z.string().optional(),
    status: z.nativeEnum(StudentStatus).optional(),
  }),
});

export const listStudentsSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    search: z.string().optional(),
  }),
});

export const updateStudentSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    fullName: z.string().min(2).optional(),
    dob: z.string().optional(),
    gender: z.string().optional(),
    email: z.string().email().optional(),
    phone: z.string().min(7).optional(),
    address: z.string().optional(),
    passportNo: z.string().optional(),
    passportExpiry: z.string().optional(),
    nationality: z.string().optional(),
    status: z.nativeEnum(StudentStatus).optional(),
  }),
});

export const upsertStudentProfileSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    fullName: z.string().min(2).optional(),
    dob: z.string().optional(),
    gender: z.string().optional(),
    email: z.string().email().optional(),
    phone: z.string().min(7).optional(),
    address: z.string().optional(),
    passportNo: z.string().optional(),
    passportExpiry: z.string().optional(),
    nationality: z.string().optional(),
    status: z.nativeEnum(StudentStatus).optional(),
    educationRecords: z.array(educationRecordSchema).optional(),
    testScores: z.array(testScoreSchema).optional(),
  }),
});

export const assignStudentSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    counselorId: z.string().uuid().nullable().optional(),
    docOfficerId: z.string().uuid().nullable().optional(),
    visaOfficerId: z.string().uuid().nullable().optional(),
  }),
});

export const createEducationRecordSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: educationRecordSchema,
});

export const updateEducationRecordSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
    educationRecordId: z.string().uuid(),
  }),
  body: educationRecordUpdateSchema,
});

export const deleteEducationRecordSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
    educationRecordId: z.string().uuid(),
  }),
});

export const createTestScoreSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: testScoreSchema,
});

export const updateTestScoreSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
    testScoreId: z.string().uuid(),
  }),
  body: testScoreUpdateSchema,
});

export const deleteTestScoreSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
    testScoreId: z.string().uuid(),
  }),
});

export const createCaseSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    intake: z.string().min(2),
    targetCountry: z.string().min(2),
    status: z.nativeEnum(StudentCaseStatus).optional(),
  }),
});

export const updateCaseSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    intake: z.string().optional(),
    targetCountry: z.string().optional(),
    status: z.nativeEnum(StudentCaseStatus).optional(),
  }),
});

export const createStudentPortalAccountSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    email: z.string().email(),
    password: z.string().regex(strongPasswordRegex),
    name: z.string().min(2).optional(),
    phone: z.string().min(7).optional(),
    autoActivate: z.boolean().optional(),
    sendVerificationOtp: z.boolean().optional(),
  }),
});

export const updateStudentPortalAccountSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z
    .object({
      email: z.string().email().optional(),
      password: z.string().regex(strongPasswordRegex).optional(),
      name: z.string().min(2).optional(),
      phone: z.string().min(7).nullable().optional(),
      status: z.nativeEnum(UserStatus).optional(),
      autoActivate: z.boolean().optional(),
      sendVerificationOtp: z.boolean().optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: "At least one field is required",
    }),
});

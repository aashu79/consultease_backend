import { Router } from "express";
import { StudentCaseStatus, StudentStatus } from "@prisma/client";
import { z } from "zod";
import { StudentController } from "../controllers/student.controller";
import { auth } from "../middlewares/auth";
import { requirePermission } from "../middlewares/requirePermission";
import { validate } from "../middlewares/validate";
import { asyncHandler } from "../utils/errors";

const router = Router();

const educationRecordSchema = z.object({
  level: z.string().min(1),
  institution: z.string().min(1),
  board: z.string().optional(),
  score: z.string().optional(),
  year: z.number().int().min(1900).max(2200).optional(),
});

const educationRecordUpdateSchema = z
  .object({
    level: z.string().min(1).optional(),
    institution: z.string().min(1).optional(),
    board: z.string().optional(),
    score: z.string().optional(),
    year: z.number().int().min(1900).max(2200).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, "Provide at least one field to update");

const testScoreSchema = z.object({
  testName: z.string().min(2),
  score: z.string().min(1),
  testDate: z.string().optional(),
});

const testScoreUpdateSchema = z
  .object({
    testName: z.string().min(2).optional(),
    score: z.string().min(1).optional(),
    testDate: z.string().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, "Provide at least one field to update");

// Students: create base profile
router.post(
  "/",
  auth,
  requirePermission("student.create"),
  validate(
    z.object({
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
    }),
  ),
  asyncHandler(StudentController.create),
);

// Students: list/search
router.get(
  "/",
  auth,
  requirePermission("student.read"),
  validate(
    z.object({
      query: z.object({
        page: z.string().optional(),
        limit: z.string().optional(),
        search: z.string().optional(),
      }),
    }),
  ),
  asyncHandler(StudentController.list),
);

// Students: fetch base profile
router.get(
  "/:id",
  auth,
  requirePermission("student.read"),
  validate(z.object({ params: z.object({ id: z.string().uuid() }) })),
  asyncHandler(StudentController.getById),
);

// Students: update base profile
router.patch(
  "/:id",
  auth,
  requirePermission("student.update"),
  validate(
    z.object({
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
    }),
  ),
  asyncHandler(StudentController.update),
);

// Students: read full detailed profile (base + assignment + cases + education + test scores)
router.get(
  "/:id/profile",
  auth,
  requirePermission("student.read"),
  validate(z.object({ params: z.object({ id: z.string().uuid() }) })),
  asyncHandler(StudentController.getProfile),
);

// Students: create/update full detailed profile in one request
router.put(
  "/:id/profile",
  auth,
  requirePermission("student.update"),
  validate(
    z.object({
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
    }),
  ),
  asyncHandler(StudentController.upsertProfile),
);

// Students: assign staff ownership
router.patch(
  "/:id/assignment",
  auth,
  requirePermission("student.update"),
  validate(
    z.object({
      params: z.object({ id: z.string().uuid() }),
      body: z.object({
        counselorId: z.string().uuid().nullable().optional(),
        docOfficerId: z.string().uuid().nullable().optional(),
        visaOfficerId: z.string().uuid().nullable().optional(),
      }),
    }),
  ),
  asyncHandler(StudentController.assign),
);

// Students: education records list
router.get(
  "/:id/education-records",
  auth,
  requirePermission("student.read"),
  validate(
    z.object({
      params: z.object({ id: z.string().uuid() }),
    }),
  ),
  asyncHandler(StudentController.listEducationRecords),
);

// Students: create education record
router.post(
  "/:id/education-records",
  auth,
  requirePermission("student.update"),
  validate(
    z.object({
      params: z.object({ id: z.string().uuid() }),
      body: educationRecordSchema,
    }),
  ),
  asyncHandler(StudentController.createEducationRecord),
);

// Students: update education record
router.patch(
  "/:id/education-records/:educationRecordId",
  auth,
  requirePermission("student.update"),
  validate(
    z.object({
      params: z.object({
        id: z.string().uuid(),
        educationRecordId: z.string().uuid(),
      }),
      body: educationRecordUpdateSchema,
    }),
  ),
  asyncHandler(StudentController.updateEducationRecord),
);

// Students: delete education record
router.delete(
  "/:id/education-records/:educationRecordId",
  auth,
  requirePermission("student.update"),
  validate(
    z.object({
      params: z.object({
        id: z.string().uuid(),
        educationRecordId: z.string().uuid(),
      }),
    }),
  ),
  asyncHandler(StudentController.deleteEducationRecord),
);

// Students: test scores list
router.get(
  "/:id/test-scores",
  auth,
  requirePermission("student.read"),
  validate(
    z.object({
      params: z.object({ id: z.string().uuid() }),
    }),
  ),
  asyncHandler(StudentController.listTestScores),
);

// Students: create test score
router.post(
  "/:id/test-scores",
  auth,
  requirePermission("student.update"),
  validate(
    z.object({
      params: z.object({ id: z.string().uuid() }),
      body: testScoreSchema,
    }),
  ),
  asyncHandler(StudentController.createTestScore),
);

// Students: update test score
router.patch(
  "/:id/test-scores/:testScoreId",
  auth,
  requirePermission("student.update"),
  validate(
    z.object({
      params: z.object({
        id: z.string().uuid(),
        testScoreId: z.string().uuid(),
      }),
      body: testScoreUpdateSchema,
    }),
  ),
  asyncHandler(StudentController.updateTestScore),
);

// Students: delete test score
router.delete(
  "/:id/test-scores/:testScoreId",
  auth,
  requirePermission("student.update"),
  validate(
    z.object({
      params: z.object({
        id: z.string().uuid(),
        testScoreId: z.string().uuid(),
      }),
    }),
  ),
  asyncHandler(StudentController.deleteTestScore),
);

// Cases: create
router.post(
  "/:id/cases",
  auth,
  requirePermission("case.create"),
  validate(
    z.object({
      params: z.object({ id: z.string().uuid() }),
      body: z.object({
        intake: z.string().min(2),
        targetCountry: z.string().min(2),
        status: z.nativeEnum(StudentCaseStatus).optional(),
      }),
    }),
  ),
  asyncHandler(StudentController.createCase),
);

export const caseRouter = Router();

// Cases: update
caseRouter.patch(
  "/:id",
  auth,
  requirePermission("case.update"),
  validate(
    z.object({
      params: z.object({ id: z.string().uuid() }),
      body: z.object({
        intake: z.string().optional(),
        targetCountry: z.string().optional(),
        status: z.nativeEnum(StudentCaseStatus).optional(),
      }),
    }),
  ),
  asyncHandler(StudentController.updateCase),
);

export default router;

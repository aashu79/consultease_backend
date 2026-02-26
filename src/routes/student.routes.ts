import { Router } from "express";
import { StudentController } from "../controllers/student.controller";
import { auth } from "../middlewares/auth";
import { requirePermission } from "../middlewares/requirePermission";
import { validate } from "../middlewares/validate";
import { asyncHandler } from "../utils/errors";
import {
  assignStudentSchema,
  createCaseSchema,
  createEducationRecordSchema,
  createStudentPortalAccountSchema,
  createStudentSchema,
  createTestScoreSchema,
  deleteEducationRecordSchema,
  deleteTestScoreSchema,
  listStudentsSchema,
  studentIdParamSchema,
  updateCaseSchema,
  updateEducationRecordSchema,
  updateStudentPortalAccountSchema,
  updateStudentSchema,
  updateTestScoreSchema,
  upsertStudentProfileSchema,
} from "../validations/student.validation";

const router = Router();

// Students: create base profile
router.post(
  "/",
  auth,
  requirePermission("student.create"),
  validate(createStudentSchema),
  asyncHandler(StudentController.create),
);

// Students: list/search
router.get(
  "/",
  auth,
  requirePermission("student.read"),
  validate(listStudentsSchema),
  asyncHandler(StudentController.list),
);

// Students: fetch base profile
router.get(
  "/:id",
  auth,
  requirePermission("student.read"),
  validate(studentIdParamSchema),
  asyncHandler(StudentController.getById),
);

// Students: update base profile
router.patch(
  "/:id",
  auth,
  requirePermission("student.update"),
  validate(updateStudentSchema),
  asyncHandler(StudentController.update),
);

// Students: read full detailed profile (base + assignment + cases + education + test scores)
router.get(
  "/:id/profile",
  auth,
  requirePermission("student.read"),
  validate(studentIdParamSchema),
  asyncHandler(StudentController.getProfile),
);

// Students: create/update full detailed profile in one request
router.put(
  "/:id/profile",
  auth,
  requirePermission("student.update"),
  validate(upsertStudentProfileSchema),
  asyncHandler(StudentController.upsertProfile),
);

// Students: portal login account operations
router.get(
  "/:id/portal-account",
  auth,
  requirePermission("student.read"),
  validate(studentIdParamSchema),
  asyncHandler(StudentController.getPortalAccount),
);

router.post(
  "/:id/portal-account",
  auth,
  requirePermission("student.update"),
  requirePermission("user.create"),
  validate(createStudentPortalAccountSchema),
  asyncHandler(StudentController.createPortalAccount),
);

router.patch(
  "/:id/portal-account",
  auth,
  requirePermission("student.update"),
  requirePermission("user.update"),
  validate(updateStudentPortalAccountSchema),
  asyncHandler(StudentController.updatePortalAccount),
);

// Students: assign staff ownership
router.patch(
  "/:id/assignment",
  auth,
  requirePermission("student.update"),
  validate(assignStudentSchema),
  asyncHandler(StudentController.assign),
);

// Students: education records list
router.get(
  "/:id/education-records",
  auth,
  requirePermission("student.read"),
  validate(studentIdParamSchema),
  asyncHandler(StudentController.listEducationRecords),
);

// Students: create education record
router.post(
  "/:id/education-records",
  auth,
  requirePermission("student.update"),
  validate(createEducationRecordSchema),
  asyncHandler(StudentController.createEducationRecord),
);

// Students: update education record
router.patch(
  "/:id/education-records/:educationRecordId",
  auth,
  requirePermission("student.update"),
  validate(updateEducationRecordSchema),
  asyncHandler(StudentController.updateEducationRecord),
);

// Students: delete education record
router.delete(
  "/:id/education-records/:educationRecordId",
  auth,
  requirePermission("student.update"),
  validate(deleteEducationRecordSchema),
  asyncHandler(StudentController.deleteEducationRecord),
);

// Students: test scores list
router.get(
  "/:id/test-scores",
  auth,
  requirePermission("student.read"),
  validate(studentIdParamSchema),
  asyncHandler(StudentController.listTestScores),
);

// Students: create test score
router.post(
  "/:id/test-scores",
  auth,
  requirePermission("student.update"),
  validate(createTestScoreSchema),
  asyncHandler(StudentController.createTestScore),
);

// Students: update test score
router.patch(
  "/:id/test-scores/:testScoreId",
  auth,
  requirePermission("student.update"),
  validate(updateTestScoreSchema),
  asyncHandler(StudentController.updateTestScore),
);

// Students: delete test score
router.delete(
  "/:id/test-scores/:testScoreId",
  auth,
  requirePermission("student.update"),
  validate(deleteTestScoreSchema),
  asyncHandler(StudentController.deleteTestScore),
);

// Cases: create
router.post(
  "/:id/cases",
  auth,
  requirePermission("case.create"),
  validate(createCaseSchema),
  asyncHandler(StudentController.createCase),
);

export const caseRouter = Router();

// Cases: update
caseRouter.patch(
  "/:id",
  auth,
  requirePermission("case.update"),
  validate(updateCaseSchema),
  asyncHandler(StudentController.updateCase),
);

export default router;

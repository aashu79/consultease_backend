# Consultease API Reference (v1)

## Base URL

`{{API_BASE_URL}}/v1`

## Standard Response Envelope

Success:

```json
{
  "success": true,
  "data": {},
  "requestId": "uuid"
}
```

Error:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": {}
  },
  "requestId": "uuid"
}
```

## Auth, Tenant, and Headers

- Bearer token header for protected APIs: `Authorization: Bearer <accessToken>`
- Tenant header for tenant-scoped APIs: `X-Consultancy-Slug: <slug>`
- `X-Tenant-Slug` is also accepted by tenant resolver.
- Auth module endpoints can resolve consultancy from:
  - body: `consultancySlug` or `tenantSlug`
  - header: `X-Consultancy-Slug` or `X-Tenant-Slug`

## Important Rules

- All tenant-scoped data is isolated by `consultancyId`.
- Password policy:
  - minimum 8 chars
  - at least 1 uppercase, 1 lowercase, 1 number, 1 special character
- OTP is 6 digits and expires in 10 minutes.
- Signed URL expiry defaults to 1200s; max 3600s.

## Common Error Codes

- `VALIDATION_ERROR`
- `UNAUTHORIZED`
- `FORBIDDEN`
- `CONSULTANCY_HEADER_MISSING`
- `CONSULTANCY_NOT_FOUND`
- `CONSULTANCY_INACTIVE`
- `CONSULTANCY_MISMATCH`
- `USER_INACTIVE`
- `PHONE_ALREADY_IN_USE`
- `RATE_LIMITED`
- `INTERNAL_SERVER_ERROR`
- `NOT_FOUND`

---

## 1) Tenant Module

### POST `/tenants/register` (alias: `/consultancies/register`)

- Auth: No
- Body:

```json
{
  "name": "Acme Consultancy",
  "country": "Nepal",
  "timezone": "Asia/Kathmandu",
  "email": "info@acme.test",
  "phone": "+9779800000000",
  "address": "Kathmandu",
  "website": "https://acme.test",
  "ownerName": "Owner Name",
  "ownerEmail": "owner@acme.test",
  "ownerPhone": "+9779811111111",
  "ownerPassword": "StrongP@ss123"
}
```

- Success `201` (`data`):

```json
{
  "consultancyId": "uuid",
  "ownerUserId": "uuid",
  "slug": "acme-consultancy"
}
```

- `website` accepts either full URL (`https://example.com`) or domain (`example.com` / `www.example.com`); backend normalizes domain-only values to `https://...`.

- Module errors:
  - `VALIDATION_ERROR`
  - `CONSULTANCY_NOT_FOUND` (rare, post-create checks)

### GET `/tenants/me` (alias: `/consultancies/me`)

- Auth: Yes
- Headers: `Authorization`, `X-Consultancy-Slug`
- Permission: `consultancy.read`
- Success `200`: consultancy profile object
- Module errors:
  - `UNAUTHORIZED`
  - `FORBIDDEN`
  - `CONSULTANCY_NOT_FOUND`

---

## 2) Auth Module

### POST `/auth/request-otp`

- Auth: Optional
- Body:

```json
{
  "consultancySlug": "acme-consultancy",
  "destination": "owner@acme.test",
  "channel": "EMAIL",
  "purpose": "VERIFY_EMAIL"
}
```

- `consultancySlug` optional. If omitted, backend attempts inference from destination.
- Success `200` (`data`):

```json
{
  "success": true,
  "consultancySlug": "acme-consultancy"
}
```

- Module errors:
  - `RATE_LIMITED`
  - `CONSULTANCY_CONTEXT_REQUIRED`
  - `CONSULTANCY_NOT_FOUND`

### POST `/auth/verify-otp`

- Auth: No
- Body:

```json
{
  "consultancySlug": "acme-consultancy",
  "destination": "owner@acme.test",
  "channel": "EMAIL",
  "purpose": "VERIFY_EMAIL",
  "otp": "123456"
}
```

- Success `200` (`data`):

```json
{
  "verified": true,
  "consultancySlug": "acme-consultancy"
}
```

- Module errors:
  - `OTP_INVALID`
  - `OTP_ATTEMPTS_EXCEEDED`
  - `CONSULTANCY_CONTEXT_REQUIRED`
  - `CONSULTANCY_NOT_FOUND`

### POST `/auth/login`

- Auth: No
- Body:

```json
{
  "consultancySlug": "acme-consultancy",
  "email": "owner@acme.test",
  "password": "StrongP@ss123",
  "deviceId": "browser-1"
}
```

- `consultancySlug` optional unless same email exists in multiple consultancies.
- Success `200` (`data`):

```json
{
  "accessToken": "jwt",
  "refreshToken": "jwt",
  "consultancySlug": "acme-consultancy",
  "user": {
    "id": "uuid",
    "name": "Owner Name",
    "email": "owner@acme.test",
    "phone": "+9779811111111",
    "status": "ACTIVE",
    "roles": [{ "id": "uuid", "key": "SUPER_ADMIN", "name": "Super Admin" }],
    "permissions": ["tenant.read", "user.create"],
    "emailVerified": true,
    "phoneVerified": false
  }
}
```

- Module errors:
  - `INVALID_CREDENTIALS`
  - `EMAIL_NOT_VERIFIED`
  - `USER_INACTIVE`
  - `CONSULTANCY_CONTEXT_REQUIRED`
  - `CONSULTANCY_NOT_FOUND`

### POST `/auth/refresh`

- Auth: No
- Body:

```json
{
  "refreshToken": "jwt"
}
```

- Success `200` (`data`):

```json
{
  "accessToken": "jwt",
  "refreshToken": "jwt",
  "consultancySlug": "acme-consultancy"
}
```

- Module errors:
  - `INVALID_REFRESH`
  - `CONSULTANCY_NOT_FOUND`

### POST `/auth/logout`

- Auth: No
- Body:

```json
{
  "refreshToken": "jwt"
}
```

- Success `200` (`data`):

```json
{
  "success": true
}
```

- Module errors:
  - `INVALID_REFRESH`

### POST `/auth/forgot-password/request`

- Auth: No
- Body:

```json
{
  "consultancySlug": "acme-consultancy",
  "email": "user@acme.test"
}
```

- Success `200` (`data`):

```json
{
  "success": true
}
```

### POST `/auth/forgot-password/confirm`

- Auth: No
- Body:

```json
{
  "consultancySlug": "acme-consultancy",
  "email": "user@acme.test",
  "otp": "123456",
  "newPassword": "NewStrongP@ss123"
}
```

- Success `200` (`data`):

```json
{
  "success": true
}
```

- Module errors:
  - `OTP_INVALID`
  - `OTP_ATTEMPTS_EXCEEDED`
  - `CONSULTANCY_NOT_FOUND`

---

## 3) Users and Invitations Module

### POST `/users/invite`

- Auth: Yes
- Headers: `Authorization`, `X-Consultancy-Slug`
- Permission: `user.create`
- Body:

```json
{
  "email": "staff@acme.test",
  "phone": "+9779812345678",
  "roleKeys": ["COUNSELOR"]
}
```

- Success `201` (`data`):

```json
{
  "invitationId": "uuid"
}
```

- Module errors:
  - `INVALID_INVITATION`
  - `INVALID_ROLE_KEYS`

### POST `/invitations/accept`

- Auth: No
- Body:

```json
{
  "consultancySlug": "acme-consultancy",
  "token": "invitation-token",
  "name": "Staff Name",
  "password": "StrongP@ss123"
}
```

- Success `201` (`data`):

```json
{
  "userId": "uuid"
}
```

- Module errors:
  - `VALIDATION_ERROR`
  - `INVITATION_INVALID`
  - `USER_EXISTS`
  - `CONSULTANCY_NOT_FOUND`

### GET `/users`

- Auth: Yes
- Permission: `user.read`
- Success `200`: array of users with roles and verification info

### PATCH `/users/:id`

- Auth: Yes
- Permission: `user.update`
- Body (partial):

```json
{
  "name": "Updated Name",
  "phone": "+9779812345678",
  "status": "SUSPENDED"
}
```

- Success `200` (`data`):

```json
{
  "userId": "uuid"
}
```

- Module errors:
  - `USER_NOT_FOUND`

### POST `/users/:id/roles`

- Auth: Yes
- Permission: `role.assign`
- Body:

```json
{
  "roleKeys": ["VISA_OFFICER", "DOCUMENTATION_OFFICER"]
}
```

- Success `200`: updated roles for user
- Module errors:
  - `INVALID_ROLE_KEYS`

---

## 4) RBAC Module

### POST `/roles`

- Auth: Yes
- Permission: `role.create`
- Body:

```json
{
  "key": "CUSTOM_ROLE",
  "name": "Custom Role"
}
```

- Success `201`: role object

### GET `/roles`

- Auth: Yes
- Permission: `role.read`
- Success `200`: role list

### PATCH `/roles/:id`

- Auth: Yes
- Permission: `role.update`
- Body (partial):

```json
{
  "name": "Senior Counselor"
}
```

- Success `200`: updated role
- Module errors:
  - `ROLE_NOT_FOUND`

### POST `/roles/:id/permissions`

- Auth: Yes
- Permission: `permission.manage`
- Body:

```json
{
  "permissions": [
    { "permissionKey": "student.read", "allowed": true },
    { "permissionKey": "doc.verify", "allowed": false }
  ]
}
```

- Success `200`: updated role-permission matrix
- Module errors:
  - `ROLE_NOT_FOUND`

---

## 5) Marketing Module (Super Admin Only)

### POST `/marketing/email`

- Auth: Yes
- Headers: `Authorization`, `X-Consultancy-Slug`
- Guard: Super Admin role required
- Body:

```json
{
  "subject": "Spring Intake Offer",
  "message": "Apply now and get priority counseling.",
  "recipients": ["a@example.com", "b@example.com"],
  "includeUsers": false,
  "includeStudents": true,
  "includeLeads": true
}
```

- Success `200` (`data`):

```json
{
  "subject": "Spring Intake Offer",
  "totalRecipients": 120,
  "sent": 117,
  "failed": 3,
  "failures": [{ "destination": "a@example.com", "error": "..." }]
}
```

- Module errors:
  - `NO_RECIPIENTS`
  - `RECIPIENT_LIMIT_EXCEEDED`

### POST `/marketing/sms`

- Auth: Yes
- Guard: Super Admin role required
- Body:

```json
{
  "message": "New intake open now.",
  "recipients": ["+9779800000001"],
  "includeUsers": false,
  "includeStudents": true,
  "includeLeads": true
}
```

- Success `200` (`data`):

```json
{
  "totalRecipients": 200,
  "sent": 190,
  "failed": 10,
  "failures": [{ "destination": "+9779800000001", "error": "..." }]
}
```

---

## 6) Leads Module

### POST `/leads`

- Auth: Yes
- Permission: `lead.create`
- Body:

```json
{
  "fullName": "Lead Name",
  "email": "lead@sample.test",
  "phone": "+9779800000011",
  "source": "facebook",
  "assignedToUserId": "uuid",
  "notes": "Interested in Australia"
}
```

- Success `201`: lead object

### GET `/leads`

- Auth: Yes
- Permission: `lead.read`
- Query params:
  - `stage` (`NEW|CONTACTED|COUNSELING|FOLLOW_UP|QUALIFIED|CONVERTED|LOST`)
  - `assignedTo` (userId)
  - `search`
  - `page`
  - `limit`
- Success `200`: paginated leads

### PATCH `/leads/:id`

- Auth: Yes
- Permission: `lead.update`
- Body: partial lead fields + `stage` + `status`
- Success `200`: `{ "leadId": "uuid" }`
- Module errors:
  - `LEAD_NOT_FOUND`

### POST `/leads/:id/activities`

- Auth: Yes
- Permission: `lead.update`
- Body:

```json
{
  "type": "CALL",
  "note": "Discussed test requirements"
}
```

- Success `201`: activity object
- Module errors:
  - `LEAD_NOT_FOUND`

### POST `/leads/:id/convert-to-student`

- Auth: Yes
- Permission: `lead.convert`
- Body:

```json
{
  "intake": "Fall 2026",
  "targetCountry": "Australia"
}
```

- Success `200`: converted lead + created student (+ case when provided)
- Module errors:
  - `LEAD_NOT_FOUND`

---

## 7) Students Module

### Base Student Profile APIs

#### POST `/students`

- Auth: Yes
- Permission: `student.create`
- Body:

```json
{
  "fullName": "John Student",
  "dob": "2003-01-15",
  "gender": "Male",
  "email": "john@student.test",
  "phone": "+9779800001234",
  "address": "Kathmandu",
  "passportNo": "P1234567",
  "passportExpiry": "2030-05-01",
  "nationality": "Nepali",
  "status": "ACTIVE"
}
```

- Success `201`: student object

#### GET `/students`

- Auth: Yes
- Permission: `student.read`
- Query: `search`, `page`, `limit`
- Success `200`: paginated students

#### GET `/students/:id`

- Auth: Yes
- Permission: `student.read`
- Success `200`: base student record + assignment/cases snapshot
- Module errors:
  - `STUDENT_NOT_FOUND`

#### PATCH `/students/:id`

- Auth: Yes
- Permission: `student.update`
- Body: any subset of student base fields
- Success `200`:

```json
{
  "studentId": "uuid"
}
```

- Module errors:
  - `STUDENT_NOT_FOUND`

### Detailed Student Profile APIs

#### GET `/students/:id/profile`

- Auth: Yes
- Permission: `student.read`
- Success `200`: student + assignments + cases + educationRecords + testScores + portal account summary

#### PUT `/students/:id/profile`

- Auth: Yes
- Permission: `student.update`
- Body (all optional; arrays replace existing records if provided):

```json
{
  "fullName": "John Student",
  "email": "john@student.test",
  "educationRecords": [
    {
      "level": "HIGH_SCHOOL",
      "institution": "ABC School",
      "board": "NEB",
      "score": "3.6",
      "year": 2020
    }
  ],
  "testScores": [
    {
      "testName": "IELTS",
      "score": "7.5",
      "testDate": "2026-01-10"
    }
  ]
}
```

- Success `200`: full updated detailed profile
- Module errors:
  - `STUDENT_NOT_FOUND`

### Student Portal Login Credential APIs

#### GET `/students/:id/portal-account`

- Auth: Yes
- Permission: `student.read`
- Success `200` (`data`):

```json
{
  "studentId": "uuid",
  "hasPortalAccount": true,
  "portalAccount": {
    "userId": "uuid",
    "name": "John Student",
    "email": "john@student.test",
    "phone": "+9779800001234",
    "status": "ACTIVE",
    "emailVerified": true,
    "phoneVerified": false
  }
}
```

- Module errors:
  - `STUDENT_NOT_FOUND`

#### POST `/students/:id/portal-account`

- Auth: Yes
- Permissions: `student.update` and `user.create`
- Purpose: create student login credentials.
- Body:

```json
{
  "email": "john@student.test",
  "password": "StrongP@ss123",
  "name": "John Student",
  "phone": "+9779800001234",
  "autoActivate": true,
  "sendVerificationOtp": false
}
```

- Success `201` (`data`):

```json
{
  "studentId": "uuid",
  "portalUserId": "uuid",
  "consultancySlug": "acme-consultancy",
  "email": "john@student.test",
  "status": "ACTIVE",
  "requiresEmailVerification": false
}
```

- Module errors:
  - `STUDENT_NOT_FOUND`
  - `PORTAL_ACCOUNT_EXISTS`
  - `USER_EXISTS`
  - `PHONE_ALREADY_IN_USE`

#### PATCH `/students/:id/portal-account`

- Auth: Yes
- Permissions: `student.update` and `user.update`
- Purpose: update student login credentials/profile.
- Body (at least one field required):

```json
{
  "email": "john.new@student.test",
  "password": "NewStrongP@ss123",
  "name": "John Updated",
  "phone": "+9779800009999",
  "status": "ACTIVE",
  "autoActivate": true,
  "sendVerificationOtp": false
}
```

- Success `200`: same payload shape as `GET /students/:id/portal-account`
- Module errors:
  - `STUDENT_NOT_FOUND`
  - `PORTAL_ACCOUNT_NOT_FOUND`
  - `USER_EXISTS`
  - `PHONE_ALREADY_IN_USE`

### Assignment, Education, Scores, and Cases

#### PATCH `/students/:id/assignment`

- Permission: `student.update`
- Body:

```json
{
  "counselorId": "uuid",
  "docOfficerId": "uuid",
  "visaOfficerId": "uuid"
}
```

#### GET `/students/:id/education-records`

- Permission: `student.read`

#### POST `/students/:id/education-records`

- Permission: `student.update`
- Body:

```json
{
  "level": "BACHELORS",
  "institution": "Tribhuvan University",
  "board": "TU",
  "score": "72%",
  "year": 2024
}
```

#### PATCH `/students/:id/education-records/:educationRecordId`

- Permission: `student.update`
- Body: partial `level|institution|board|score|year`

#### DELETE `/students/:id/education-records/:educationRecordId`

- Permission: `student.update`

#### GET `/students/:id/test-scores`

- Permission: `student.read`

#### POST `/students/:id/test-scores`

- Permission: `student.update`
- Body:

```json
{
  "testName": "PTE",
  "score": "64",
  "testDate": "2026-02-01"
}
```

#### PATCH `/students/:id/test-scores/:testScoreId`

- Permission: `student.update`
- Body: partial `testName|score|testDate`

#### DELETE `/students/:id/test-scores/:testScoreId`

- Permission: `student.update`

#### POST `/students/:id/cases`

- Permission: `case.create`
- Body:

```json
{
  "intake": "Fall 2026",
  "targetCountry": "Canada",
  "status": "ACTIVE"
}
```

#### PATCH `/cases/:id`

- Permission: `case.update`
- Body: partial `intake|targetCountry|status`

---

## 8) Document Requests and Storage Module

### Document Request APIs

#### POST `/students/:studentId/document-requests`

- Auth: Yes
- Permission: `doc.request.create`
- Body:

```json
{
  "title": "Passport Scan",
  "documentTypeKey": "passport",
  "instructions": "Upload color scan",
  "dueAt": "2026-04-10T00:00:00.000Z",
  "caseId": "uuid"
}
```

#### GET `/students/:studentId/document-requests`

- Permission: `doc.request.read`

#### PATCH `/document-requests/:id`

- Permission: `doc.request.update`
- Body (partial): `title`, `instructions`, `dueAt`, `status`

#### POST `/document-requests/:id/cancel`

- Permission: `doc.request.cancel`

### Document Version and Verification APIs

#### POST `/storage/sign-upload`

- Permissions: `storage.sign.upload`, `doc.upload`
- Body:

```json
{
  "studentId": "uuid",
  "documentTypeKey": "passport",
  "fileName": "passport.pdf",
  "mimeType": "application/pdf",
  "sizeBytes": 120340,
  "requestId": "uuid",
  "expiresInSeconds": 1200
}
```

- Success `200` (`data`):

```json
{
  "documentVersionId": "uuid",
  "bucket": "consultease",
  "objectKey": "{consultancyId}/students/{studentId}/documents/passport/{documentVersionId}/passport.pdf",
  "uploadUrl": "https://...",
  "expiresInSeconds": 1200
}
```

- Module errors:
  - `INVALID_MIME_TYPE`
  - `INVALID_FILE_SIZE`
  - `INVALID_FILE_NAME`
  - `STUDENT_NOT_FOUND`
  - `INVALID_REQUEST`
  - `REQUEST_CLOSED`

#### POST `/documents/confirm-upload`

- Permission: `doc.upload`
- Body:

```json
{
  "documentVersionId": "uuid"
}
```

- Success `200`: confirmed version object
- Module errors:
  - `VERSION_NOT_FOUND`
  - `UPLOAD_NOT_FOUND`

#### POST `/storage/sign-download`

- Permissions: `storage.sign.download`, `doc.read`
- Body:

```json
{
  "documentVersionId": "uuid",
  "expiresInSeconds": 1200
}
```

- Success `200` (`data`):

```json
{
  "documentVersionId": "uuid",
  "downloadUrl": "https://...",
  "expiresInSeconds": 1200
}
```

#### POST `/documents/:versionId/verify`

- If body status is `VERIFIED`, permission `doc.verify` is required.
- If body status is `REJECTED`, permission `doc.reject` is required.
- Body:

```json
{
  "status": "VERIFIED",
  "reason": "Required when status is REJECTED"
}
```

- Success `200`: verification record
- Module errors:
  - `VERSION_NOT_FOUND`
  - `REASON_REQUIRED`

### User Profile Image Storage APIs

#### POST `/storage/sign-upload/user-profile`

- Permissions: `storage.sign.upload`, `user.update`
- Body:

```json
{
  "userId": "uuid",
  "fileName": "avatar.png",
  "mimeType": "image/png",
  "sizeBytes": 34567,
  "expiresInSeconds": 1200
}
```

#### POST `/storage/confirm-upload/user-profile`

- Permission: `user.update`
- Body:

```json
{
  "userId": "uuid",
  "objectKey": "{consultancyId}/users/{userId}/profile/{uuid}-avatar.png",
  "mimeType": "image/png"
}
```

#### POST `/storage/sign-download/user-profile`

- Permissions: `storage.sign.download`, `user.read`
- Body:

```json
{
  "userId": "uuid",
  "expiresInSeconds": 1200
}
```

### Student Profile Image Storage APIs

#### POST `/storage/sign-upload/student-profile`

- Permissions: `storage.sign.upload`, `student.update`
- Body:

```json
{
  "studentId": "uuid",
  "fileName": "student-photo.jpg",
  "mimeType": "image/jpeg",
  "sizeBytes": 56789,
  "expiresInSeconds": 1200
}
```

#### POST `/storage/confirm-upload/student-profile`

- Permission: `student.update`
- Body:

```json
{
  "studentId": "uuid",
  "objectKey": "{consultancyId}/students/{studentId}/profile/{uuid}-student-photo.jpg",
  "mimeType": "image/jpeg"
}
```

#### POST `/storage/sign-download/student-profile`

- Permissions: `storage.sign.download`, `student.read`
- Body:

```json
{
  "studentId": "uuid",
  "expiresInSeconds": 1200
}
```

---

## 9) Dashboard Module

### GET `/students/:studentId/dashboard`

- Auth: Yes
- Permission: `student.read`
- Success `200` (`data`):

```json
{
  "student": {
    "id": "uuid",
    "fullName": "John Student",
    "email": "john@student.test",
    "phone": "+9779800001234",
    "status": "ACTIVE"
  },
  "cases": [],
  "documentRequests": {
    "open": [],
    "recentlyFulfilled": []
  },
  "documentsByType": [
    {
      "documentTypeKey": "passport",
      "latestVersion": {
        "id": "uuid",
        "versionNumber": 2
      },
      "verificationStatus": "PENDING",
      "lastUpdatedAt": "2026-02-26T12:00:00.000Z"
    }
  ]
}
```

### GET `/students/me/dashboard`

- Auth: Yes
- Intended for student portal account login.
- No explicit permission check; account must be linked to a student profile.
- Success `200`: same shape as `/students/:studentId/dashboard`
- Module errors:
  - `STUDENT_PORTAL_PROFILE_NOT_FOUND`

---

## 10) Audit Module

### GET `/audit`

- Auth: Yes
- Permission: `audit.read`
- Query params:
  - `actorUserId` (uuid)
  - `action`
  - `from` (ISO date string)
  - `to` (ISO date string)
  - `page`
  - `limit`
- Success `200`: paginated audit logs

---

## 11) Student Login Flow (Frontend Ready)

1. Staff creates student base profile using `POST /students`.
2. Staff creates student credentials using `POST /students/:id/portal-account`.
3. If `autoActivate` was `false`, verify with OTP:
   - `POST /auth/request-otp`
   - `POST /auth/verify-otp`
4. Student logs in using `POST /auth/login` with portal account email/password.
5. Student calls `GET /students/me/dashboard` with:
   - `Authorization: Bearer <accessToken>`
   - `X-Consultancy-Slug: <slug>`
6. Student refreshes token via `POST /auth/refresh` (refresh token rotation enabled).

---

## 12) Storage and MIME Rules

- Root bucket: `consultease`
- Document object key pattern:
  - `{consultancyId}/students/{studentId}/documents/{documentTypeKey}/{documentVersionId}/{safeFileName}`
- User profile object key pattern:
  - `{consultancyId}/users/{userId}/profile/{uuid-safeFileName}`
- Student profile object key pattern:
  - `{consultancyId}/students/{studentId}/profile/{uuid-safeFileName}`
- Allowed document mime types:
  - `application/pdf`
  - `image/jpeg`
  - `image/jpg`
  - `image/png`
- Allowed profile image mime types:
  - `image/jpeg`
  - `image/jpg`
  - `image/png`
  - `image/webp`

# Consultease API Reference (v1)

## Base URL

- `{{API_BASE_URL}}/v1`

## Common Conventions

- Success envelope:

```json
{ "success": true, "data": {}, "requestId": "uuid" }
```

- Error envelope:

```json
{
  "success": false,
  "error": { "code": "ERROR_CODE", "message": "Message", "details": {} },
  "requestId": "uuid"
}
```

- Auth header (protected routes): `Authorization: Bearer <accessToken>`
- Consultancy header (consultancy-scoped protected routes): `X-Consultancy-Slug: <slug>`
- Access token expiry: 15m
- Refresh token expiry: 30d (rotation enabled)

## Global Error Codes

- `VALIDATION_ERROR`
- `UNAUTHORIZED`
- `FORBIDDEN`
- `CONSULTANCY_NOT_FOUND`
- `CONSULTANCY_HEADER_MISSING`
- `CONSULTANCY_MISMATCH`
- `RATE_LIMITED`
- `INTERNAL_SERVER_ERROR`
- `NOT_FOUND`

---

## Consultancy Module

### POST `/consultancies/register`

- Auth: No
- Headers: none
- Body:

```json
{
  "name": "Acme Consultancy",
  "country": "Nepal",
  "timezone": "Asia/Kathmandu",
  "email": "hello@acme.com",
  "phone": "+97798XXXXXXXX",
  "address": "Kathmandu",
  "website": "https://acme.com",
  "ownerName": "Owner Name",
  "ownerEmail": "owner@acme.com",
  "ownerPhone": "+97798XXXXXXXX",
  "ownerPassword": "StrongP@ss123"
}
```

- Notes:
  - `slug` is generated automatically from consultancy `name` on the server.
- Response `201`:

```json
{
  "success": true,
  "data": {
    "consultancyId": "uuid",
    "ownerUserId": "uuid",
    "slug": "acme-consultancy"
  },
  "requestId": "uuid"
}
```

- Errors: `VALIDATION_ERROR`

### GET `/consultancies/me`

- Auth: Yes
- Headers: `Authorization`, `X-Consultancy-Slug`
- Permission: `consultancy.read`
- Response `200`: consultancy profile
- Errors: `UNAUTHORIZED`, `FORBIDDEN`, `CONSULTANCY_NOT_FOUND`

---

## Auth + OTP Module

### POST `/auth/request-otp`

- Auth: No (or optional)
- Headers (optional): `X-Consultancy-Slug`
- Body:

```json
{
  "consultancySlug": "acme-consultancy",
  "destination": "owner@acme.com",
  "channel": "EMAIL",
  "purpose": "VERIFY_EMAIL"
}
```

- Notes:
  - `consultancySlug` is optional.
  - If omitted, backend tries to infer consultancy from destination.
  - If destination exists in multiple consultancies, backend returns `CONSULTANCY_CONTEXT_REQUIRED`.
- Response `200`: `{ "success": true, "data": { "success": true, "consultancySlug": "acme-consultancy" } }`
- Errors: `RATE_LIMITED`, `CONSULTANCY_NOT_FOUND`, `VALIDATION_ERROR`

### POST `/auth/verify-otp`

- Auth: No
- Headers (optional): `X-Consultancy-Slug`
- Body:

```json
{
  "consultancySlug": "acme-consultancy",
  "destination": "owner@acme.com",
  "channel": "EMAIL",
  "purpose": "VERIFY_EMAIL",
  "otp": "123456"
}
```

- Response `200`:

```json
{
  "success": true,
  "data": { "verified": true, "consultancySlug": "acme-consultancy" },
  "requestId": "uuid"
}
```

- Errors: `OTP_INVALID`, `OTP_ATTEMPTS_EXCEEDED`, `CONSULTANCY_NOT_FOUND`

### POST `/auth/login`

- Auth: No
- Headers (optional): `X-Consultancy-Slug`
- Body:

```json
{
  "email": "owner@acme.com",
  "password": "StrongP@ss123",
  "deviceId": "browser-01"
}
```

- Notes:
  - `consultancySlug` is optional for login.
  - If the same email exists in multiple consultancies, pass `consultancySlug`.
- Response `200`:

```json
{
  "success": true,
  "data": {
    "accessToken": "jwt",
    "refreshToken": "jwt",
    "consultancySlug": "acme-consultancy",
    "user": {
      "id": "uuid",
      "name": "Owner Name",
      "email": "owner@acme.com",
      "status": "ACTIVE",
      "roles": [{ "id": "uuid", "key": "SUPER_ADMIN", "name": "Super Admin" }],
      "permissions": ["*"]
    }
  },
  "requestId": "uuid"
}
```

- Errors: `INVALID_CREDENTIALS`, `EMAIL_NOT_VERIFIED`, `USER_INACTIVE`, `RATE_LIMITED`, `CONSULTANCY_CONTEXT_REQUIRED`

### POST `/auth/refresh`

- Body: `{ "refreshToken": "jwt" }`
- Response `200`: new access + rotated refresh token + `consultancySlug`
- Errors: `INVALID_REFRESH`

### POST `/auth/logout`

- Body: `{ "refreshToken": "jwt" }`
- Response `200`: `{ "success": true }`

### POST `/auth/forgot-password/request`

- Headers (optional): `X-Consultancy-Slug`
- Body:

```json
{ "consultancySlug": "acme-consultancy", "email": "user@acme.com" }
```

- Response `200`: generic success

### POST `/auth/forgot-password/confirm`

- Headers (optional): `X-Consultancy-Slug`
- Body:

```json
{
  "consultancySlug": "acme-consultancy",
  "email": "user@acme.com",
  "otp": "123456",
  "newPassword": "NewStrongP@ss123"
}
```

- Response `200`: generic success

---

## Marketing Module (Super Admin Only)

### POST `/marketing/email`

- Auth: Yes
- Headers: `Authorization`, `X-Consultancy-Slug`
- Access: `SUPER_ADMIN` role required
- Body:

```json
{
  "subject": "Spring Offer",
  "message": "Apply before deadline and get counseling discount.",
  "recipients": ["lead1@example.com", "lead2@example.com"],
  "includeUsers": false,
  "includeStudents": true,
  "includeLeads": true
}
```

- Notes:
  - `recipients` is optional.
  - If include flags are true, recipients are collected from tenant directory and deduplicated.
  - Max 1000 recipients per request.
- Response `200`:

```json
{
  "success": true,
  "data": {
    "subject": "Spring Offer",
    "totalRecipients": 120,
    "sent": 117,
    "failed": 3,
    "failures": [{ "destination": "x@example.com", "error": "..." }]
  },
  "requestId": "uuid"
}
```

### POST `/marketing/sms`

- Auth: Yes
- Headers: `Authorization`, `X-Consultancy-Slug`
- Access: `SUPER_ADMIN` role required
- Body:

```json
{
  "message": "New intake open now. Contact us today.",
  "recipients": ["+97798XXXXXXXX"],
  "includeUsers": false,
  "includeStudents": true,
  "includeLeads": true
}
```

- Response `200`: `{ totalRecipients, sent, failed, failures[] }`

---

## Users + Invitations + RBAC Module

### POST `/users/invite`

- Auth: Yes
- Headers: `Authorization`, `X-Consultancy-Slug`
- Permission: `user.create`
- Body:

```json
{
  "email": "staff@acme.com",
  "phone": "+97798XXXXXXXX",
  "roleKeys": ["COUNSELOR"]
}
```

- Response `201`: `{ "invitationId": "uuid" }`
- Errors: `INVALID_ROLE_KEYS`, `INVALID_INVITATION`

### POST `/invitations/accept`

- Auth: No
- Body:

```json
{
  "consultancySlug": "acme-consultancy",
  "token": "invite-token",
  "name": "Staff",
  "password": "StrongP@ss123"
}
```

- Response `201`: `{ "userId": "uuid" }`
- Errors: `INVITATION_INVALID`, `USER_EXISTS`, `CONSULTANCY_NOT_FOUND`

### GET `/users`

- Permission: `user.read`
- Response: users with roles and verification flags

### PATCH `/users/:id`

- Permission: `user.update`
- Body (partial): `{ "name": "Updated", "phone": "+977...", "status": "SUSPENDED" }`

### POST `/users/:id/roles`

- Permission: `role.assign`
- Body: `{ "roleKeys": ["VISA_OFFICER", "DOCUMENTATION_OFFICER"] }`

### POST `/roles`

- Permission: `role.create`
- Body: `{ "key": "CUSTOM_ROLE", "name": "Custom Role" }`

### GET `/roles`

- Permission: `role.read`

### PATCH `/roles/:id`

- Permission: `role.update`

### POST `/roles/:id/permissions`

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

---

## Leads Module

### POST `/leads`

- Permission: `lead.create`
- Body: `{ "fullName": "Lead Name", "email": "lead@mail.com", "phone": "+977...", "source": "facebook" }`

### GET `/leads`

- Permission: `lead.read`
- Query: `stage`, `assignedTo`, `search`, `page`, `limit`

### PATCH `/leads/:id`

- Permission: `lead.update`

### POST `/leads/:id/activities`

- Permission: `lead.update`
- Body: `{ "type": "CALL", "note": "Interested" }`

### POST `/leads/:id/convert-to-student`

- Permission: `lead.convert`
- Body: `{ "intake": "Fall 2026", "targetCountry": "Australia" }`
- Response: created `student`, optional `studentCase`

---

## Students + Cases Module

### POST `/students`

- Permission: `student.create`

### GET `/students`

- Permission: `student.read`
- Query: `search`, `page`, `limit`

### GET `/students/:id`

- Permission: `student.read`

### PATCH `/students/:id`

- Permission: `student.update`

### GET `/students/:id/profile`

- Permission: `student.read`
- Description: returns full student profile including assignment, cases, education records, and test scores.

### PUT `/students/:id/profile`

- Permission: `student.update`
- Description: upserts detailed profile in one call. If `educationRecords` or `testScores` is provided, that list is replaced.
- Body (all fields optional):

```json
{
  "fullName": "John Student",
  "dob": "2002-01-15",
  "gender": "Male",
  "email": "john@student.com",
  "phone": "+97798XXXXXXXX",
  "address": "Kathmandu",
  "passportNo": "P1234567",
  "passportExpiry": "2030-05-01",
  "nationality": "Nepali",
  "status": "ACTIVE",
  "educationRecords": [
    {
      "level": "HIGH_SCHOOL",
      "institution": "ABC Higher Secondary School",
      "board": "NEB",
      "score": "3.65 GPA",
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

### PATCH `/students/:id/assignment`

- Permission: `student.update`
- Body:

```json
{ "counselorId": "uuid", "docOfficerId": "uuid", "visaOfficerId": "uuid" }
```

### GET `/students/:id/education-records`

- Permission: `student.read`

### POST `/students/:id/education-records`

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

### PATCH `/students/:id/education-records/:educationRecordId`

- Permission: `student.update`
- Body: partial `level`, `institution`, `board`, `score`, `year`

### DELETE `/students/:id/education-records/:educationRecordId`

- Permission: `student.update`

### GET `/students/:id/test-scores`

- Permission: `student.read`

### POST `/students/:id/test-scores`

- Permission: `student.update`
- Body:

```json
{
  "testName": "PTE",
  "score": "64",
  "testDate": "2026-02-01"
}
```

### PATCH `/students/:id/test-scores/:testScoreId`

- Permission: `student.update`
- Body: partial `testName`, `score`, `testDate`

### DELETE `/students/:id/test-scores/:testScoreId`

- Permission: `student.update`

### POST `/students/:id/cases`

- Permission: `case.create`
- Body:

```json
{ "intake": "Fall 2026", "targetCountry": "Canada", "status": "ACTIVE" }
```

### PATCH `/cases/:id`

- Permission: `case.update`
- Body: partial `intake`, `targetCountry`, `status`

---

## Document Requests + Versioning Module

### POST `/students/:studentId/document-requests`

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

### GET `/students/:studentId/document-requests`

- Permission: `doc.request.read`

### PATCH `/document-requests/:id`

- Permission: `doc.request.update`

### POST `/document-requests/:id/cancel`

- Permission: `doc.request.cancel`

### POST `/documents/:versionId/verify`

- Permission: `doc.verify` (for `VERIFIED`) or `doc.reject` (for `REJECTED`)
- Body:

```json
{ "status": "VERIFIED", "reason": "optional" }
```

- Behavior: auto-fulfills linked request when verified

---

## Storage Module (Signed URL)

### POST `/storage/sign-upload`

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

- Response:

```json
{
  "success": true,
  "data": {
    "documentVersionId": "uuid",
    "bucket": "consultease",
    "objectKey": "{consultancyId}/students/{studentId}/documents/{documentTypeKey}/{documentVersionId}/passport.pdf",
    "uploadUrl": "https://...",
    "expiresInSeconds": 1200
  },
  "requestId": "uuid"
}
```

### POST `/documents/confirm-upload`

- Permission: `doc.upload`
- Body: `{ "documentVersionId": "uuid" }`
- Behavior: HEAD object check required before activation

### POST `/storage/sign-download`

- Permissions: `storage.sign.download`, `doc.read`
- Body: `{ "documentVersionId": "uuid", "expiresInSeconds": 1200 }`
- Response: signed GET URL

### POST `/storage/sign-upload/user-profile`

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

### POST `/storage/confirm-upload/user-profile`

- Permission: `user.update`
- Body:

```json
{
  "userId": "uuid",
  "objectKey": "{consultancyId}/users/{userId}/profile/{uuid}-avatar.png",
  "mimeType": "image/png"
}
```

### POST `/storage/sign-download/user-profile`

- Permissions: `storage.sign.download`, `user.read`
- Body: `{ "userId": "uuid", "expiresInSeconds": 1200 }`

### POST `/storage/sign-upload/student-profile`

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

### POST `/storage/confirm-upload/student-profile`

- Permission: `student.update`
- Body:

```json
{
  "studentId": "uuid",
  "objectKey": "{consultancyId}/students/{studentId}/profile/{uuid}-student-photo.jpg",
  "mimeType": "image/jpeg"
}
```

### POST `/storage/sign-download/student-profile`

- Permissions: `storage.sign.download`, `student.read`
- Body: `{ "studentId": "uuid", "expiresInSeconds": 1200 }`

---

## Dashboard Module

### GET `/students/:studentId/dashboard`

- Permission: `student.read`
- Response:

```json
{
  "success": true,
  "data": {
    "student": { "id": "uuid", "fullName": "...", "status": "ACTIVE" },
    "cases": [],
    "documentRequests": {
      "open": [],
      "recentlyFulfilled": []
    },
    "documentsByType": [
      {
        "documentTypeKey": "passport",
        "latestVersion": { "id": "uuid", "versionNumber": 3 },
        "verificationStatus": "PENDING",
        "lastUpdatedAt": "2026-02-24T10:00:00.000Z"
      }
    ]
  },
  "requestId": "uuid"
}
```

---

## Audit Module

### GET `/audit`

- Permission: `audit.read`
- Query: `actorUserId`, `action`, `from`, `to`, `page`, `limit`
- Response: paginated audit events

---

## File Upload/Download Rules

- Bucket: `consultease`
- Object keys are server-generated only.
- Implemented pattern for documents:
  - `{consultancyId}/students/{studentId}/documents/{documentTypeKey}/{documentVersionId}/{safeFileName}`
- Implemented pattern for user profile image:
  - `{consultancyId}/users/{userId}/profile/{uuid}-{safeFileName}`
- Implemented pattern for student profile image:
  - `{consultancyId}/students/{studentId}/profile/{uuid}-{safeFileName}`
- Signed URL expiry defaults to 1200 seconds and can be overridden per request up to 3600 seconds.
- Allowed MIME types: `application/pdf`, `image/jpeg`, `image/jpg`, `image/png`
- Allowed profile image MIME types: `image/jpeg`, `image/jpg`, `image/png`, `image/webp`

---

## Auth Notes For Frontend

- Login is blocked until email verification is complete.
- Refresh token rotation: frontend must replace stored refresh token after every `/auth/refresh`.
- Include `X-Consultancy-Slug` on all consultancy-protected routes.

---

## Typical End-to-End Flow

1. Register consultancy via `/consultancies/register`
2. Verify owner OTP via `/auth/verify-otp`
3. Login via `/auth/login`
4. Invite users via `/users/invite`
5. Accept invitation via `/invitations/accept`
6. Create leads and convert via `/leads/:id/convert-to-student`
7. Create document requests via `/students/:id/document-requests`
8. Sign upload URL via `/storage/sign-upload`
9. Confirm upload via `/documents/confirm-upload`
10. Verify/reject document via `/documents/:versionId/verify`
11. Read consolidated state via `/students/:id/dashboard`

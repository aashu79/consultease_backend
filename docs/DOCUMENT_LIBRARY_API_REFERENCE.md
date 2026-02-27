# Document Library API Reference (v1)

## Base URL

`{{API_BASE_URL}}/v1`

## Purpose

These endpoints return all documents for a student in an organized format (grouped by `documentTypeKey`) with:

- `viewUrl` (signed link, 1 hour expiry)
- `downloadUrl` (signed link, default storage expiry)

## Auth Headers

- `Authorization: Bearer <accessToken>`
- `X-Consultancy-Slug: <slug>` (or `X-Tenant-Slug`)

## 1) Consultancy/Staff Route

### GET `/students/:studentId/documents`

- Auth: Yes
- Permission: `doc.read`
- Use case: staff opens a student profile and views full document library.

## 2) Student Portal Route

### GET `/students/me/documents`

- Auth: Yes (student portal account)
- Permission: no staff RBAC check; ownership resolved from logged-in portal user.
- Use case: student views their own full document library.

## Response Shape

```json
{
  "success": true,
  "data": {
    "student": {
      "id": "uuid",
      "fullName": "Aashu Sah",
      "email": "student@example.com",
      "phone": "98xxxxxxxx"
    },
    "linkExpiry": {
      "viewUrlExpiresInSeconds": 3600,
      "downloadUrlExpiresInSeconds": 600
    },
    "documents": [
      {
        "documentTypeKey": "PASSPORT",
        "documentFileId": "uuid",
        "currentVersionId": "uuid",
        "createdAt": "2026-02-27T00:00:00.000Z",
        "updatedAt": "2026-02-27T00:00:00.000Z",
        "versions": [
          {
            "id": "uuid",
            "versionNumber": 2,
            "fileName": "passport.pdf",
            "mimeType": "application/pdf",
            "sizeBytes": "123456",
            "uploadState": "CONFIRMED",
            "createdAt": "2026-02-27T00:00:00.000Z",
            "isCurrent": true,
            "request": {
              "id": "uuid",
              "title": "Passport copy",
              "status": "OPEN",
              "dueAt": "2026-03-10T00:00:00.000Z"
            },
            "verification": {
              "id": "uuid",
              "status": "PENDING",
              "reason": null,
              "createdAt": "2026-02-27T00:00:00.000Z"
            },
            "viewUrl": "https://...",
            "downloadUrl": "https://..."
          }
        ]
      }
    ]
  },
  "requestId": "uuid"
}
```

## Notes

- Links are returned only for versions with `uploadState = CONFIRMED`.
- `sizeBytes` is serialized as a string.
- `viewUrl` and `downloadUrl` are both signed object links; they differ by expiry policy.

## Common Errors

- `UNAUTHORIZED`
- `FORBIDDEN`
- `STUDENT_NOT_FOUND`
- `STUDENT_PORTAL_PROFILE_NOT_FOUND`
- `INTERNAL_SERVER_ERROR`

-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "profileImageMimeType" TEXT,
ADD COLUMN     "profileImageObjectKey" TEXT,
ADD COLUMN     "profileImageSizeBytes" BIGINT,
ADD COLUMN     "profileImageUpdatedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "profileImageMimeType" TEXT,
ADD COLUMN     "profileImageObjectKey" TEXT,
ADD COLUMN     "profileImageSizeBytes" BIGINT,
ADD COLUMN     "profileImageUpdatedAt" TIMESTAMP(3);

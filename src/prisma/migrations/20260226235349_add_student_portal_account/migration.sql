-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "portalUserId" UUID;

-- CreateIndex
CREATE UNIQUE INDEX "Student_portalUserId_key" ON "Student"("portalUserId");

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_portalUserId_fkey" FOREIGN KEY ("portalUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
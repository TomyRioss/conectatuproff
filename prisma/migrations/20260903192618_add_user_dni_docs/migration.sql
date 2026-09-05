-- CreateEnum
CREATE TYPE "DniStatus" AS ENUM ('NONE', 'PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "dniPhotoBack" TEXT,
ADD COLUMN     "dniPhotoFront" TEXT,
ADD COLUMN     "dniStatus" "DniStatus" NOT NULL DEFAULT 'NONE',
ADD COLUMN     "dniSubmittedAt" TIMESTAMP(3);

-- CreateEnum
CREATE TYPE "UserLanguage" AS ENUM ('EN', 'DE');

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "language" "UserLanguage" NOT NULL DEFAULT 'EN';

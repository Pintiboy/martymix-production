/*
  Warnings:

  - The `language` column on the `user` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "Language" AS ENUM ('EN', 'DE');

-- CreateEnum
CREATE TYPE "ContestType" AS ENUM ('MARTYMIX', 'PINTYMIX');

-- AlterTable
ALTER TABLE "Contest" ADD COLUMN     "type" "ContestType" NOT NULL DEFAULT 'MARTYMIX';

-- AlterTable
ALTER TABLE "user" DROP COLUMN "language",
ADD COLUMN     "language" "Language" NOT NULL DEFAULT 'EN';

-- DropEnum
DROP TYPE "UserLanguage";

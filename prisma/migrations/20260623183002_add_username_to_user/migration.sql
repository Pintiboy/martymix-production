/*
  Warnings:

  - A unique constraint covering the columns `[userName]` on the table `user` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'USER',
ADD COLUMN     "userName" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "user_userName_key" ON "user"("userName");

/*
  Warnings:

  - You are about to drop the column `userName` on the `user` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[username]` on the table `user` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "user_userName_key";

-- AlterTable
ALTER TABLE "user" DROP COLUMN "userName",
ADD COLUMN     "username" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "user_username_key" ON "user"("username");

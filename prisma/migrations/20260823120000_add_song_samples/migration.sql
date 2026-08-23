-- CreateEnum
CREATE TYPE "SongSampleProvider" AS ENUM ('APPLE_MUSIC');

-- AlterTable
ALTER TABLE "Song"
ADD COLUMN "sampleProvider" "SongSampleProvider",
ADD COLUMN "sampleTrackId" TEXT,
ADD COLUMN "sampleStorefront" TEXT,
ADD COLUMN "samplePreviewUrl" TEXT,
ADD COLUMN "sampleExternalUrl" TEXT,
ADD COLUMN "sampleResolvedAt" TIMESTAMP(3);

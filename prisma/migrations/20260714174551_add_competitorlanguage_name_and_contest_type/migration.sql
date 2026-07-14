-- AlterTable
ALTER TABLE "Competitor" ADD COLUMN     "preferredLanguage" "Language" NOT NULL DEFAULT 'EN',
ADD COLUMN     "preferredName" TEXT;

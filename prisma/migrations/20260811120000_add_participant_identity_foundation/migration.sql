-- This migration is intentionally additive. Existing contest, participation,
-- song, vote, and Better Auth identifiers are not modified.

CREATE TABLE "OrganizerProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "publicName" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "OrganizerProfile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ParticipantProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "displayName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ParticipantProfile_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Competitor"
ADD COLUMN "normalizedEmail" TEXT,
ADD COLUMN "participantProfileId" TEXT,
ADD COLUMN "avatarHiddenAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "OrganizerProfile_userId_key" ON "OrganizerProfile"("userId");
CREATE UNIQUE INDEX "ParticipantProfile_userId_key" ON "ParticipantProfile"("userId");
CREATE INDEX "Competitor_normalizedEmail_idx" ON "Competitor"("normalizedEmail");
CREATE INDEX "Competitor_participantProfileId_idx" ON "Competitor"("participantProfileId");

ALTER TABLE "OrganizerProfile"
ADD CONSTRAINT "OrganizerProfile_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ParticipantProfile"
ADD CONSTRAINT "ParticipantProfile_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Competitor"
ADD CONSTRAINT "Competitor_participantProfileId_fkey"
FOREIGN KEY ("participantProfileId") REFERENCES "ParticipantProfile"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

-- Every pre-existing Better Auth user is an organizer. IDs are copied from the
-- user row so this backfill is deterministic and safe to re-run manually.
INSERT INTO "OrganizerProfile" (
    "id", "userId", "publicName", "isActive", "createdAt", "updatedAt"
)
SELECT
    "id",
    "id",
    COALESCE(NULLIF(BTRIM("displayUsername"), ''), NULLIF(BTRIM("name"), ''), "email"),
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "user"
ON CONFLICT ("userId") DO NOTHING;

UPDATE "Competitor"
SET "normalizedEmail" = LOWER(BTRIM("email"))
WHERE "email" IS NOT NULL AND BTRIM("email") <> '';

CREATE UNIQUE INDEX "Competitor_ownerId_normalizedEmail_key"
ON "Competitor"("ownerId", "normalizedEmail");

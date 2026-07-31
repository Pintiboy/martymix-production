-- Add the language-neutral columns first so existing email copy can be preserved.
ALTER TABLE "Contest"
ADD COLUMN "submissionEmailText" TEXT,
ADD COLUMN "votingEmailText" TEXT;

-- If both language fields contain text, retain both and separate them with a Markdown rule.
UPDATE "Contest"
SET
  "submissionEmailText" = NULLIF(
    CONCAT_WS(
      E'\n\n---\n\n',
      NULLIF(BTRIM("submissionEmailTextEn"), ''),
      NULLIF(BTRIM("submissionEmailTextDe"), '')
    ),
    ''
  ),
  "votingEmailText" = NULLIF(
    CONCAT_WS(
      E'\n\n---\n\n',
      NULLIF(BTRIM("votingEmailTextEn"), ''),
      NULLIF(BTRIM("votingEmailTextDe"), '')
    ),
    ''
  );

ALTER TABLE "Contest"
DROP COLUMN "submissionEmailTextEn",
DROP COLUMN "submissionEmailTextDe",
DROP COLUMN "votingEmailTextEn",
DROP COLUMN "votingEmailTextDe";

ALTER TABLE "Agent" DROP COLUMN IF EXISTS "searchVector";

ALTER TABLE "Agent"
ADD COLUMN "searchVector" tsvector
GENERATED ALWAYS AS (
  to_tsvector(
    'english',
    coalesce("name", '') || ' ' ||
    coalesce("description", '') || ' ' ||
    coalesce("readmeText", '')
  )
) STORED;

CREATE INDEX IF NOT EXISTS "Agent_searchVector_idx" ON "Agent" USING GIN ("searchVector");

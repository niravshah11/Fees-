-- ProgrammeStage no longer stores a default YoY increment %. The rate is a fresh decision every
-- year, made per grade band when a Finance Officer builds that year's draft (FeeLine.incrementPct),
-- not a stored master-data default. See schema.prisma's ProgrammeStage doc comment.
ALTER TABLE "ProgrammeStage" DROP COLUMN "defaultIncrementPct";

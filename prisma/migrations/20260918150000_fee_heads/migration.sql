-- FeeHead: campus-specific, extensible fee categories (Tuition Fee, Admission Fee, Term Fee,
-- and any campus-specific extras like FSK's Beyond Mandatory Fee).
CREATE TABLE "FeeHead" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeeHead_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "FeeHead_schoolId_idx" ON "FeeHead"("schoolId");

ALTER TABLE "FeeHead" ADD CONSTRAINT "FeeHead_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- FeeLine's grain changes from (version x gradeBand) to (version x gradeBand x feeHead) — demo
-- data only at this stage, so the existing table is dropped and recreated rather than migrated
-- column-by-column. termFee/admissionFee/totalFee are gone: those single fixed columns are
-- replaced by however many FeeHead rows a school actually has, each getting its own FeeLine.
DROP TABLE "FeeLine";

CREATE TABLE "FeeLine" (
    "id" TEXT NOT NULL,
    "feeVersionId" TEXT NOT NULL,
    "gradeBandId" TEXT NOT NULL,
    "feeHeadId" TEXT NOT NULL,
    "baseFee" INTEGER NOT NULL,
    "incrementPct" DECIMAL(6,4) NOT NULL,
    "amount" INTEGER NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeeLine_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "FeeLine_feeVersionId_gradeBandId_feeHeadId_key" ON "FeeLine"("feeVersionId", "gradeBandId", "feeHeadId");
CREATE INDEX "FeeLine_feeVersionId_idx" ON "FeeLine"("feeVersionId");
CREATE INDEX "FeeLine_gradeBandId_idx" ON "FeeLine"("gradeBandId");
CREATE INDEX "FeeLine_feeHeadId_idx" ON "FeeLine"("feeHeadId");

ALTER TABLE "FeeLine" ADD CONSTRAINT "FeeLine_feeVersionId_fkey" FOREIGN KEY ("feeVersionId") REFERENCES "FeeVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FeeLine" ADD CONSTRAINT "FeeLine_gradeBandId_fkey" FOREIGN KEY ("gradeBandId") REFERENCES "GradeBand"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FeeLine" ADD CONSTRAINT "FeeLine_feeHeadId_fkey" FOREIGN KEY ("feeHeadId") REFERENCES "FeeHead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

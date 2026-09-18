-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "School" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "board" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "School_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProgrammeStage" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "defaultIncrementPct" DECIMAL(6,4) NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProgrammeStage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GradeBand" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "programmeStageId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GradeBand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeeVersion" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "academicYear" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdBy" TEXT,
    "submittedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeeVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeeLine" (
    "id" TEXT NOT NULL,
    "feeVersionId" TEXT NOT NULL,
    "gradeBandId" TEXT NOT NULL,
    "baseFee" INTEGER NOT NULL,
    "incrementPct" DECIMAL(6,4) NOT NULL,
    "tuitionFee" INTEGER NOT NULL,
    "termFee" INTEGER NOT NULL DEFAULT 0,
    "admissionFee" INTEGER NOT NULL DEFAULT 0,
    "totalFee" INTEGER NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeeLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeeApproval" (
    "id" TEXT NOT NULL,
    "feeVersionId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "decidedBy" TEXT,
    "decidedAt" TIMESTAMP(3),
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeeApproval_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppUser" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppUserRight" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "campus" TEXT,
    "grantedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AppUserRight_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "School_code_key" ON "School"("code");

-- CreateIndex
CREATE INDEX "ProgrammeStage_schoolId_idx" ON "ProgrammeStage"("schoolId");

-- CreateIndex
CREATE INDEX "GradeBand_schoolId_idx" ON "GradeBand"("schoolId");

-- CreateIndex
CREATE INDEX "GradeBand_programmeStageId_idx" ON "GradeBand"("programmeStageId");

-- CreateIndex
CREATE INDEX "FeeVersion_schoolId_idx" ON "FeeVersion"("schoolId");

-- CreateIndex
CREATE INDEX "FeeVersion_academicYear_idx" ON "FeeVersion"("academicYear");

-- CreateIndex
CREATE INDEX "FeeVersion_status_idx" ON "FeeVersion"("status");

-- CreateIndex
CREATE INDEX "FeeLine_feeVersionId_idx" ON "FeeLine"("feeVersionId");

-- CreateIndex
CREATE INDEX "FeeLine_gradeBandId_idx" ON "FeeLine"("gradeBandId");

-- CreateIndex
CREATE INDEX "FeeApproval_feeVersionId_idx" ON "FeeApproval"("feeVersionId");

-- CreateIndex
CREATE UNIQUE INDEX "AppUser_email_key" ON "AppUser"("email");

-- CreateIndex
CREATE INDEX "AppUserRight_userId_idx" ON "AppUserRight"("userId");

-- CreateIndex
CREATE INDEX "AppUserRight_campus_idx" ON "AppUserRight"("campus");

-- AddForeignKey
ALTER TABLE "ProgrammeStage" ADD CONSTRAINT "ProgrammeStage_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GradeBand" ADD CONSTRAINT "GradeBand_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GradeBand" ADD CONSTRAINT "GradeBand_programmeStageId_fkey" FOREIGN KEY ("programmeStageId") REFERENCES "ProgrammeStage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeVersion" ADD CONSTRAINT "FeeVersion_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeLine" ADD CONSTRAINT "FeeLine_feeVersionId_fkey" FOREIGN KEY ("feeVersionId") REFERENCES "FeeVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeLine" ADD CONSTRAINT "FeeLine_gradeBandId_fkey" FOREIGN KEY ("gradeBandId") REFERENCES "GradeBand"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeApproval" ADD CONSTRAINT "FeeApproval_feeVersionId_fkey" FOREIGN KEY ("feeVersionId") REFERENCES "FeeVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppUserRight" ADD CONSTRAINT "AppUserRight_userId_fkey" FOREIGN KEY ("userId") REFERENCES "AppUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;


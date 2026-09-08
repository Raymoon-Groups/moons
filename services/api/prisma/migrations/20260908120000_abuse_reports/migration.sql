-- CreateEnum
CREATE TYPE "AbuseReportTarget" AS ENUM ('COMMENT', 'POST', 'USER', 'JOB', 'MESSAGE');

-- CreateEnum
CREATE TYPE "AbuseReportStatus" AS ENUM ('OPEN', 'REVIEWED', 'DISMISSED', 'ACTIONED');

-- CreateTable
CREATE TABLE "abuse_reports" (
    "id" TEXT NOT NULL,
    "reporter_id" TEXT NOT NULL,
    "target_type" "AbuseReportTarget" NOT NULL,
    "target_id" TEXT NOT NULL,
    "reason" TEXT,
    "details" TEXT,
    "status" "AbuseReportStatus" NOT NULL DEFAULT 'OPEN',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "abuse_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "abuse_reports_status_created_at_idx" ON "abuse_reports"("status", "created_at");

-- CreateIndex
CREATE INDEX "abuse_reports_target_type_target_id_idx" ON "abuse_reports"("target_type", "target_id");

-- CreateIndex
CREATE UNIQUE INDEX "abuse_reports_reporter_id_target_type_target_id_key" ON "abuse_reports"("reporter_id", "target_type", "target_id");

-- AddForeignKey
ALTER TABLE "abuse_reports" ADD CONSTRAINT "abuse_reports_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

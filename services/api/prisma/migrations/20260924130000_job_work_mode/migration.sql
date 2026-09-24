-- AlterEnum
ALTER TYPE "WorkMode" ADD VALUE 'WORK_FROM_HOME';

-- AlterTable
ALTER TABLE "jobs" ADD COLUMN "work_mode" "WorkMode" NOT NULL DEFAULT 'ONSITE';

-- AlterTable
ALTER TABLE "jobs" ADD COLUMN "screening_questions" JSONB NOT NULL DEFAULT '[]';

-- AlterTable
ALTER TABLE "applications" ADD COLUMN "screening_answers" JSONB NOT NULL DEFAULT '[]';

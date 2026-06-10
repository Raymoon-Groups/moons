-- AlterTable
ALTER TABLE "users" ADD COLUMN "email_verified" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "users" ADD COLUMN "onboarding_completed" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "profiles" ADD COLUMN "designation" TEXT;
ALTER TABLE "profiles" ADD COLUMN "company_website" TEXT;
ALTER TABLE "profiles" ADD COLUMN "company_size" TEXT;
ALTER TABLE "profiles" ADD COLUMN "resume_url" TEXT;

-- Mark existing demo/seed users as verified and onboarded
UPDATE "users" SET "email_verified" = true, "onboarding_completed" = true;

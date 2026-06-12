-- AlterTable
ALTER TABLE "profiles" ADD COLUMN "current_ctc" TEXT;
ALTER TABLE "profiles" ADD COLUMN "expected_ctc" TEXT;
ALTER TABLE "profiles" ADD COLUMN "industry" TEXT;
ALTER TABLE "profiles" ADD COLUMN "company_type" TEXT;
ALTER TABLE "profiles" ADD COLUMN "company_logo_url" TEXT;
ALTER TABLE "profiles" ADD COLUMN "office_address" TEXT;
ALTER TABLE "profiles" ADD COLUMN "educations" JSONB NOT NULL DEFAULT '[]';
ALTER TABLE "profiles" ADD COLUMN "work_experiences" JSONB NOT NULL DEFAULT '[]';
ALTER TABLE "profiles" ADD COLUMN "certifications" JSONB NOT NULL DEFAULT '[]';
ALTER TABLE "profiles" ADD COLUMN "preferred_roles" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "profiles" ADD COLUMN "preferred_locations" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "profiles" ADD COLUMN "preferred_industries" TEXT[] DEFAULT ARRAY[]::TEXT[];

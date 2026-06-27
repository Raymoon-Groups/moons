-- CreateEnum
CREATE TYPE "ConnectionStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ProfileVisibility" AS ENUM ('PUBLIC', 'CONNECTIONS_ONLY', 'PRIVATE');

-- CreateEnum
CREATE TYPE "WorkMode" AS ENUM ('REMOTE', 'HYBRID', 'ONSITE');

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'CONNECTION_REQUEST';
ALTER TYPE "NotificationType" ADD VALUE 'CONNECTION_ACCEPTED';
ALTER TYPE "NotificationType" ADD VALUE 'PROFILE_VIEW';
ALTER TYPE "NotificationType" ADD VALUE 'NETWORK_SUGGESTION';

-- AlterTable
ALTER TABLE "profiles" ADD COLUMN "banner_url" TEXT,
ADD COLUMN "github_url" TEXT,
ADD COLUMN "linkedin_url" TEXT,
ADD COLUMN "personal_website_url" TEXT,
ADD COLUMN "portfolio_url" TEXT,
ADD COLUMN "projects" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN "achievements" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN "career_goals" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "professional_interests" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "ats_score" INTEGER,
ADD COLUMN "open_to_work" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "is_hiring" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "work_mode" "WorkMode",
ADD COLUMN "profile_visibility" "ProfileVisibility" NOT NULL DEFAULT 'PUBLIC',
ADD COLUMN "hide_email" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "hide_phone" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "hide_resume" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "allow_profile_visitors" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "connections" (
    "id" TEXT NOT NULL,
    "from_user_id" TEXT NOT NULL,
    "to_user_id" TEXT NOT NULL,
    "status" "ConnectionStatus" NOT NULL DEFAULT 'PENDING',
    "message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "responded_at" TIMESTAMP(3),

    CONSTRAINT "connections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_blocks" (
    "id" TEXT NOT NULL,
    "blocker_id" TEXT NOT NULL,
    "blocked_id" TEXT NOT NULL,
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_blocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profile_views" (
    "id" TEXT NOT NULL,
    "viewer_id" TEXT NOT NULL,
    "viewed_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "profile_views_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "connections_from_user_id_to_user_id_key" ON "connections"("from_user_id", "to_user_id");

-- CreateIndex
CREATE INDEX "connections_from_user_id_status_idx" ON "connections"("from_user_id", "status");

-- CreateIndex
CREATE INDEX "connections_to_user_id_status_idx" ON "connections"("to_user_id", "status");

-- CreateIndex
CREATE INDEX "connections_status_updated_at_idx" ON "connections"("status", "updated_at");

-- CreateIndex
CREATE UNIQUE INDEX "user_blocks_blocker_id_blocked_id_key" ON "user_blocks"("blocker_id", "blocked_id");

-- CreateIndex
CREATE INDEX "user_blocks_blocker_id_idx" ON "user_blocks"("blocker_id");

-- CreateIndex
CREATE INDEX "user_blocks_blocked_id_idx" ON "user_blocks"("blocked_id");

-- CreateIndex
CREATE INDEX "profile_views_viewed_id_created_at_idx" ON "profile_views"("viewed_id", "created_at");

-- CreateIndex
CREATE INDEX "profile_views_viewer_id_viewed_id_idx" ON "profile_views"("viewer_id", "viewed_id");

-- AddForeignKey
ALTER TABLE "connections" ADD CONSTRAINT "connections_from_user_id_fkey" FOREIGN KEY ("from_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "connections" ADD CONSTRAINT "connections_to_user_id_fkey" FOREIGN KEY ("to_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_blocks" ADD CONSTRAINT "user_blocks_blocker_id_fkey" FOREIGN KEY ("blocker_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_blocks" ADD CONSTRAINT "user_blocks_blocked_id_fkey" FOREIGN KEY ("blocked_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_views" ADD CONSTRAINT "profile_views_viewer_id_fkey" FOREIGN KEY ("viewer_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_views" ADD CONSTRAINT "profile_views_viewed_id_fkey" FOREIGN KEY ("viewed_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

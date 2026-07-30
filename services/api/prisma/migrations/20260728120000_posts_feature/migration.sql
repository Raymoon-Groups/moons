-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "PostMediaType" AS ENUM ('IMAGE', 'VIDEO');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "posts" (
    "id" TEXT NOT NULL,
    "author_id" TEXT NOT NULL,
    "body" TEXT NOT NULL DEFAULT '',
    "original_post_id" TEXT,
    "like_count" INTEGER NOT NULL DEFAULT 0,
    "comment_count" INTEGER NOT NULL DEFAULT 0,
    "share_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "post_media" (
    "id" TEXT NOT NULL,
    "post_id" TEXT NOT NULL,
    "type" "PostMediaType" NOT NULL,
    "url" TEXT NOT NULL,
    "file_name" TEXT,
    "mime_type" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "post_media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "post_likes" (
    "id" TEXT NOT NULL,
    "post_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "post_likes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "post_comments" (
    "id" TEXT NOT NULL,
    "post_id" TEXT NOT NULL,
    "author_id" TEXT NOT NULL,
    "body" TEXT NOT NULL DEFAULT '',
    "attachment_url" TEXT,
    "attachment_file_name" TEXT,
    "attachment_mime_type" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "post_comments_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE INDEX IF NOT EXISTS "posts_author_id_created_at_idx" ON "posts"("author_id", "created_at");
CREATE INDEX IF NOT EXISTS "posts_created_at_idx" ON "posts"("created_at");
CREATE INDEX IF NOT EXISTS "posts_original_post_id_idx" ON "posts"("original_post_id");
CREATE INDEX IF NOT EXISTS "post_media_post_id_sort_order_idx" ON "post_media"("post_id", "sort_order");
CREATE INDEX IF NOT EXISTS "post_likes_user_id_created_at_idx" ON "post_likes"("user_id", "created_at");
CREATE INDEX IF NOT EXISTS "post_comments_post_id_created_at_idx" ON "post_comments"("post_id", "created_at");
CREATE INDEX IF NOT EXISTS "post_comments_author_id_idx" ON "post_comments"("author_id");

-- Unique
DO $$ BEGIN
  ALTER TABLE "post_likes" ADD CONSTRAINT "post_likes_post_id_user_id_key" UNIQUE ("post_id", "user_id");
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Foreign keys
DO $$ BEGIN
  ALTER TABLE "posts" ADD CONSTRAINT "posts_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "posts" ADD CONSTRAINT "posts_original_post_id_fkey" FOREIGN KEY ("original_post_id") REFERENCES "posts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "post_media" ADD CONSTRAINT "post_media_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "post_likes" ADD CONSTRAINT "post_likes_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "post_likes" ADD CONSTRAINT "post_likes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "post_comments" ADD CONSTRAINT "post_comments_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "post_comments" ADD CONSTRAINT "post_comments_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Comment attachment columns (safe if already present)
ALTER TABLE "post_comments" ADD COLUMN IF NOT EXISTS "attachment_url" TEXT;
ALTER TABLE "post_comments" ADD COLUMN IF NOT EXISTS "attachment_file_name" TEXT;
ALTER TABLE "post_comments" ADD COLUMN IF NOT EXISTS "attachment_mime_type" TEXT;

-- Post notification enum values
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'POST_LIKE';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'POST_COMMENT';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'POST_SHARE';

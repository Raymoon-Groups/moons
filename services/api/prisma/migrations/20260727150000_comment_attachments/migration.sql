-- AlterTable
ALTER TABLE "post_comments" ADD COLUMN IF NOT EXISTS "attachment_url" TEXT;
ALTER TABLE "post_comments" ADD COLUMN IF NOT EXISTS "attachment_file_name" TEXT;
ALTER TABLE "post_comments" ADD COLUMN IF NOT EXISTS "attachment_mime_type" TEXT;

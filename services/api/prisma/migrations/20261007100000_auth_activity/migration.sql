-- CreateEnum
CREATE TYPE "AuthActivityType" AS ENUM ('SIGNUP', 'LOGIN');

-- CreateEnum
CREATE TYPE "AuthActivityMethod" AS ENUM ('PASSWORD', 'GOOGLE');

-- CreateTable
CREATE TABLE "auth_activities" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "type" "AuthActivityType" NOT NULL,
    "method" "AuthActivityMethod" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auth_activities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "auth_activities_type_created_at_idx" ON "auth_activities"("type", "created_at");

-- CreateIndex
CREATE INDEX "auth_activities_created_at_idx" ON "auth_activities"("created_at");

-- CreateIndex
CREATE INDEX "auth_activities_user_id_created_at_idx" ON "auth_activities"("user_id", "created_at");

-- AddForeignKey
ALTER TABLE "auth_activities" ADD CONSTRAINT "auth_activities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "username" TEXT;

-- Backfill: derive the username from the local part of the email, lowercased.
UPDATE "users" SET "username" = lower(split_part("email", '@', 1)) WHERE "username" IS NULL;

-- Make the column required and unique only after the backfill.
ALTER TABLE "users" ALTER COLUMN "username" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

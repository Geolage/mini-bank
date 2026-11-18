-- CreateTable
CREATE TABLE "payees" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "account_number" TEXT NOT NULL,
    "bank_name" TEXT NOT NULL DEFAULT 'MiniBank',
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payees_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "payees_user_id_account_number_key" ON "payees"("user_id", "account_number");

-- CreateIndex
CREATE INDEX "payees_user_id_idx" ON "payees"("user_id");

-- AddForeignKey
ALTER TABLE "payees" ADD CONSTRAINT "payees_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

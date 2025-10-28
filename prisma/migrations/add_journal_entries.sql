-- CreateTable for journal_entries
CREATE TABLE IF NOT EXISTS "journal_entries" (
    "id" BIGSERIAL PRIMARY KEY,
    "transaction_date" DATE NOT NULL,
    "description" TEXT,
    "account_id" INTEGER NOT NULL,
    "debit" DECIMAL(15,2),
    "credit" DECIMAL(15,2),
    "reference_id" UUID,
    "reference_type" VARCHAR(50),
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "journal_entries_account_id_fkey" FOREIGN KEY ("account_id") 
        REFERENCES "ChartOfAccounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "journal_entries_account_id_idx" ON "journal_entries"("account_id");
CREATE INDEX "journal_entries_transaction_date_idx" ON "journal_entries"("transaction_date");
CREATE INDEX "journal_entries_reference_id_idx" ON "journal_entries"("reference_id");

-- Add comment
COMMENT ON TABLE "journal_entries" IS 'Journal entries for recording all financial transactions';
COMMENT ON COLUMN "journal_entries"."debit" IS 'Debit amount - increase in assets/expenses, decrease in liabilities/equity/revenue';
COMMENT ON COLUMN "journal_entries"."credit" IS 'Credit amount - decrease in assets/expenses, increase in liabilities/equity/revenue';
COMMENT ON COLUMN "journal_entries"."reference_id" IS 'UUID reference to source document (invoice, payment, etc)';
COMMENT ON COLUMN "journal_entries"."reference_type" IS 'Type of source document (invoice, payment, adjustment, etc)';

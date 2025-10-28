// Simple script to create invoice table manually
// Run this in your PostgreSQL client or pgAdmin

const createInvoiceTableSQL = `
-- Step 1: Create InvoiceStatus enum if not exists
DO $$ BEGIN
    CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Step 2: Create invoices table
CREATE TABLE IF NOT EXISTS "invoices" (
    "id" TEXT NOT NULL,
    "invoice_number" TEXT NOT NULL,
    "invoice_date" DATE NOT NULL,
    "due_date" DATE NOT NULL,
    "customer_id" TEXT,
    "customer_name" TEXT NOT NULL,
    "customer_address" TEXT,
    "customer_phone" TEXT,
    "customer_email" TEXT,
    "subtotal" DECIMAL(15,2) NOT NULL,
    "tax_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "discount_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "total_amount" DECIMAL(15,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'IDR',
    "status" "InvoiceStatus" NOT NULL DEFAULT 'DRAFT',
    "notes" TEXT,
    "payment_terms" TEXT,
    "created_by" TEXT,
    "updated_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- Step 3: Create unique index
CREATE UNIQUE INDEX IF NOT EXISTS "invoices_invoice_number_key" ON "invoices"("invoice_number");

-- Step 4: Insert sample data
INSERT INTO "invoices" (
    "id", 
    "invoice_number", 
    "invoice_date", 
    "due_date", 
    "customer_name", 
    "subtotal", 
    "tax_amount", 
    "total_amount",
    "status",
    "updated_at"
) VALUES 
(
    gen_random_uuid()::text, 
    'INV-2024-001', 
    '2024-10-01', 
    '2024-10-15', 
    'PT. Example Company', 
    10000000, 
    1100000, 
    11100000,
    'SENT',
    CURRENT_TIMESTAMP
),
(
    gen_random_uuid()::text, 
    'INV-2024-002', 
    '2024-10-10', 
    '2024-10-24', 
    'PT. Sample Indonesia', 
    5000000, 
    550000, 
    5550000,
    'DRAFT',
    CURRENT_TIMESTAMP
)
ON CONFLICT DO NOTHING;
`;

console.log('Copy and paste the following SQL into your PostgreSQL client:\n');
console.log(createInvoiceTableSQL);
console.log('\n✅ After running this SQL, your invoices table will be ready!');

-- CreateEnum
CREATE TYPE "CustomerStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'PROSPECT');

-- CreateTable
CREATE TABLE "customers" (
    "id" TEXT NOT NULL,
    "customer_name" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "status" "CustomerStatus" NOT NULL,
    "top_days" INTEGER NOT NULL,
    "assigned_sales_id" TEXT,
    "credit_limit" DOUBLE PRECISION,
    "no_npwp" TEXT,
    "sppkp" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_contacts" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "position" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "contact_person" TEXT,

    CONSTRAINT "customer_contacts_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "customer_contacts" ADD CONSTRAINT "customer_contacts_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateEnum
CREATE TYPE "MaterialStatus" AS ENUM ('Active', 'EndOfLife', 'Discontinue');

-- CreateEnum
CREATE TYPE "MaterialLocation" AS ENUM ('Local', 'Import');

-- CreateEnum
CREATE TYPE "ServiceUnit" AS ENUM ('Jam', 'Hari');

-- CreateTable
CREATE TABLE "Material" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "sbu" TEXT,
    "system" TEXT,
    "subsystem" TEXT,
    "components" TEXT,
    "item_name" TEXT NOT NULL,
    "brand" TEXT,
    "owner_pn" TEXT,
    "vendor" TEXT,
    "status" "MaterialStatus",
    "location" "MaterialLocation",
    "cost_ori" DECIMAL(14,2),
    "curr" VARCHAR(3),
    "satuan" VARCHAR(50),
    "cost_rp" DECIMAL(14,2),
    "cost_date" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cost_validity" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Material_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Service" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "service_name" TEXT NOT NULL,
    "service_code" TEXT NOT NULL,
    "item_type" TEXT NOT NULL DEFAULT 'Service',
    "category" TEXT,
    "unit" "ServiceUnit" NOT NULL,
    "internal_cost_per_hour" DECIMAL(14,2),
    "freelance_cost_per_hour" DECIMAL(14,2),
    "default_duration" DECIMAL(10,2),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Service_service_code_key" ON "Service"("service_code");

-- CreateTable
CREATE TABLE IF NOT EXISTS "tax_rates" (
    "id" SERIAL NOT NULL,
    "tax_name" TEXT NOT NULL,
    "tax_code" TEXT NOT NULL,
    "rate" DECIMAL(5,2) NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tax_rates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "exchange_rates" (
    "id" SERIAL NOT NULL,
    "currency_from" VARCHAR(3) NOT NULL,
    "currency_to" VARCHAR(3) NOT NULL,
    "rate" DECIMAL(18,6) NOT NULL,
    "effective_date" DATE NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exchange_rates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tax_rates_tax_name_key" ON "tax_rates"("tax_name");

-- CreateIndex
CREATE UNIQUE INDEX "tax_rates_tax_code_key" ON "tax_rates"("tax_code");

-- CreateIndex
CREATE UNIQUE INDEX "exchange_rates_currency_from_currency_to_effective_date_key" ON "exchange_rates"("currency_from", "currency_to", "effective_date");

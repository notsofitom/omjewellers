CREATE TABLE "BillingSettings" (
    "id" TEXT NOT NULL,
    "gstNumber" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BillingSettings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Bill" (
    "id" TEXT NOT NULL,
    "billNumber" TEXT NOT NULL,
    "shareToken" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "gstNumber" TEXT,
    "itemsJson" TEXT NOT NULL,
    "subtotal" DOUBLE PRECISION NOT NULL,
    "cgst" DOUBLE PRECISION NOT NULL,
    "sgst" DOUBLE PRECISION NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Bill_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Bill_billNumber_key" ON "Bill"("billNumber");
CREATE UNIQUE INDEX "Bill_shareToken_key" ON "Bill"("shareToken");

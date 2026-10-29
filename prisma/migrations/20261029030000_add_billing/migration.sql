CREATE TABLE "BillingSettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "gstNumber" TEXT,
    "updatedAt" DATETIME NOT NULL
);

CREATE TABLE "Bill" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "billNumber" TEXT NOT NULL,
    "shareToken" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "gstNumber" TEXT,
    "itemsJson" TEXT NOT NULL,
    "subtotal" REAL NOT NULL,
    "cgst" REAL NOT NULL,
    "sgst" REAL NOT NULL,
    "total" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX "Bill_billNumber_key" ON "Bill"("billNumber");
CREATE UNIQUE INDEX "Bill_shareToken_key" ON "Bill"("shareToken");

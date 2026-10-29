ALTER TABLE "Product" ADD COLUMN "weight" REAL;
ALTER TABLE "Product" ADD COLUMN "carat" INTEGER;
ALTER TABLE "Product" ADD COLUMN "goldRatePerGram" REAL;

CREATE TABLE "CategoryLabourCharge" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "category" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "updatedAt" DATETIME NOT NULL
);

CREATE UNIQUE INDEX "CategoryLabourCharge_category_key" ON "CategoryLabourCharge"("category");

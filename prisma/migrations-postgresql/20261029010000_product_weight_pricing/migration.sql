ALTER TABLE "Product" ADD COLUMN "weight" DOUBLE PRECISION;
ALTER TABLE "Product" ADD COLUMN "carat" INTEGER;
ALTER TABLE "Product" ADD COLUMN "goldRatePerGram" DOUBLE PRECISION;

CREATE TABLE "CategoryLabourCharge" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CategoryLabourCharge_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CategoryLabourCharge_category_key" ON "CategoryLabourCharge"("category");

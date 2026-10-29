CREATE TABLE "ManualMetalRate" (
    "id" TEXT NOT NULL,
    "purity" TEXT NOT NULL,
    "ratePerGram" DOUBLE PRECISION NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ManualMetalRate_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ManualMetalRate_purity_key" ON "ManualMetalRate"("purity");

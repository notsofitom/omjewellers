CREATE TABLE "ManualMetalRate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "purity" TEXT NOT NULL,
    "ratePerGram" REAL NOT NULL,
    "updatedAt" DATETIME NOT NULL
);

CREATE UNIQUE INDEX "ManualMetalRate_purity_key" ON "ManualMetalRate"("purity");

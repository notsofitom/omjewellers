CREATE TABLE "Enquiry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customerName" TEXT NOT NULL,
    "customerEmail" TEXT NOT NULL,
    "customerPhone" TEXT,
    "message" TEXT NOT NULL,
    "productReference" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isRead" BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX "Enquiry_createdAt_idx" ON "Enquiry"("createdAt");

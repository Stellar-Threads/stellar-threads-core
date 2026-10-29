-- Initial schema migration for Stellar Threads Protocol Cache
CREATE TABLE IF NOT EXISTS "DesignerProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "designerAddress" TEXT NOT NULL UNIQUE,
    "brandName" TEXT NOT NULL,
    "specialty" TEXT NOT NULL,
    "tier" TEXT NOT NULL DEFAULT 'Emerging',
    "reputationScore" INTEGER NOT NULL DEFAULT 50,
    "registeredAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "ProductPassport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL UNIQUE,
    "designerId" TEXT NOT NULL,
    "materialsHash" TEXT NOT NULL,
    "batchSize" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Authentic',
    "mintedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("designerId") REFERENCES "DesignerProfile" ("designerAddress") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "EscrowAgreement" (
    "id" INTEGER NOT NULL PRIMARY KEY,
    "buyerAddress" TEXT NOT NULL,
    "sellerAddress" TEXT NOT NULL,
    "amountStroops" TEXT NOT NULL,
    "currentStage" INTEGER NOT NULL DEFAULT 1,
    "isDisputed" BOOLEAN NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "FinancingCampaign" (
    "id" INTEGER NOT NULL PRIMARY KEY,
    "designerAddress" TEXT NOT NULL,
    "targetStroops" TEXT NOT NULL,
    "raisedStroops" TEXT NOT NULL DEFAULT '0',
    "yieldBps" INTEGER NOT NULL,
    "durationDays" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "idx_passports_designer" ON "ProductPassport" ("designerId");
CREATE INDEX IF NOT EXISTS "idx_escrow_stage" ON "EscrowAgreement" ("currentStage");

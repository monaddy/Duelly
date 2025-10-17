-- Enable UUID function
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enums
DO $$ BEGIN
  CREATE TYPE "MatchStatus" AS ENUM ('PENDING','ACTIVE','FINISHED','CANCELED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "Side" AS ENUM ('A','B');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "CubeOwner" AS ENUM ('A','B','CENTER');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Tables
CREATE TABLE IF NOT EXISTS "User" (
  "id"          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  "createdAt"   TIMESTAMPTZ NOT NULL    DEFAULT now(),
  "telegramId"  BIGINT      NOT NULL UNIQUE,
  "username"    TEXT        NULL,
  "firstName"   TEXT        NULL,
  "lastName"    TEXT        NULL
);

CREATE TABLE IF NOT EXISTS "LedgerTx" (
  "id"        UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  "createdAt" TIMESTAMPTZ NOT NULL    DEFAULT now(),
  "type"      TEXT        NOT NULL
);

CREATE TABLE IF NOT EXISTS "Match" (
  "id"          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  "createdAt"   TIMESTAMPTZ   NOT NULL    DEFAULT now(),
  "updatedAt"   TIMESTAMPTZ   NOT NULL    DEFAULT now(),
  "status"      "MatchStatus" NOT NULL    DEFAULT 'PENDING',
  "playerAId"   UUID          NOT NULL,
  "playerBId"   UUID          NOT NULL,
  "turn"        "Side"        NOT NULL    DEFAULT 'A',
  "cubeOwner"   "CubeOwner"   NOT NULL    DEFAULT 'CENTER',
  "cubeValue"   INT           NOT NULL    DEFAULT 1,
  "boardJson"   JSONB         NULL,
  "ledgerTxId"  UUID          NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS "RngCommit" (
  "id"              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  "createdAt"       TIMESTAMPTZ NOT NULL    DEFAULT now(),
  "matchId"         UUID        NOT NULL,
  "serverCommitHex" TEXT        NOT NULL,
  "serverSeedHex"   TEXT        NULL,
  "clientSaltHex"   TEXT        NULL,
  "revealed"        BOOLEAN     NOT NULL    DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS "LedgerEntry" (
  "id"          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  "createdAt"   TIMESTAMPTZ NOT NULL    DEFAULT now(),
  "userId"      UUID        NOT NULL,
  "txId"        UUID        NOT NULL,
  "amountCents" INT         NOT NULL,
  "kind"        TEXT        NOT NULL,
  "ref"         TEXT        NULL,
  "memo"        TEXT        NULL
);

CREATE TABLE IF NOT EXISTS "WebhookEvent" (
  "id"        UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  "createdAt" TIMESTAMPTZ NOT NULL    DEFAULT now(),
  "provider"  TEXT        NOT NULL,
  "eventType" TEXT        NOT NULL,
  "rawJson"   JSONB       NOT NULL,
  "handled"   BOOLEAN     NOT NULL    DEFAULT FALSE,
  "dedupeKey" TEXT        NOT NULL UNIQUE
);

-- FKs (Prisma defaults: ON UPDATE CASCADE; optional relation → ON DELETE SET NULL; required → RESTRICT)
ALTER TABLE "Match"
  ADD CONSTRAINT "Match_playerAId_fkey"
    FOREIGN KEY ("playerAId") REFERENCES "User"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Match"
  ADD CONSTRAINT "Match_playerBId_fkey"
    FOREIGN KEY ("playerBId") REFERENCES "User"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Match"
  ADD CONSTRAINT "Match_ledgerTxId_fkey"
    FOREIGN KEY ("ledgerTxId") REFERENCES "LedgerTx"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "RngCommit"
  ADD CONSTRAINT "RngCommit_matchId_fkey"
    FOREIGN KEY ("matchId") REFERENCES "Match"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "LedgerEntry"
  ADD CONSTRAINT "LedgerEntry_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "LedgerEntry"
  ADD CONSTRAINT "LedgerEntry_txId_fkey"
    FOREIGN KEY ("txId") REFERENCES "LedgerTx"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- Helpful indexes
CREATE INDEX IF NOT EXISTS "Match_playerA_idx"   ON "Match"("playerAId");
CREATE INDEX IF NOT EXISTS "Match_playerB_idx"   ON "Match"("playerBId");
CREATE INDEX IF NOT EXISTS "Match_ledgerTx_idx"  ON "Match"("ledgerTxId");
CREATE INDEX IF NOT EXISTS "RngCommit_match_idx" ON "RngCommit"("matchId");
CREATE INDEX IF NOT EXISTS "LedgerEntry_user_idx"ON "LedgerEntry"("userId");
CREATE INDEX IF NOT EXISTS "LedgerEntry_tx_idx"  ON "LedgerEntry"("txId");
CREATE INDEX IF NOT EXISTS "WebhookEvent_handled_idx" ON "WebhookEvent"("handled");

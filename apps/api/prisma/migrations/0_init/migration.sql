-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMINISTRATOR', 'ENGINEER', 'TECHNICIAN', 'READ_ONLY');

-- CreateTable
CREATE TABLE "presses" (
    "id" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "commissioningYear" INTEGER,
    "magType" TEXT NOT NULL,
    "magTypeRaw" TEXT NOT NULL,
    "reversibleWasherDiameter" DOUBLE PRECISION,
    "hasLocatingStuds" BOOLEAN NOT NULL,
    "maxOpeningStroke" DOUBLE PRECISION,
    "minThickness" DOUBLE PRECISION NOT NULL,
    "maxThickness" DOUBLE PRECISION NOT NULL,
    "tieBarWidth" DOUBLE PRECISION NOT NULL,
    "tieBarHeight" DOUBLE PRECISION NOT NULL,
    "platenWidth" DOUBLE PRECISION NOT NULL,
    "platenHeight" DOUBLE PRECISION NOT NULL,
    "hydraulicPF" INTEGER NOT NULL,
    "hydraulicPM" INTEGER NOT NULL,
    "sequentialMax" INTEGER,
    "sequentialOutputs" INTEGER NOT NULL,
    "heatingZones" INTEGER NOT NULL,
    "connectorType" TEXT NOT NULL,
    "thermoPF" INTEGER NOT NULL,
    "thermoPM" INTEGER NOT NULL,
    "thermoGrid" INTEGER NOT NULL,
    "clampingForce" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "presses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "molds" (
    "id" TEXT NOT NULL,
    "projectRef" TEXT NOT NULL DEFAULT '',
    "designation" TEXT NOT NULL,
    "heightHm" DOUBLE PRECISION NOT NULL,
    "widthLm" DOUBLE PRECISION NOT NULL,
    "thicknessEm" DOUBLE PRECISION NOT NULL,
    "isStandard" BOOLEAN NOT NULL DEFAULT false,
    "isReversible" BOOLEAN NOT NULL DEFAULT false,
    "cavities" TEXT NOT NULL DEFAULT '1',
    "magType" TEXT NOT NULL,
    "magTypeRaw" TEXT NOT NULL,
    "centeringWasherDiameter" DOUBLE PRECISION,
    "hydraulicPF" INTEGER NOT NULL,
    "hydraulicPM" INTEGER NOT NULL,
    "heatingZones" INTEGER NOT NULL,
    "connectorType" TEXT NOT NULL,
    "waterCircuits" INTEGER,
    "nozzles" INTEGER NOT NULL,
    "sequentialNozzles" INTEGER NOT NULL,
    "thermoPF" INTEGER NOT NULL,
    "thermoPM" INTEGER NOT NULL,
    "thermoGrid" INTEGER NOT NULL,
    "requiredClampingForce" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "molds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "role" "Role" NOT NULL DEFAULT 'READ_ONLY',
    "externalId" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "action" TEXT NOT NULL,
    "userId" TEXT,
    "userEmail" TEXT,
    "pressId" TEXT,
    "moldId" TEXT,
    "decision" TEXT,
    "requiresAdaptation" BOOLEAN,
    "detail" JSONB,
    "ip" TEXT,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "presses_brand_idx" ON "presses"("brand");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_externalId_key" ON "users"("externalId");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_pressId_moldId_idx" ON "audit_logs"("pressId", "moldId");

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_pressId_fkey" FOREIGN KEY ("pressId") REFERENCES "presses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_moldId_fkey" FOREIGN KEY ("moldId") REFERENCES "molds"("id") ON DELETE SET NULL ON UPDATE CASCADE;


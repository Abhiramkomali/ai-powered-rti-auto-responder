-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'ROUTING', 'ASSIGNED', 'UNDER_REVIEW', 'AWAITING_FEE', 'AWAITING_THIRD_PARTY', 'TRANSFERRED', 'DRAFTING_RESPONSE', 'AWAITING_APPROVAL', 'APPROVED', 'RESPONSE_ISSUED', 'CLOSED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "ResponseFormat" AS ENUM ('electronic', 'physical');

-- CreateTable
CREATE TABLE "RtiRequest" (
    "id" TEXT NOT NULL,
    "referenceNumber" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "mobile" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "pinCode" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "dateFrom" DATE,
    "dateTo" DATE,
    "responseFormat" "ResponseFormat" NOT NULL,
    "status" "RequestStatus" NOT NULL DEFAULT 'SUBMITTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RtiRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RtiRequest_referenceNumber_key" ON "RtiRequest"("referenceNumber");

-- CreateIndex
CREATE INDEX "RtiRequest_email_idx" ON "RtiRequest"("email");

-- CreateIndex
CREATE INDEX "RtiRequest_departmentId_idx" ON "RtiRequest"("departmentId");

-- CreateIndex
CREATE INDEX "RtiRequest_status_idx" ON "RtiRequest"("status");

-- CreateIndex
CREATE INDEX "RtiRequest_createdAt_idx" ON "RtiRequest"("createdAt");

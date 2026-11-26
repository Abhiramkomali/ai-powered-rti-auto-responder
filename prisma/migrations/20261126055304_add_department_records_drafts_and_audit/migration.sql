-- CreateTable
CREATE TABLE "DepartmentRecord" (
    "id" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "referenceNumber" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "relevantDateFrom" DATE,
    "relevantDateTo" DATE,
    "storageReference" TEXT,
    "isDemo" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DepartmentRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RtiResponseDraft" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "aiGenerated" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdBy" TEXT NOT NULL,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RtiResponseDraft_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RtiFinalResponse" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "draftId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "issuedBy" TEXT NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RtiFinalResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DepartmentRecord_departmentId_idx" ON "DepartmentRecord"("departmentId");

-- CreateIndex
CREATE INDEX "DepartmentRecord_category_idx" ON "DepartmentRecord"("category");

-- CreateIndex
CREATE INDEX "DepartmentRecord_relevantDateFrom_relevantDateTo_idx" ON "DepartmentRecord"("relevantDateFrom", "relevantDateTo");

-- CreateIndex
CREATE UNIQUE INDEX "DepartmentRecord_departmentId_referenceNumber_key" ON "DepartmentRecord"("departmentId", "referenceNumber");

-- CreateIndex
CREATE INDEX "RtiResponseDraft_requestId_updatedAt_idx" ON "RtiResponseDraft"("requestId", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "RtiFinalResponse_requestId_key" ON "RtiFinalResponse"("requestId");

-- CreateIndex
CREATE UNIQUE INDEX "RtiFinalResponse_draftId_key" ON "RtiFinalResponse"("draftId");

-- CreateIndex
CREATE INDEX "RtiFinalResponse_issuedAt_idx" ON "RtiFinalResponse"("issuedAt");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_createdAt_idx" ON "AuditLog"("entityType", "entityId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_actorId_createdAt_idx" ON "AuditLog"("actorId", "createdAt");

-- AddForeignKey
ALTER TABLE "DepartmentRecord" ADD CONSTRAINT "DepartmentRecord_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RtiResponseDraft" ADD CONSTRAINT "RtiResponseDraft_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "RtiRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RtiFinalResponse" ADD CONSTRAINT "RtiFinalResponse_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "RtiRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RtiFinalResponse" ADD CONSTRAINT "RtiFinalResponse_draftId_fkey" FOREIGN KEY ("draftId") REFERENCES "RtiResponseDraft"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

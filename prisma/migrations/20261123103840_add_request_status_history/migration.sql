-- CreateTable
CREATE TABLE "RequestStatusHistory" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "fromStatus" "RequestStatus",
    "toStatus" "RequestStatus" NOT NULL,
    "remarks" TEXT,
    "changedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RequestStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RequestStatusHistory_requestId_createdAt_idx" ON "RequestStatusHistory"("requestId", "createdAt");

-- CreateIndex
CREATE INDEX "RequestStatusHistory_changedBy_idx" ON "RequestStatusHistory"("changedBy");

-- AddForeignKey
ALTER TABLE "RequestStatusHistory" ADD CONSTRAINT "RequestStatusHistory_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "RtiRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

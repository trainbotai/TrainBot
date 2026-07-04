-- CreateTable
CREATE TABLE "pilot_requests" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "school" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "message" TEXT,
    "locale" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pilot_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "pilot_requests_createdAt_idx" ON "pilot_requests"("createdAt");

-- CreateEnum
CREATE TYPE "AssignmentType" AS ENUM ('ML_TRAINING', 'LLM_TRAINING', 'MIXED');

-- AlterTable
ALTER TABLE "assignments" ADD COLUMN     "type" "AssignmentType" NOT NULL DEFAULT 'ML_TRAINING';

-- CreateTable
CREATE TABLE "llm_sessions" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "assignmentId" TEXT,
    "name" TEXT NOT NULL,
    "currentVersionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "llm_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "llm_session_versions" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "examples" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "llm_session_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "llm_queries" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "versionId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "userPrompt" TEXT NOT NULL,
    "aiResponse" TEXT NOT NULL,
    "inputModerationFlagged" BOOLEAN NOT NULL DEFAULT false,
    "outputModerationFlagged" BOOLEAN NOT NULL DEFAULT false,
    "moderationCategories" JSONB,
    "inputTokens" INTEGER,
    "outputTokens" INTEGER,
    "groqLatencyMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "llm_queries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "llm_reports" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "reason" TEXT,
    "reviewed" BOOLEAN NOT NULL DEFAULT false,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "llm_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "llm_sessions_tenantId_idx" ON "llm_sessions"("tenantId");

-- CreateIndex
CREATE INDEX "llm_sessions_studentId_idx" ON "llm_sessions"("studentId");

-- CreateIndex
CREATE INDEX "llm_sessions_assignmentId_idx" ON "llm_sessions"("assignmentId");

-- CreateIndex
CREATE UNIQUE INDEX "llm_session_versions_sessionId_versionNumber_key" ON "llm_session_versions"("sessionId", "versionNumber");

-- CreateIndex
CREATE INDEX "llm_queries_sessionId_idx" ON "llm_queries"("sessionId");

-- CreateIndex
CREATE INDEX "llm_queries_studentId_createdAt_idx" ON "llm_queries"("studentId", "createdAt");

-- CreateIndex
CREATE INDEX "llm_queries_outputModerationFlagged_idx" ON "llm_queries"("outputModerationFlagged");

-- CreateIndex
CREATE INDEX "llm_reports_teacherId_reviewed_idx" ON "llm_reports"("teacherId", "reviewed");

-- AddForeignKey
ALTER TABLE "llm_sessions" ADD CONSTRAINT "llm_sessions_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "llm_sessions" ADD CONSTRAINT "llm_sessions_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "assignments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "llm_session_versions" ADD CONSTRAINT "llm_session_versions_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "llm_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "llm_queries" ADD CONSTRAINT "llm_queries_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "llm_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "llm_queries" ADD CONSTRAINT "llm_queries_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "llm_session_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "llm_reports" ADD CONSTRAINT "llm_reports_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "llm_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- CreateTable
CREATE TABLE "llm_teacher_bots" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "classId" TEXT,
    "name" TEXT NOT NULL,
    "instruction" TEXT NOT NULL,
    "examples" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "llm_teacher_bots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "llm_teacher_bots_tenantId_idx" ON "llm_teacher_bots"("tenantId");

-- CreateIndex
CREATE INDEX "llm_teacher_bots_teacherId_idx" ON "llm_teacher_bots"("teacherId");

-- CreateIndex
CREATE INDEX "llm_teacher_bots_classId_idx" ON "llm_teacher_bots"("classId");

-- AddForeignKey
ALTER TABLE "llm_teacher_bots" ADD CONSTRAINT "llm_teacher_bots_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "llm_teacher_bots" ADD CONSTRAINT "llm_teacher_bots_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "teachers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "llm_teacher_bots" ADD CONSTRAINT "llm_teacher_bots_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable llm_queries: make sessionId/versionId nullable, add botId
ALTER TABLE "llm_queries" ALTER COLUMN "sessionId" DROP NOT NULL;

ALTER TABLE "llm_queries" ALTER COLUMN "versionId" DROP NOT NULL;

ALTER TABLE "llm_queries" ADD COLUMN "botId" TEXT;

-- CreateIndex
CREATE INDEX "llm_queries_botId_idx" ON "llm_queries"("botId");

-- AddForeignKey
ALTER TABLE "llm_queries" ADD CONSTRAINT "llm_queries_botId_fkey" FOREIGN KEY ("botId") REFERENCES "llm_teacher_bots"("id") ON DELETE SET NULL ON UPDATE CASCADE;

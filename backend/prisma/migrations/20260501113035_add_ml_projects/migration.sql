-- CreateTable
CREATE TABLE "ml_projects" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "modelTrained" BOOLEAN NOT NULL DEFAULT false,
    "modelVersion" INTEGER NOT NULL DEFAULT 0,
    "trainedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ml_projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ml_labels" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "imageCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ml_labels_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ml_projects_tenantId_idx" ON "ml_projects"("tenantId");

-- CreateIndex
CREATE INDEX "ml_projects_studentId_idx" ON "ml_projects"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "ml_projects_studentId_clientId_key" ON "ml_projects"("studentId", "clientId");

-- CreateIndex
CREATE INDEX "ml_labels_projectId_idx" ON "ml_labels"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "ml_labels_projectId_clientId_key" ON "ml_labels"("projectId", "clientId");

-- AddForeignKey
ALTER TABLE "ml_projects" ADD CONSTRAINT "ml_projects_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ml_labels" ADD CONSTRAINT "ml_labels_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "ml_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

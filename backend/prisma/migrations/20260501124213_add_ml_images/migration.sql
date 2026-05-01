-- CreateTable
CREATE TABLE "ml_images" (
    "id" TEXT NOT NULL,
    "labelId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ml_images_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ml_images_labelId_idx" ON "ml_images"("labelId");

-- CreateIndex
CREATE UNIQUE INDEX "ml_images_labelId_clientId_key" ON "ml_images"("labelId", "clientId");

-- AddForeignKey
ALTER TABLE "ml_images" ADD CONSTRAINT "ml_images_labelId_fkey" FOREIGN KEY ("labelId") REFERENCES "ml_labels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

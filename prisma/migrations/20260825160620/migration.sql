-- CreateTable
CREATE TABLE "laporan_petugas" (
    "id" TEXT NOT NULL,
    "laporanId" TEXT NOT NULL,
    "petugasId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "laporan_petugas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "laporan_petugas_laporanId_petugasId_key" ON "laporan_petugas"("laporanId", "petugasId");

-- AddForeignKey
ALTER TABLE "laporan_petugas" ADD CONSTRAINT "laporan_petugas_laporanId_fkey" FOREIGN KEY ("laporanId") REFERENCES "laporan_sampah"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "laporan_petugas" ADD CONSTRAINT "laporan_petugas_petugasId_fkey" FOREIGN KEY ("petugasId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

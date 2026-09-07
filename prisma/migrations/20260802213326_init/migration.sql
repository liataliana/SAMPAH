-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'USER', 'PETUGAS');

-- CreateEnum
CREATE TYPE "StatusLaporan" AS ENUM ('MENUNGGU', 'DIPROSES', 'SELESAI');

-- CreateEnum
CREATE TYPE "StatusPengangkutan" AS ENUM ('BELUM_DIANGKUT', 'SEDANG_DIANGKUT', 'SUDAH_DIANGKUT');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "noHp" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "sekolahId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kota" (
    "id" TEXT NOT NULL,
    "namaKota" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kota_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sekolah" (
    "id" TEXT NOT NULL,
    "namaSekolah" TEXT NOT NULL,
    "alamat" TEXT NOT NULL,
    "kotaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sekolah_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jenis_sampah" (
    "id" TEXT NOT NULL,
    "namaJenis" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "jenis_sampah_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "laporan_sampah" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sekolahId" TEXT NOT NULL,
    "jenisSampahId" TEXT NOT NULL,
    "berat" DOUBLE PRECISION NOT NULL,
    "tanggalLapor" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "StatusLaporan" NOT NULL DEFAULT 'MENUNGGU',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "laporan_sampah_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "foto_laporan" (
    "id" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "laporanId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "foto_laporan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pengangkutan" (
    "id" TEXT NOT NULL,
    "laporanId" TEXT NOT NULL,
    "petugasId" TEXT NOT NULL,
    "tanggalPengangkutan" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "StatusPengangkutan" NOT NULL DEFAULT 'BELUM_DIANGKUT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pengangkutan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "foto_pengangkutan" (
    "id" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "pengangkutanId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "foto_pengangkutan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_noHp_key" ON "users"("noHp");

-- CreateIndex
CREATE UNIQUE INDEX "users_sekolahId_key" ON "users"("sekolahId");

-- CreateIndex
CREATE UNIQUE INDEX "kota_namaKota_key" ON "kota"("namaKota");

-- CreateIndex
CREATE UNIQUE INDEX "sekolah_namaSekolah_key" ON "sekolah"("namaSekolah");

-- CreateIndex
CREATE UNIQUE INDEX "jenis_sampah_namaJenis_key" ON "jenis_sampah"("namaJenis");

-- CreateIndex
CREATE UNIQUE INDEX "foto_laporan_laporanId_key" ON "foto_laporan"("laporanId");

-- CreateIndex
CREATE UNIQUE INDEX "pengangkutan_laporanId_key" ON "pengangkutan"("laporanId");

-- CreateIndex
CREATE UNIQUE INDEX "foto_pengangkutan_pengangkutanId_key" ON "foto_pengangkutan"("pengangkutanId");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_sekolahId_fkey" FOREIGN KEY ("sekolahId") REFERENCES "sekolah"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sekolah" ADD CONSTRAINT "sekolah_kotaId_fkey" FOREIGN KEY ("kotaId") REFERENCES "kota"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "laporan_sampah" ADD CONSTRAINT "laporan_sampah_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "laporan_sampah" ADD CONSTRAINT "laporan_sampah_sekolahId_fkey" FOREIGN KEY ("sekolahId") REFERENCES "sekolah"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "laporan_sampah" ADD CONSTRAINT "laporan_sampah_jenisSampahId_fkey" FOREIGN KEY ("jenisSampahId") REFERENCES "jenis_sampah"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "foto_laporan" ADD CONSTRAINT "foto_laporan_laporanId_fkey" FOREIGN KEY ("laporanId") REFERENCES "laporan_sampah"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pengangkutan" ADD CONSTRAINT "pengangkutan_laporanId_fkey" FOREIGN KEY ("laporanId") REFERENCES "laporan_sampah"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pengangkutan" ADD CONSTRAINT "pengangkutan_petugasId_fkey" FOREIGN KEY ("petugasId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "foto_pengangkutan" ADD CONSTRAINT "foto_pengangkutan_pengangkutanId_fkey" FOREIGN KEY ("pengangkutanId") REFERENCES "pengangkutan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

// app/api/admin/laporan/assign-petugas/route.js
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const user = await requireAuth('ADMIN');
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { laporanId, petugasIds } = await request.json();

    if (!laporanId) {
      return NextResponse.json(
        { error: 'Laporan ID wajib diisi' },
        { status: 400 }
      );
    }

    if (!petugasIds || petugasIds.length === 0) {
      return NextResponse.json(
        { error: 'Pilih minimal 1 petugas' },
        { status: 400 }
      );
    }

    const laporan = await prisma.laporanSampah.findUnique({
      where: { id: laporanId },
    });

    if (!laporan) {
      return NextResponse.json(
        { error: 'Laporan tidak ditemukan' },
        { status: 404 }
      );
    }

    if (laporan.status !== 'MENUNGGU') {
      return NextResponse.json(
        { error: 'Laporan sudah diproses, tidak bisa menugaskan petugas lagi' },
        { status: 400 }
      );
    }

    // Hapus petugas lama
    await prisma.laporanPetugas.deleteMany({
      where: { laporanId }
    });

    // Tambah petugas baru
    const dataPetugas = petugasIds.map(petugasId => ({
      laporanId,
      petugasId
    }));

    await prisma.laporanPetugas.createMany({
      data: dataPetugas
    });

    // Update status
    await prisma.laporanSampah.update({
      where: { id: laporanId },
      data: { status: 'DIPROSES' }
    });

    return NextResponse.json({
      success: true,
      message: `${petugasIds.length} petugas berhasil ditugaskan`,
      data: {
        laporanId,
        jumlahPetugas: petugasIds.length
      }
    });

  } catch (error) {
    console.error('Error assign petugas:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan: ' + error.message },
      { status: 500 }
    );
  }
}
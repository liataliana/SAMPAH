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

    // Cek laporan
    const laporan = await prisma.laporanSampah.findUnique({
      where: { id: laporanId },
    });

    if (!laporan) {
      return NextResponse.json(
        { error: 'Laporan tidak ditemukan' },
        { status: 404 }
      );
    }

    // 🔥 KALO LAPORAN UDAH SELESAI, GAK BISA DITUGASKAN LAGI
    if (laporan.status === 'SELESAI') {
      return NextResponse.json(
        { error: 'Laporan sudah selesai, tidak bisa diubah' },
        { status: 400 }
      );
    }

    // 🔥 HAPUS petugas lama (biar bisa REPLACE)
    await prisma.laporanPetugas.deleteMany({
      where: { laporanId }
    });

    // 🔥 TAMBAH petugas baru
    const dataPetugas = petugasIds.map(petugasId => ({
      laporanId,
      petugasId
    }));

    await prisma.laporanPetugas.createMany({
      data: dataPetugas
    });

    // Update status laporan jadi DIPROSES (kalo masih MENUNGGU)
    if (laporan.status === 'MENUNGGU') {
      await prisma.laporanSampah.update({
        where: { id: laporanId },
        data: { status: 'DIPROSES' }
      });
    }

    // 🔥 KALO UDAH DIPROSES, UPDATE PENGANGKUTAN
    if (laporan.status === 'DIPROSES') {
      const pengangkutan = await prisma.pengangkutan.findUnique({
        where: { laporanId }
      });

      if (!pengangkutan && petugasIds.length > 0) {
        await prisma.pengangkutan.create({
          data: {
            laporanId,
            petugasId: petugasIds[0],
            status: 'BELUM_DIANGKUT',
          }
        });
      }
    }

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
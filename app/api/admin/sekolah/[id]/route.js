// app/api/admin/sekolah/[id]/route.js
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function PUT(request, { params }) {
  try {
    const user = await requireAuth('ADMIN');
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = params;
    const { namaSekolah, alamat, kotaId } = await request.json();

    if (!namaSekolah || !alamat || !kotaId) {
      return NextResponse.json(
        { error: 'Semua field wajib diisi' },
        { status: 400 }
      );
    }

    // Cek apakah data exists
    const existing = await prisma.sekolah.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Sekolah tidak ditemukan' },
        { status: 404 }
      );
    }

    // Cek duplikat nama sekolah
    const duplicate = await prisma.sekolah.findFirst({
      where: {
        namaSekolah,
        id: { not: id },
      },
    });

    if (duplicate) {
      return NextResponse.json(
        { error: 'Nama sekolah sudah digunakan' },
        { status: 400 }
      );
    }

    // Cek kota exists
    const kota = await prisma.kota.findUnique({
      where: { id: kotaId },
    });

    if (!kota) {
      return NextResponse.json(
        { error: 'Kota tidak ditemukan' },
        { status: 404 }
      );
    }

    const sekolah = await prisma.sekolah.update({
      where: { id },
      data: {
        namaSekolah: namaSekolah.trim(),
        alamat: alamat.trim(),
        kotaId,
      },
      include: {
        kota: true,
      },
    });

    return NextResponse.json({
      message: 'Sekolah berhasil diupdate',
      data: sekolah,
    });
  } catch (error) {
    console.error('Update sekolah error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const user = await requireAuth('ADMIN');
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = params;

    // Cek apakah sekolah masih memiliki user
    const hasUser = await prisma.user.findFirst({
      where: { sekolahId: id },
    });

    if (hasUser) {
      return NextResponse.json(
        { error: 'Sekolah masih memiliki akun user, tidak dapat dihapus' },
        { status: 400 }
      );
    }

    // Cek apakah sekolah masih memiliki laporan
    const hasLaporan = await prisma.laporanSampah.findFirst({
      where: { sekolahId: id },
    });

    if (hasLaporan) {
      return NextResponse.json(
        { error: 'Sekolah masih memiliki laporan, tidak dapat dihapus' },
        { status: 400 }
      );
    }

    await prisma.sekolah.delete({
      where: { id },
    });

    return NextResponse.json({
      message: 'Sekolah berhasil dihapus',
    });
  } catch (error) {
    console.error('Delete sekolah error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}
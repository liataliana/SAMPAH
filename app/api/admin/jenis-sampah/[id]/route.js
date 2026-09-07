// app/api/admin/jenis-sampah/[id]/route.js
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
    const { namaJenis } = await request.json();

    if (!namaJenis || namaJenis.trim() === '') {
      return NextResponse.json(
        { error: 'Nama jenis sampah wajib diisi' },
        { status: 400 }
      );
    }

    // Cek apakah data exists
    const existing = await prisma.jenisSampah.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Jenis sampah tidak ditemukan' },
        { status: 404 }
      );
    }

    // Cek duplikat nama
    const duplicate = await prisma.jenisSampah.findFirst({
      where: {
        namaJenis,
        id: { not: id },
      },
    });

    if (duplicate) {
      return NextResponse.json(
        { error: 'Nama jenis sampah sudah digunakan' },
        { status: 400 }
      );
    }

    const jenisSampah = await prisma.jenisSampah.update({
      where: { id },
      data: {
        namaJenis: namaJenis.trim(),
      },
    });

    return NextResponse.json({
      message: 'Jenis sampah berhasil diupdate',
      data: jenisSampah,
    });
  } catch (error) {
    console.error('Update jenis sampah error:', error);
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

    // Cek apakah masih digunakan di laporan
    const usedInLaporan = await prisma.laporanSampah.findFirst({
      where: { jenisSampahId: id },
    });

    if (usedInLaporan) {
      return NextResponse.json(
        { error: 'Jenis sampah masih digunakan dalam laporan, tidak dapat dihapus' },
        { status: 400 }
      );
    }

    await prisma.jenisSampah.delete({
      where: { id },
    });

    return NextResponse.json({
      message: 'Jenis sampah berhasil dihapus',
    });
  } catch (error) {
    console.error('Delete jenis sampah error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}
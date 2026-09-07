// app/api/admin/sekolah/route.js
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const user = await requireAuth('ADMIN');
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const sekolah = await prisma.sekolah.findMany({
      include: {
        kota: true,
      },
      orderBy: {
        namaSekolah: 'asc',
      },
    });

    return NextResponse.json(sekolah);
  } catch (error) {
    console.error('Get sekolah error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const user = await requireAuth('ADMIN');
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { namaSekolah, alamat, kotaId } = await request.json();

    if (!namaSekolah || !alamat || !kotaId) {
      return NextResponse.json(
        { error: 'Semua field wajib diisi' },
        { status: 400 }
      );
    }

    // Cek duplikat nama sekolah
    const existing = await prisma.sekolah.findUnique({
      where: { namaSekolah },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Nama sekolah sudah ada' },
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

    const sekolah = await prisma.sekolah.create({
      data: {
        namaSekolah: namaSekolah.trim(),
        alamat: alamat.trim(),
        kotaId,
      },
      include: {
        kota: true,
      },
    });

    return NextResponse.json(
      {
        message: 'Sekolah berhasil ditambahkan',
        data: sekolah,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create sekolah error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}
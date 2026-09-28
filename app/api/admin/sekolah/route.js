// app/api/admin/sekolah/route.js

import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
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
    console.error('GET sekolah error:', error);

    return NextResponse.json(
      { error: 'Gagal mengambil data sekolah' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();

    const { namaSekolah, alamat, kotaId } = body;

    if (!namaSekolah || !alamat || !kotaId) {
      return NextResponse.json(
        { error: 'Nama sekolah, alamat, dan kota wajib diisi' },
        { status: 400 }
      );
    }

    const kota = await prisma.kota.findUnique({
      where: {
        id: kotaId,
      },
    });

    if (!kota) {
      return NextResponse.json(
        { error: 'Kota tidak ditemukan' },
        { status: 400 }
      );
    }

    const existingSekolah = await prisma.sekolah.findUnique({
      where: {
        namaSekolah,
      },
    });

    if (existingSekolah) {
      return NextResponse.json(
        { error: 'Nama sekolah sudah terdaftar' },
        { status: 400 }
      );
    }

    const sekolah = await prisma.sekolah.create({
      data: {
        namaSekolah,
        alamat,
        kotaId,
      },
      include: {
        kota: true,
      },
    });

    return NextResponse.json(
      {
        message: 'Sekolah berhasil ditambahkan',
        sekolah,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST sekolah error:', error);

    return NextResponse.json(
      { error: 'Gagal menambahkan sekolah' },
      { status: 500 }
    );
  }
}
// app/api/admin/kota/route.js
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

    const kota = await prisma.kota.findMany({
      orderBy: {
        namaKota: 'asc',
      },
    });

    return NextResponse.json(kota);
  } catch (error) {
    console.error('Get kota error:', error);
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

    const { namaKota } = await request.json();

    if (!namaKota || namaKota.trim() === '') {
      return NextResponse.json(
        { error: 'Nama kota wajib diisi' },
        { status: 400 }
      );
    }

    // Cek duplikat
    const existing = await prisma.kota.findUnique({
      where: { namaKota },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Nama kota sudah ada' },
        { status: 400 }
      );
    }

    const kota = await prisma.kota.create({
      data: {
        namaKota: namaKota.trim(),
      },
    });

    return NextResponse.json(
      {
        message: 'Kota berhasil ditambahkan',
        data: kota,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create kota error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}
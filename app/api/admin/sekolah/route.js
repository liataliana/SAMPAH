// app/api/sekolah/route.js
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const sekolah = await prisma.sekolah.findMany({
      select: {
        id: true,
        namaSekolah: true,
        kota: {
          select: {
            id: true,
            namaKota: true,
          },
        },
      },
      orderBy: {
        namaSekolah: 'asc',
      },
    });

    return NextResponse.json(sekolah);
  } catch (error) {
    console.error('Get sekolah public error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}
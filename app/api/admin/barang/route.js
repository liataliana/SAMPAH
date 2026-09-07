// app/api/admin/barang/route.js
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { NextResponse } from 'next/server';

// 🔥 GET SEMUA BARANG (Bisa diakses USER juga)
export async function GET(request) {
  try {
    const user = await requireAuth(null);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const barang = await prisma.barang.findMany({
      orderBy: { createdAt: 'desc' }
    });

    console.log('📦 Barang ditemukan:', barang.length); // DEBUG

    return NextResponse.json(barang);
  } catch (error) {
    console.error('Get barang error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan' },
      { status: 500 }
    );
  }
}

// 🔥 CREATE BARANG (ADMIN ONLY)
export async function POST(request) {
  try {
    const user = await requireAuth('ADMIN');
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { nama, hargaPoin, stok, deskripsi, imageUrl } = await request.json();

    if (!nama || !hargaPoin || stok === undefined) {
      return NextResponse.json(
        { error: 'Nama, harga poin, dan stok wajib diisi' },
        { status: 400 }
      );
    }

    const barang = await prisma.barang.create({
      data: {
        nama,
        hargaPoin: parseInt(hargaPoin),
        stok: parseInt(stok),
        deskripsi: deskripsi || '',
        imageUrl: imageUrl || null,
      },
    });

    return NextResponse.json({
      message: 'Barang berhasil ditambahkan!',
      data: barang
    });
  } catch (error) {
    console.error('Create barang error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan' },
      { status: 500 }
    );
  }
}
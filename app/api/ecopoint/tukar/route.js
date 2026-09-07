// app/api/ecopoint/tukar/route.js
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const user = await requireAuth('USER');
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 🔥 TAMBAH alamat di request
    const { barangId, jumlah, alamat } = await request.json();

    if (!barangId || !jumlah || jumlah <= 0) {
      return NextResponse.json(
        { error: 'Barang dan jumlah wajib diisi' },
        { status: 400 }
      );
    }

    if (!alamat || alamat.trim() === '') {
      return NextResponse.json(
        { error: 'Alamat pengiriman wajib diisi' },
        { status: 400 }
      );
    }

    // Cek barang
    const barang = await prisma.barang.findUnique({
      where: { id: barangId }
    });

    if (!barang) {
      return NextResponse.json(
        { error: 'Barang tidak ditemukan' },
        { status: 404 }
      );
    }

    // Cek stok
    if (barang.stok < jumlah) {
      return NextResponse.json(
        { error: `Stok tidak cukup! Sisa: ${barang.stok}` },
        { status: 400 }
      );
    }

    // Hitung total poin
    const totalPoin = barang.hargaPoin * jumlah;

    // Cek ecopoint user
    const ecopoint = await prisma.ecopoint.findUnique({
      where: { userId: user.id }
    });

    if (!ecopoint) {
      return NextResponse.json(
        { error: 'Anda belum memiliki poin' },
        { status: 400 }
      );
    }

    const poinTersisa = ecopoint.totalPoin - ecopoint.poinTerpakai;
    if (poinTersisa < totalPoin) {
      return NextResponse.json(
        { error: `Poin tidak cukup! Sisa: ${poinTersisa}, Butuh: ${totalPoin}` },
        { status: 400 }
      );
    }

    // 🔥 PROSES TUKAR POIN
    const result = await prisma.$transaction(async (tx) => {
      // Update poin terpakai
      await tx.ecopoint.update({
        where: { userId: user.id },
        data: {
          poinTerpakai: { increment: totalPoin }
        }
      });

      // Kurangi stok barang
      await tx.barang.update({
        where: { id: barangId },
        data: {
          stok: { decrement: jumlah }
        }
      });

      // 🔥 TAMBAH transaksi dengan alamat
      const transaksi = await tx.transaksiPoin.create({
        data: {
          userId: user.id,
          jenis: 'TUKAR',
          poin: -totalPoin,
          deskripsi: `Tukar ${barang.nama} x${jumlah}`,
          barangId: barangId,
          alamat: alamat // 🔥 ALAMAT DISIMPAN!
        }
      });

      return transaksi;
    });

    return NextResponse.json({
      message: `Berhasil menukar ${barang.nama} x${jumlah} dengan ${totalPoin} poin!`,
      data: result
    });
  } catch (error) {
    console.error('Tukar poin error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan: ' + error.message },
      { status: 500 }
    );
  }
}
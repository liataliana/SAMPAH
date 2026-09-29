// app/api/ecopoint/route.js
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { NextResponse } from 'next/server';

// 🔥 AMBIL TOTAL POIN USER
export async function GET(request) {
  try {
    const user = await requireAuth(null);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('🔍 Get ecopoint untuk user:', user.id);

    // 🔥 PAKE PRISMA CLIENT BIASA (BUKAN RAW QUERY!)
    let ecopoint = await prisma.ecopoint.findUnique({
      where: { userId: user.id }
    });

    // Kalo belum ada, bikin baru
    if (!ecopoint) {
      console.log('📌 Ecopoint belum ada, bikin baru...');
      ecopoint = await prisma.ecopoint.create({
        data: {
          userId: user.id,
          totalPoin: 0,
          poinTerpakai: 0
        }
      });
    }

    // Ambil transaksi terpisah
    const transaksi = await prisma.transaksiPoin.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    console.log('✅ Ecopoint:', ecopoint.totalPoin);

    return NextResponse.json({
      ...ecopoint,
      transaksi: transaksi || []
    });

  } catch (error) {
    console.error('❌ Get ecopoint error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan: ' + error.message },
      { status: 500 }
    );
  }
}

// 🔥 TAMBAH POIN (VERSI MANUAL)
export async function POST(request) {
  try {
    const user = await requireAuth('USER');
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { laporanId, berat, jenisSampahId } = await request.json();

    if (!laporanId || !berat) {
      return NextResponse.json(
        { error: 'Laporan ID dan berat wajib diisi' },
        { status: 400 }
      );
    }

    // Ambil poinPerKg
    let poinPerKg = 1;
    if (jenisSampahId) {
      const jenisSampah = await prisma.jenisSampah.findUnique({
        where: { id: jenisSampahId }
      });
      poinPerKg = jenisSampah?.poinPerKg || 1;
    }

    const poinDapat = Math.floor(berat * poinPerKg);

    console.log('🔍 Tambah poin:', { userId: user.id, poinDapat, berat });

    // 🔥 PAKE PRISMA CLIENT BIASA
    let ecopoint = await prisma.ecopoint.findUnique({
      where: { userId: user.id }
    });

    if (!ecopoint) {
      ecopoint = await prisma.ecopoint.create({
        data: {
          userId: user.id,
          totalPoin: 0,
          poinTerpakai: 0
        }
      });
    }

    // Update poin
    const updated = await prisma.ecopoint.update({
      where: { userId: user.id },
      data: { totalPoin: { increment: poinDapat } }
    });

    // Catat transaksi
    await prisma.transaksiPoin.create({
      data: {
        userId: user.id,
        jenis: 'DAPAT',
        poin: poinDapat,
        deskripsi: `Laporan sampah ${berat}kg (${poinPerKg} poin/kg)`,
        laporanId: laporanId
      }
    });

    console.log('✅ Poin berhasil ditambahkan:', updated.totalPoin);

    return NextResponse.json({
      message: `Berhasil mendapat ${poinDapat} poin!`,
      data: { poinDapat, totalPoin: updated.totalPoin }
    });

  } catch (error) {
    console.error('❌ Tambah poin error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan: ' + error.message },
      { status: 500 }
    );
  }
}
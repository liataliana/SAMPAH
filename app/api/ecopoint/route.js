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

    console.log('🔍 User ID:', user.id); // DEBUG

    // 🔥 PAKE QUERY LANGSUNG KE DATABASE
    const ecopoint = await prisma.$queryRaw`
      SELECT * FROM ecopoint WHERE "userId" = ${user.id}
    `;

    console.log('🔍 Ecopoint:', ecopoint); // DEBUG

    // Kalo belum ada, bikin baru
    let ecoData;
    if (!ecopoint || ecopoint.length === 0) {
      await prisma.$executeRaw`
        INSERT INTO ecopoint ("id", "userId", "totalPoin", "poinTerpakai", "createdAt", "updatedAt")
        VALUES (gen_random_uuid(), ${user.id}, 0, 0, NOW(), NOW())
      `;

      // Ambil lagi
      const newEco = await prisma.$queryRaw`
        SELECT * FROM ecopoint WHERE "userId" = ${user.id}
      `;
      ecoData = newEco[0];
    } else {
      ecoData = ecopoint[0];
    }

    // 🔥 Ambil transaksi
    const transaksi = await prisma.$queryRaw`
      SELECT * FROM transaksi_poin 
      WHERE "userId" = ${user.id}
      ORDER BY "createdAt" DESC
      LIMIT 10
    `;

    console.log('🔍 Transaksi:', transaksi); // DEBUG

    return NextResponse.json({
      ...ecoData,
      transaksi: transaksi || []
    });
  } catch (error) {
    console.error('Get ecopoint error:', error);
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

    // Ambil poinPerKg dari jenis sampah
    let poinPerKg = 1;
    if (jenisSampahId) {
      const jenisSampah = await prisma.$queryRaw`
        SELECT * FROM jenis_sampah WHERE id = ${jenisSampahId}
      `;
      if (jenisSampah && jenisSampah.length > 0) {
        poinPerKg = jenisSampah[0].poinPerKg || 1;
      }
    }

    const poinDapat = Math.floor(berat * poinPerKg);

    console.log('🔍 Tambah poin:', { userId: user.id, poinDapat, berat }); // DEBUG

    // Cek ecopoint ada gak
    const cekEco = await prisma.$queryRaw`
      SELECT * FROM ecopoint WHERE "userId" = ${user.id}
    `;

    // Kalo belum ada, bikin
    if (!cekEco || cekEco.length === 0) {
      await prisma.$executeRaw`
        INSERT INTO ecopoint ("id", "userId", "totalPoin", "poinTerpakai", "createdAt", "updatedAt")
        VALUES (gen_random_uuid(), ${user.id}, 0, 0, NOW(), NOW())
      `;
    }

    // Update total poin
    await prisma.$executeRaw`
      UPDATE ecopoint 
      SET "totalPoin" = "totalPoin" + ${poinDapat}, "updatedAt" = NOW()
      WHERE "userId" = ${user.id}
    `;

    // Tambah transaksi
    await prisma.$executeRaw`
      INSERT INTO transaksi_poin ("id", "userId", "jenis", "poin", "deskripsi", "laporanId", "createdAt")
      VALUES (gen_random_uuid(), ${user.id}, 'DAPAT', ${poinDapat}, ${`Laporan sampah ${berat}kg (${poinPerKg} poin/kg)`}, ${laporanId}, NOW())
    `;

    console.log('✅ Poin berhasil ditambahkan!');

    return NextResponse.json({
      message: `Berhasil mendapat ${poinDapat} poin!`,
      data: { poinDapat }
    });
  } catch (error) {
    console.error('Tambah poin error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan: ' + error.message },
      { status: 500 }
    );
  }
}
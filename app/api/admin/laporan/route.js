// app/api/laporan/route.js
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const user = await requireAuth(null);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('🔍 USER LOGIN:', {
      id: user.id,
      email: user.email,
      role: user.role
    });

    let laporan = [];

    // 🔥 LOGIC SEDERHANA:
    // - ADMIN: liat semua
    // - USER: liat laporan sendiri
    // - PETUGAS: liat laporan yang ditugaskan ke dia
    
    if (user.role === 'ADMIN') {
      // ADMIN: liat semua laporan
      laporan = await prisma.laporanSampah.findMany({
        include: {
          user: {
            select: { id: true, nama: true, email: true }
          },
          sekolah: {
            include: { kota: true }
          },
          jenisSampah: true,
          fotoLaporan: true,
          petugasTugas: {
            include: {
              petugas: {
                select: { id: true, nama: true, email: true }
              }
            }
          },
          pengangkutan: {
            include: {
              petugas: {
                select: { id: true, nama: true }
              },
              fotoPengangkutan: true
            }
          }
        },
        orderBy: { tanggalLapor: 'desc' }
      });
      
    } else if (user.role === 'USER') {
      // USER: liat laporan sendiri
      laporan = await prisma.laporanSampah.findMany({
        where: { userId: user.id },
        include: {
          user: {
            select: { id: true, nama: true, email: true }
          },
          sekolah: {
            include: { kota: true }
          },
          jenisSampah: true,
          fotoLaporan: true,
          petugasTugas: {
            include: {
              petugas: {
                select: { id: true, nama: true, email: true }
              }
            }
          },
          pengangkutan: {
            include: {
              petugas: {
                select: { id: true, nama: true }
              },
              fotoPengangkutan: true
            }
          }
        },
        orderBy: { tanggalLapor: 'desc' }
      });
      
    } else if (user.role === 'PETUGAS') {
      // 🔥 PETUGAS: liat laporan yang ditugaskan ke dia
      console.log('🔍 Mencari laporan untuk petugas:', user.id);
      
      // CARA 1: Pake RAW QUERY (PASTI JALAN)
      laporan = await prisma.$queryRaw`
        SELECT DISTINCT l.* 
        FROM laporan_sampah l
        JOIN laporan_petugas lp ON lp."laporanId" = l.id
        WHERE lp."petugasId" = ${user.id}
        ORDER BY l."tanggalLapor" DESC
      `;
      
      console.log(`📊 Ditemukan ${laporan.length} laporan untuk petugas`);
    }

    return NextResponse.json(laporan);
    
  } catch (error) {
    console.error('❌ ERROR GET LAPORAN:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan: ' + error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const user = await requireAuth('USER');
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { jenisSampahId, berat, imageUrl } = await request.json();

    if (!berat || berat <= 0) {
      return NextResponse.json(
        { error: 'Berat sampah harus lebih dari 0 kg' },
        { status: 400 }
      );
    }

    if (!jenisSampahId) {
      return NextResponse.json(
        { error: 'Jenis sampah wajib dipilih' },
        { status: 400 }
      );
    }

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'Foto bukti wajib diunggah' },
        { status: 400 }
      );
    }

    const jenisSampah = await prisma.jenisSampah.findUnique({
      where: { id: jenisSampahId },
    });

    if (!jenisSampah) {
      return NextResponse.json(
        { error: 'Jenis sampah tidak ditemukan' },
        { status: 404 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const laporan = await tx.laporanSampah.create({
        data: {
          userId: user.id,
          sekolahId: user.sekolahId,
          jenisSampahId,
          berat: parseFloat(berat),
          status: 'MENUNGGU',
        },
      });

      await tx.fotoLaporan.create({
        data: {
          imageUrl,
          laporanId: laporan.id,
        },
      });

      return laporan;
    });

    return NextResponse.json(
      {
        message: 'Laporan berhasil dibuat',
        data: result,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create laporan error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}
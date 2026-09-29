// app/api/laporan/[id]/route.js

import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { NextResponse } from 'next/server';

// ======================================================
// GET DETAIL LAPORAN
// ======================================================
export async function GET(request, { params }) {
  try {
    const user = await requireAuth(null);

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    const laporan = await prisma.laporanSampah.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, nama: true, email: true },
        },
        sekolah: {
          include: { kota: true },
        },
        jenisSampah: true,
        fotoLaporan: true,
        petugasTugas: {
          include: {
            petugas: {
              select: { id: true, nama: true, email: true },
            },
          },
        },
        pengangkutan: {
          include: {
            petugas: {
              select: { id: true, nama: true },
            },
            fotoPengangkutan: true,
          },
        },
      },
    });

    if (!laporan) {
      return NextResponse.json(
        { error: 'Laporan tidak ditemukan' },
        { status: 404 }
      );
    }

    if (user.role === 'USER' && laporan.userId !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    return NextResponse.json(laporan);

  } catch (error) {
    console.error('GET LAPORAN DETAIL ERROR:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}


// ======================================================
// UPDATE STATUS LAPORAN
// ======================================================
export async function PUT(request, { params }) {
  try {
    console.log('======================================');
    console.log('🔥 PUT LAPORAN DIPANGGIL');
    console.log('======================================');

    const user = await requireAuth(null);

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    console.log('User:', user.email);
    console.log('Role:', user.role);
    console.log('Laporan ID:', id);
    console.log('Status baru:', status);

    // VALIDASI STATUS
    const validStatus = ['MENUNGGU', 'DIPROSES', 'SELESAI'];

    if (!status) {
      return NextResponse.json(
        { error: 'Status wajib diisi' },
        { status: 400 }
      );
    }

    if (!validStatus.includes(status)) {
      return NextResponse.json(
        { error: 'Status tidak valid' },
        { status: 400 }
      );
    }

    // AMBIL DATA LAPORAN
    const laporanAwal = await prisma.laporanSampah.findUnique({
      where: { id },
      include: { jenisSampah: true },
    });

    if (!laporanAwal) {
      return NextResponse.json(
        { error: 'Laporan tidak ditemukan' },
        { status: 404 }
      );
    }

    console.log('========== DATA LAPORAN ==========');
    console.log('User ID:', laporanAwal.userId);
    console.log('Status lama:', laporanAwal.status);
    console.log('Jenis:', laporanAwal.jenisSampah?.namaJenis);
    console.log('Poin/kg:', laporanAwal.jenisSampah?.poinPerKg);
    console.log('Berat:', laporanAwal.berat);
    console.log('==================================');

    // CEK AKSES ADMIN
    if (user.role === 'ADMIN') {
      if (status === 'SELESAI') {
        return NextResponse.json(
          { error: 'Admin tidak bisa menyelesaikan laporan. Hanya petugas yang bisa.' },
          { status: 403 }
        );
      }
    }
    // CEK AKSES PETUGAS
    else if (user.role === 'PETUGAS') {
      const isAssigned = await prisma.laporanPetugas.findFirst({
        where: { laporanId: id, petugasId: user.id },
      });

      if (!isAssigned) {
        return NextResponse.json(
          { error: 'Anda tidak ditugaskan untuk laporan ini' },
          { status: 403 }
        );
      }

      if (status === 'MENUNGGU') {
        return NextResponse.json(
          { error: 'Petugas tidak bisa mengembalikan status ke MENUNGGU' },
          { status: 403 }
        );
      }
    }
    // USER GAK BISA UPDATE
    else if (user.role === 'USER') {
      return NextResponse.json(
        { error: 'User tidak bisa mengubah status laporan' },
        { status: 403 }
      );
    }

    // ==================================================
    // TRANSACTION
    // ==================================================
    const result = await prisma.$transaction(
      async (tx) => {
        // 1. UPDATE STATUS LAPORAN
        const updatedLaporan = await tx.laporanSampah.update({
          where: { id },
          data: { status },
          include: {
            user: { select: { id: true, nama: true } },
            sekolah: { include: { kota: true } },
            jenisSampah: true,
            fotoLaporan: true,
            petugasTugas: {
              include: {
                petugas: { select: { id: true, nama: true, email: true } },
              },
            },
            pengangkutan: {
              include: {
                petugas: { select: { id: true, nama: true } },
                fotoPengangkutan: true,
              },
            },
          },
        });

        // ==================================================
        // 🔥 2. KALO STATUS DIPROSES → BUAT DATA PENGANGKUTAN
        // ==================================================
        if (status === 'DIPROSES' && laporanAwal.status === 'MENUNGGU') {
          console.log('🚚 Buat data pengangkutan...');

          const existingPengangkutan = await tx.pengangkutan.findUnique({
            where: { laporanId: id }
          });

          if (!existingPengangkutan) {
            await tx.pengangkutan.create({
              data: {
                laporanId: id,
                petugasId: user.id,
                status: 'BELUM_DIANGKUT',
                tanggalPengangkutan: new Date(),
              }
            });
            console.log('✅ Data pengangkutan dibuat!');
          }
        }

        // ==================================================
        // 🔥 3. KALO STATUS SELESAI → TAMBAH POIN
        // ==================================================
        if (status === 'SELESAI' && laporanAwal.status !== 'SELESAI') {
          console.log('🎉 LAPORAN SELESAI! Proses tambah poin...');

          const transaksiSebelumnya = await tx.transaksiPoin.findFirst({
            where: { laporanId: id, jenis: 'DAPAT' },
          });

          if (transaksiSebelumnya) {
            console.log('⚠️ Poin laporan ini sudah pernah diberikan.');
          } else {
            const jenisSampah = await tx.jenisSampah.findUnique({
              where: { id: laporanAwal.jenisSampahId },
            });

            if (!jenisSampah) {
              throw new Error('Jenis sampah tidak ditemukan.');
            }

            const berat = Number(laporanAwal.berat || 0);
            const poinPerKg = Number(jenisSampah.poinPerKg || 0);
            const poinDapat = Math.floor(berat * poinPerKg);

            console.log('========== PERHITUNGAN ==========');
            console.log('Jenis:', jenisSampah.namaJenis);
            console.log('Berat:', berat);
            console.log('Poin/kg:', poinPerKg);
            console.log('Poin didapat:', poinDapat);
            console.log('=================================');

            if (berat <= 0) throw new Error('Berat tidak valid.');
            if (poinPerKg <= 0) throw new Error('Poin per kg tidak valid.');
            if (poinDapat <= 0) throw new Error('Poin 0.');

            let ecopoint = await tx.ecopoint.findUnique({
              where: { userId: laporanAwal.userId },
            });

            if (!ecopoint) {
              console.log('📌 Ecopoint belum ada, bikin baru...');
              ecopoint = await tx.ecopoint.create({
                data: {
                  userId: laporanAwal.userId,
                  totalPoin: 0,
                  poinTerpakai: 0,
                },
              });
            }

            console.log('💰 Poin sebelum:', ecopoint.totalPoin);

            const updatedEcopoint = await tx.ecopoint.update({
              where: { userId: laporanAwal.userId },
              data: { totalPoin: { increment: poinDapat } },
            });

            console.log('💰 Poin sesudah:', updatedEcopoint.totalPoin);

            await tx.transaksiPoin.create({
              data: {
                userId: laporanAwal.userId,
                jenis: 'DAPAT',
                poin: poinDapat,
                deskripsi: `Laporan ${jenisSampah.namaJenis} ${berat}kg (${poinPerKg} poin/kg)`,
                laporanId: id,
              },
            });

            console.log(`✅ BERHASIL! User ${laporanAwal.userId} dapat ${poinDapat} poin.`);
          }
        }

        // ==================================================
        // 🔥 4. KALO STATUS SELESAI → UPDATE PENGANGKUTAN
        // ==================================================
        if (status === 'SELESAI') {
          const pengangkutan = await tx.pengangkutan.findUnique({
            where: { laporanId: id }
          });

          if (pengangkutan && pengangkutan.status !== 'SUDAH_DIANGKUT') {
            await tx.pengangkutan.update({
              where: { id: pengangkutan.id },
              data: { status: 'SUDAH_DIANGKUT' }
            });
            console.log('✅ Status pengangkutan → SUDAH_DIANGKUT');
          }
        }

        return updatedLaporan;
      },
      { timeout: 15000 }
    );

    return NextResponse.json({
      message: status === 'SELESAI'
        ? 'Laporan berhasil diselesaikan dan poin berhasil ditambahkan.'
        : 'Status laporan berhasil diupdate',
      data: result,
    });

  } catch (error) {
    console.error('======================================');
    console.error('❌ ERROR PUT LAPORAN');
    console.error(error);
    console.error('======================================');

    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server: ' + error.message },
      { status: 500 }
    );
  }
}
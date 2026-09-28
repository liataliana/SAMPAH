// app/api/laporan/[id]/route.js

import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { NextResponse } from 'next/server';

// ========================
// GET DETAIL LAPORAN
// ========================
export async function GET(request, { params }) {
  try {
    const user = await requireAuth();

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
          select: {
            id: true,
            nama: true,
            email: true,
          },
        },
        sekolah: {
          include: {
            kota: true,
          },
        },
        jenisSampah: true,
        fotoLaporan: true,
        petugasTugas: {
          include: {
            petugas: {
              select: {
                id: true,
                nama: true,
                email: true,
              }
            }
          }
        },
        pengangkutan: {
          include: {
            petugas: {
              select: {
                id: true,
                nama: true,
              },
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

// ========================
// UPDATE STATUS LAPORAN
// ========================
export async function PUT(request, { params }) {
  try {
    console.log('🔥🔥🔥 PUT LAPORAN DIPANGGIL! 🔥🔥🔥');

    const user = await requireAuth(null);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const { status } = await request.json();

    console.log('📝 Status baru:', status);

    if (!status) {
      return NextResponse.json(
        { error: 'Status wajib diisi' },
        { status: 400 }
      );
    }

    const validStatus = ['MENUNGGU', 'DIPROSES', 'SELESAI'];
    if (!validStatus.includes(status)) {
      return NextResponse.json(
        { error: 'Status tidak valid' },
        { status: 400 }
      );
    }

    // CEK AKSES
    if (user.role === 'ADMIN') {
      if (status === 'SELESAI') {
        return NextResponse.json(
          { error: 'Admin tidak bisa menyelesaikan laporan. Hanya petugas yang bisa.' },
          { status: 403 }
        );
      }
    } 
    else if (user.role === 'PETUGAS') {
      const isAssigned = await prisma.laporanPetugas.findFirst({
        where: {
          laporanId: id,
          petugasId: user.id
        }
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
    else if (user.role === 'USER') {
      return NextResponse.json(
        { error: 'User tidak bisa mengubah status laporan' },
        { status: 403 }
      );
    }

    // 🔥 EKSEKUSI UPDATE
    const laporan = await prisma.$transaction(
      async (tx) => {
      // Update status laporan
      const updated = await tx.laporanSampah.update({
        where: { id },
        data: { status },
        include: {
          user: {
            select: {
              id: true,
              nama: true,
            },
          },
          sekolah: {
            include: {
              kota: true,
            },
          },
          jenisSampah: true,
          fotoLaporan: true,
          petugasTugas: {
            include: {
              petugas: {
                select: {
                  id: true,
                  nama: true,
                  email: true,
                }
              }
            }
          },
          pengangkutan: {
            include: {
              petugas: {
                select: {
                  id: true,
                  nama: true,
                },
              },
              fotoPengangkutan: true,
            },
          },
        },
      });
      

      // 🔥🔥🔥 TAMBAH ECOPOINT KALO LAPORAN SELESAI! 🔥🔥🔥
      if (status === 'SELESAI') {
        console.log('✅ Laporan SELESAI! Tambah poin...');

        // Ambil data laporan
        const laporanData = await tx.laporanSampah.findUnique({
          where: { id },
          select: { 
            userId: true, 
            berat: true,
            jenisSampahId: true
          },
        });

        console.log('📊 Data laporan:', laporanData);

        if (laporanData) {
          // Ambil poinPerKg dari jenis sampah
          const jenisSampah = await tx.jenisSampah.findUnique({
            where: { id: laporanData.jenisSampahId }
          });

          const poinPerKg = jenisSampah?.poinPerKg || 1;
          const berat = laporanData.berat || 0;
          const poinDapat = Math.floor(berat * poinPerKg);

          console.log(`📊 Poin: ${poinDapat} (${berat}kg x ${poinPerKg} poin/kg)`);

          if (poinDapat > 0) {
            // Cek ecopoint user
            let ecopoint = await tx.ecopoint.findUnique({
              where: { userId: laporanData.userId },
            });

            if (!ecopoint) {
              console.log('📊 Ecopoint belum ada, bikin baru...');
              await tx.ecopoint.create({
                data: {
                  userId: laporanData.userId,
                  totalPoin: 0,
                  poinTerpakai: 0,
                },
              });
            }

            // Update total poin
            await tx.ecopoint.update({
              where: { userId: laporanData.userId },
              data: {
                totalPoin: { increment: poinDapat },
              },
            });

            // Tambah transaksi
            await tx.transaksiPoin.create({
              data: {
                userId: laporanData.userId,
                jenis: 'DAPAT',
                poin: poinDapat,
                deskripsi: `Laporan ${jenisSampah?.namaJenis || 'sampah'} ${berat}kg (${poinPerKg} poin/kg)`,
                laporanId: id,
              },
            });

            console.log(`✅✅✅ USER ${laporanData.userId} DAPAT ${poinDapat} POIN! ✅✅✅`);
          } else {
            console.log('⚠️ Poin 0, skip...');
          }
        }
      }

      return updated;
      },
  {
    timeout: 15000,
  }
);

    return NextResponse.json({
      message: 'Status laporan berhasil diupdate',
      data: laporan,
    });
  } catch (error) {
    console.error('❌ ERROR PUT:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server: ' + error.message },
      { status: 500 }
    );
  }
}
// app/api/admin/laporan/assign-petugas/route.js

import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    // ==========================================
    // CEK ADMIN
    // ==========================================
    const user = await requireAuth('ADMIN');

    if (!user) {
      return NextResponse.json(
        {
          error: 'Unauthorized',
        },
        {
          status: 401,
        }
      );
    }

    // ==========================================
    // AMBIL DATA
    // ==========================================
    const body = await request.json();

    const {
      laporanId,
      petugasIds,
    } = body;

    if (!laporanId) {
      return NextResponse.json(
        {
          error: 'Laporan ID wajib diisi',
        },
        {
          status: 400,
        }
      );
    }

    if (
      !Array.isArray(petugasIds) ||
      petugasIds.length === 0
    ) {
      return NextResponse.json(
        {
          error: 'Pilih minimal 1 petugas',
        },
        {
          status: 400,
        }
      );
    }

    // ==========================================
    // CEK LAPORAN
    // ==========================================
    const laporan =
      await prisma.laporanSampah.findUnique({
        where: {
          id: laporanId,
        },
      });

    if (!laporan) {
      return NextResponse.json(
        {
          error: 'Laporan tidak ditemukan',
        },
        {
          status: 404,
        }
      );
    }

    // ==========================================
    // LAPORAN HARUS MASIH MENUNGGU
    // ==========================================
    if (laporan.status !== 'MENUNGGU') {
      return NextResponse.json(
        {
          error:
            'Laporan sudah diproses dan tidak dapat ditugaskan kembali.',
        },
        {
          status: 400,
        }
      );
    }

    // ==========================================
    // CEK SEMUA PETUGAS
    // ==========================================
    const petugas =
      await prisma.user.findMany({
        where: {
          id: {
            in: petugasIds,
          },
          role: 'PETUGAS',
        },

        select: {
          id: true,
          nama: true,
        },
      });

    if (petugas.length !== petugasIds.length) {
      return NextResponse.json(
        {
          error:
            'Ada petugas yang tidak ditemukan atau bukan petugas.',
        },
        {
          status: 400,
        }
      );
    }

    // ==========================================
    // TRANSACTION
    // ==========================================
    await prisma.$transaction(
      async (tx) => {
        // Hapus penugasan lama jika ada
        await tx.laporanPetugas.deleteMany({
          where: {
            laporanId,
          },
        });

        // Buat penugasan baru
        await tx.laporanPetugas.createMany({
          data: petugasIds.map(
            (petugasId) => ({
              laporanId,
              petugasId,
            })
          ),
        });

        // ======================================
        // PENTING:
        // STATUS TETAP MENUNGGU
        // ======================================
        await tx.laporanSampah.update({
          where: {
            id: laporanId,
          },

          data: {
            status: 'MENUNGGU',
          },
        });
      }
    );

    // ==========================================
    // RESPONSE
    // ==========================================
    return NextResponse.json({
      success: true,

      message:
        `${petugas.length} petugas berhasil ditugaskan.`,

      data: {
        laporanId,
        jumlahPetugas: petugas.length,
        petugas,
        status: 'MENUNGGU',
      },
    });

  } catch (error) {
    console.error(
      '❌ Error assign petugas:',
      error
    );

    return NextResponse.json(
      {
        error:
          'Terjadi kesalahan: ' +
          error.message,
      },
      {
        status: 500,
      }
    );
  }
}
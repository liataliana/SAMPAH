// app/api/pengangkutan/route.js
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

    let where = {};

    // 🔥 PETUGAS: liat pengangkutan dari laporan yang ditugaskan ke dia (Many-to-Many)
    if (user.role === 'PETUGAS') {
      // Ambil semua laporan yang ditugaskan ke petugas ini
      const petugasTugas = await prisma.laporanPetugas.findMany({
        where: { petugasId: user.id },
        select: { laporanId: true }
      });

      const laporanIds = petugasTugas.map(t => t.laporanId);

      where.laporanId = {
        in: laporanIds
      };
    }

    const pengangkutan = await prisma.pengangkutan.findMany({
      where,
      include: {
        laporan: {
          include: {
            sekolah: {
              include: {
                kota: true,
              },
            },
            jenisSampah: true,
            user: {
              select: {
                id: true,
                nama: true,
              },
            },
            fotoLaporan: true,
            // 🔥 TAMBAHIN: biar tau petugas apa aja yang ditugaskan
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
            }
          },
        },
        petugas: {
          select: {
            id: true,
            nama: true,
          },
        },
        fotoPengangkutan: true,
      },
      orderBy: {
        tanggalPengangkutan: 'desc',
      },
    });

    return NextResponse.json(pengangkutan);
  } catch (error) {
    console.error('Get pengangkutan error:', error);
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

    const { laporanId, petugasId } = await request.json();

    if (!laporanId || !petugasId) {
      return NextResponse.json(
        { error: 'Laporan dan petugas wajib dipilih' },
        { status: 400 }
      );
    }

    // Cek laporan exists
    const laporan = await prisma.laporanSampah.findUnique({
      where: { id: laporanId },
    });

    if (!laporan) {
      return NextResponse.json(
        { error: 'Laporan tidak ditemukan' },
        { status: 404 }
      );
    }

    // Cek apakah sudah ada pengangkutan
    const existingPengangkutan = await prisma.pengangkutan.findUnique({
      where: { laporanId },
    });

    if (existingPengangkutan) {
      return NextResponse.json(
        { error: 'Laporan ini sudah memiliki data pengangkutan' },
        { status: 400 }
      );
    }

    // Cek petugas exists
    const petugas = await prisma.user.findUnique({
      where: { id: petugasId },
    });

    if (!petugas || petugas.role !== 'PETUGAS') {
      return NextResponse.json(
        { error: 'Petugas tidak ditemukan' },
        { status: 404 }
      );
    }

    // 🔥 CEK: apakah petugas sudah ditugaskan ke laporan ini?
    const existingTugas = await prisma.laporanPetugas.findFirst({
      where: {
        laporanId,
        petugasId
      }
    });

    if (!existingTugas) {
      return NextResponse.json(
        { error: 'Petugas belum ditugaskan ke laporan ini. Tugaskan dulu!' },
        { status: 400 }
      );
    }

    // Buat pengangkutan dan update status laporan
    const result = await prisma.$transaction(async (tx) => {
      const pengangkutan = await tx.pengangkutan.create({
        data: {
          laporanId,
          petugasId,
          status: 'BELUM_DIANGKUT',
        },
        include: {
          laporan: {
            include: {
              sekolah: true,
              jenisSampah: true,
            },
          },
          petugas: {
            select: {
              id: true,
              nama: true,
            },
          },
        },
      });

      // Update status laporan
      await tx.laporanSampah.update({
        where: { id: laporanId },
        data: { status: 'DIPROSES' },
      });

      return pengangkutan;
    });

    return NextResponse.json(
      {
        message: 'Pengangkutan berhasil ditugaskan',
        data: result,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create pengangkutan error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}
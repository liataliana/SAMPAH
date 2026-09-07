// app/api/pengangkutan/[id]/route.js
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

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

    const pengangkutan = await prisma.pengangkutan.findUnique({
      where: { id },
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
            // 🔥 TAMBAHIN: petugas yang ditugaskan
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
            email: true,
          },
        },
        fotoPengangkutan: true,
      },
    });

    if (!pengangkutan) {
      return NextResponse.json(
        { error: 'Pengangkutan tidak ditemukan' },
        { status: 404 }
      );
    }

    // 🔥 CEK AKSES PETUGAS (Many-to-Many)
    if (user.role === 'PETUGAS') {
      const isAssigned = await prisma.laporanPetugas.findFirst({
        where: {
          laporanId: pengangkutan.laporanId,
          petugasId: user.id
        }
      });

      if (!isAssigned) {
        return NextResponse.json(
          { error: 'Anda tidak memiliki akses ke tugas ini' },
          { status: 403 }
        );
      }
    }

    return NextResponse.json(pengangkutan);
  } catch (error) {
    console.error('Get pengangkutan detail error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server: ' + error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const user = await requireAuth('PETUGAS');
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    console.log('Update pengangkutan:', { id, status, petugasId: user.id });

    if (!status) {
      return NextResponse.json(
        { error: 'Status wajib diisi' },
        { status: 400 }
      );
    }

    const validStatus = ['BELUM_DIANGKUT', 'SEDANG_DIANGKUT', 'SUDAH_DIANGKUT'];
    if (!validStatus.includes(status)) {
      return NextResponse.json(
        { error: 'Status tidak valid' },
        { status: 400 }
      );
    }

    const pengangkutan = await prisma.pengangkutan.findUnique({
      where: { id },
    });

    if (!pengangkutan) {
      return NextResponse.json(
        { error: 'Pengangkutan tidak ditemukan' },
        { status: 404 }
      );
    }

    // 🔥 CEK AKSES PETUGAS (Many-to-Many)
    const isAssigned = await prisma.laporanPetugas.findFirst({
      where: {
        laporanId: pengangkutan.laporanId,
        petugasId: user.id
      }
    });

    if (!isAssigned) {
      return NextResponse.json(
        { error: 'Anda tidak memiliki akses untuk mengubah tugas ini' },
        { status: 403 }
      );
    }

    // Update status pengangkutan dan laporan
    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.pengangkutan.update({
        where: { id },
        data: { status },
        include: {
          laporan: true,
        },
      });

      if (status === 'SUDAH_DIANGKUT') {
        await tx.laporanSampah.update({
          where: { id: pengangkutan.laporanId },
          data: { status: 'SELESAI' },
        });
      } else if (status === 'SEDANG_DIANGKUT') {
        await tx.laporanSampah.update({
          where: { id: pengangkutan.laporanId },
          data: { status: 'DIPROSES' },
        });
      }

      return updated;
    });

    return NextResponse.json({
      message: 'Status pengangkutan berhasil diupdate',
      data: result,
    });
  } catch (error) {
    console.error('Update pengangkutan status error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server: ' + error.message },
      { status: 500 }
    );
  }
}

// Upload foto pengangkutan
export async function POST(request, { params }) {
  try {
    const user = await requireAuth('PETUGAS');
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    const pengangkutan = await prisma.pengangkutan.findUnique({
      where: { id },
    });

    if (!pengangkutan) {
      return NextResponse.json(
        { error: 'Pengangkutan tidak ditemukan' },
        { status: 404 }
      );
    }

    // 🔥 CEK AKSES PETUGAS (Many-to-Many)
    const isAssigned = await prisma.laporanPetugas.findFirst({
      where: {
        laporanId: pengangkutan.laporanId,
        petugasId: user.id
      }
    });

    if (!isAssigned) {
      return NextResponse.json(
        { error: 'Anda tidak memiliki akses ke tugas ini' },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json(
        { error: 'File tidak ditemukan' },
        { status: 400 }
      );
    }

    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Format file tidak didukung. Gunakan JPG, PNG, atau WEBP' },
        { status: 400 }
      );
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Ukuran file maksimal 5MB' },
        { status: 400 }
      );
    }

    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const ext = path.extname(file.name);
    const fileName = `angkut-${timestamp}-${randomString}${ext}`;
    const uploadDir = path.join(process.cwd(), 'public/uploads/pengangkutan');
    const filePath = path.join(uploadDir, fileName);

    await mkdir(uploadDir, { recursive: true });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    const imageUrl = `/uploads/pengangkutan/${fileName}`;

    const fotoPengangkutan = await prisma.fotoPengangkutan.create({
      data: {
        imageUrl,
        pengangkutanId: id,
      },
    });

    if (pengangkutan.status !== 'SUDAH_DIANGKUT') {
      await prisma.$transaction(async (tx) => {
        await tx.pengangkutan.update({
          where: { id },
          data: { status: 'SUDAH_DIANGKUT' },
        });
        await tx.laporanSampah.update({
          where: { id: pengangkutan.laporanId },
          data: { status: 'SELESAI' },
        });
      });
    }

    return NextResponse.json({
      message: 'Foto pengangkutan berhasil diupload',
      data: fotoPengangkutan,
    });
  } catch (error) {
    console.error('Upload foto pengangkutan error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server: ' + error.message },
      { status: 500 }
    );
  }
}
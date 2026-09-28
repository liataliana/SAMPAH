// app/api/laporan/upload/route.js
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';

export async function POST(request) {
  try {
    // Izinkan USER dan PETUGAS
    const user = await requireAuth(null);

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Hanya USER atau PETUGAS yang boleh upload foto
    if (user.role !== 'USER' && user.role !== 'PETUGAS') {
      return NextResponse.json(
        { error: 'Hanya user atau petugas yang dapat upload foto' },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file');
    const laporanId = formData.get('laporanId');

    if (!file) {
      return NextResponse.json(
        { error: 'File tidak ditemukan' },
        { status: 400 }
      );
    }

    if (!laporanId) {
      return NextResponse.json(
        { error: 'Laporan ID wajib diisi' },
        { status: 400 }
      );
    }

    // Cek apakah petugas ditugaskan ke laporan tersebut
    if (user.role === 'PETUGAS') {
      const isAssigned = await prisma.laporanPetugas.findFirst({
        where: {
          laporanId: laporanId,
          petugasId: user.id
        }
      });

      if (!isAssigned) {
        return NextResponse.json(
          { error: 'Anda tidak ditugaskan untuk laporan ini' },
          { status: 403 }
        );
      }
    }

    // Cek untuk USER apakah laporan miliknya
    if (user.role === 'USER') {
      const laporan = await prisma.laporanSampah.findUnique({
        where: {
          id: laporanId
        }
      });

      if (!laporan || laporan.userId !== user.id) {
        return NextResponse.json(
          { error: 'Laporan bukan milik Anda' },
          { status: 403 }
        );
      }
    }

    // Validasi tipe file
    const validTypes = [
      'image/jpeg',
      'image/png',
      'image/jpg',
      'image/webp'
    ];

    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        {
          error:
            'Format file tidak didukung. Gunakan JPG, PNG, atau WEBP'
        },
        { status: 400 }
      );
    }

    // Validasi ukuran file maksimal 5MB
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Ukuran file maksimal 5MB' },
        { status: 400 }
      );
    }

    // Upload file ke Vercel Blob
    const blob = await put(
      `laporan/${Date.now()}-${file.name}`,
      file,
      {
        access: 'public',
        storeId: process.env.ygbru_STORE_ID,
      }
    );

    const imageUrl = blob.url;

    // Cek apakah laporan sudah memiliki foto
    const existingFoto = await prisma.fotoLaporan.findUnique({
      where: {
        laporanId
      }
    });

    let fotoLaporan;

    if (existingFoto) {
      // Update foto yang sudah ada
      fotoLaporan = await prisma.fotoLaporan.update({
        where: {
          laporanId
        },
        data: {
          imageUrl
        }
      });
    } else {
      // Buat foto baru
      fotoLaporan = await prisma.fotoLaporan.create({
        data: {
          imageUrl,
          laporanId,
        },
      });
    }

    return NextResponse.json({
      message: 'Upload berhasil',
      data: fotoLaporan,
    });

  } catch (error) {
    console.error('Upload laporan foto error:', error);

    return NextResponse.json(
      {
        error:
          'Terjadi kesalahan pada server: ' + error.message
      },
      { status: 500 }
    );
  }
}
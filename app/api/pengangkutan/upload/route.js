// app/api/pengangkutan/upload/route.js

import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';

export async function POST(request) {
  try {
    const user = await requireAuth(null);

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (user.role !== 'PETUGAS' && user.role !== 'ADMIN') {
      return NextResponse.json(
        {
          error:
            'Hanya petugas yang dapat upload foto pengangkutan',
        },
        { status: 403 }
      );
    }

    const formData = await request.formData();

    const file = formData.get('file');
    const laporanId = formData.get('laporanId');

    if (!file || !laporanId) {
      return NextResponse.json(
        {
          error: 'File dan Laporan ID wajib diisi',
        },
        { status: 400 }
      );
    }

    // ======================================================
    // CEK PETUGAS DITUGASKAN
    // ======================================================
    if (user.role === 'PETUGAS') {
      const isAssigned =
        await prisma.laporanPetugas.findFirst({
          where: {
            laporanId: laporanId,
            petugasId: user.id,
          },
        });

      if (!isAssigned) {
        return NextResponse.json(
          {
            error:
              'Anda tidak ditugaskan untuk laporan ini',
          },
          { status: 403 }
        );
      }
    }

    // ======================================================
    // CEK LAPORAN
    // ======================================================
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
        { status: 404 }
      );
    }

    // ======================================================
    // VALIDASI FILE
    // ======================================================
    const validTypes = [
      'image/jpeg',
      'image/png',
      'image/jpg',
      'image/webp',
    ];

    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        {
          error: 'Format file tidak didukung',
        },
        { status: 400 }
      );
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        {
          error: 'Ukuran file maksimal 5MB',
        },
        { status: 400 }
      );
    }

    // ======================================================
    // CARI / BUAT DATA PENGANGKUTAN
    // ======================================================
    let pengangkutan =
      await prisma.pengangkutan.findUnique({
        where: {
          laporanId,
        },
      });

    if (!pengangkutan) {
      pengangkutan =
        await prisma.pengangkutan.create({
          data: {
            laporanId,
            petugasId: user.id,
            status: 'SUDAH_DIANGKUT',
            tanggalPengangkutan: new Date(),
          },
        });
    }

    // ======================================================
    // UPLOAD KE VERCEL BLOB
    // ======================================================
    const blob = await put(
      `pengangkutan/${Date.now()}-${file.name}`,
      file,
      {
        access: 'public',
        storeId: process.env.ygbru_STORE_ID,
      }
    );

    const imageUrl = blob.url;

    // ======================================================
    // SIMPAN / UPDATE FOTO PENGANGKUTAN
    // ======================================================
    const existingFoto =
      await prisma.fotoPengangkutan.findUnique({
        where: {
          pengangkutanId: pengangkutan.id,
        },
      });

    let fotoPengangkutan;

    if (existingFoto) {
      fotoPengangkutan =
        await prisma.fotoPengangkutan.update({
          where: {
            pengangkutanId: pengangkutan.id,
          },

          data: {
            imageUrl,
          },
        });
    } else {
      fotoPengangkutan =
        await prisma.fotoPengangkutan.create({
          data: {
            imageUrl,
            pengangkutanId: pengangkutan.id,
          },
        });
    }

    // ======================================================
    // JANGAN UPDATE STATUS LAPORAN DI SINI
    //
    // Status laporan akan diubah menjadi SELESAI
    // melalui:
    //
    // PUT /api/laporan/[id]
    //
    // supaya proses EcoPoint ikut dijalankan.
    // ======================================================

    // Update status pengangkutan
    await prisma.pengangkutan.update({
      where: {
        id: pengangkutan.id,
      },

      data: {
        status: 'SUDAH_DIANGKUT',
      },
    });

    return NextResponse.json({
      message:
        '✅ Foto hasil angkut berhasil diupload!',
      data: fotoPengangkutan,
    });

  } catch (error) {
    console.error(
      'Upload foto pengangkutan error:',
      error
    );

    return NextResponse.json(
      {
        error:
          'Terjadi kesalahan: ' +
          error.message,
      },
      { status: 500 }
    );
  }
}
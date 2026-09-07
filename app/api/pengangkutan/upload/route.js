// app/api/pengangkutan/upload/route.js
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(request) {
  try {
    const user = await requireAuth(null);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Hanya PETUGAS atau ADMIN
    if (user.role !== 'PETUGAS' && user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Hanya petugas yang dapat upload foto pengangkutan' },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file');
    const laporanId = formData.get('laporanId');

    if (!file || !laporanId) {
      return NextResponse.json(
        { error: 'File dan Laporan ID wajib diisi' },
        { status: 400 }
      );
    }

    // 🔥 CEK: petugas ditugaskan ke laporan ini?
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

    // 🔥 CEK: laporan ada?
    const laporan = await prisma.laporanSampah.findUnique({
      where: { id: laporanId }
    });

    if (!laporan) {
      return NextResponse.json(
        { error: 'Laporan tidak ditemukan' },
        { status: 404 }
      );
    }

    // Validasi file
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Format file tidak didukung' },
        { status: 400 }
      );
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Ukuran file maksimal 5MB' },
        { status: 400 }
      );
    }

    // 🔥 CEK: apakah sudah ada pengangkutan?
    let pengangkutan = await prisma.pengangkutan.findUnique({
      where: { laporanId }
    });

    // Kalo belum ada, BUAT!
    if (!pengangkutan) {
      pengangkutan = await prisma.pengangkutan.create({
        data: {
          laporanId,
          petugasId: user.id,
          status: 'SUDAH_DIANGKUT',
          tanggalPengangkutan: new Date()
        }
      });
    }

    // Simpan file
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

    // 🔥 SIMPAN KE FOTO PENGANGKUTAN (BUKAN FOTO LAPORAN!)
    const existingFoto = await prisma.fotoPengangkutan.findUnique({
      where: { pengangkutanId: pengangkutan.id }
    });

    let fotoPengangkutan;
    if (existingFoto) {
      // Update kalo udah ada
      fotoPengangkutan = await prisma.fotoPengangkutan.update({
        where: { pengangkutanId: pengangkutan.id },
        data: { imageUrl }
      });
    } else {
      // Buat baru kalo belum ada
      fotoPengangkutan = await prisma.fotoPengangkutan.create({
        data: {
          imageUrl,
          pengangkutanId: pengangkutan.id
        }
      });
    }

    // 🔥 UPDATE STATUS LAPORAN JADI SELESAI
    await prisma.laporanSampah.update({
      where: { id: laporanId },
      data: { status: 'SELESAI' }
    });

    // Update status pengangkutan
    await prisma.pengangkutan.update({
      where: { id: pengangkutan.id },
      data: { status: 'SUDAH_DIANGKUT' }
    });

    return NextResponse.json({
      message: '✅ Foto hasil angkut berhasil diupload!',
      data: fotoPengangkutan,
    });

  } catch (error) {
    console.error('Upload foto pengangkutan error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan: ' + error.message },
      { status: 500 }
    );
  }
}
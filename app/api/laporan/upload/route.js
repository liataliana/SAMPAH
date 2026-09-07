// app/api/laporan/upload/route.js
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(request) {
  try {
    // 🔥 UBAH: izinkan USER dan PETUGAS
    const user = await requireAuth(null);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Cek role: hanya USER atau PETUGAS yang boleh upload
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

    // 🔥 CEK: apakah petugas ini ditugaskan ke laporan tersebut?
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

    // 🔥 CEK: untuk USER, cek apakah laporan miliknya
    if (user.role === 'USER') {
      const laporan = await prisma.laporanSampah.findUnique({
        where: { id: laporanId }
      });

      if (!laporan || laporan.userId !== user.id) {
        return NextResponse.json(
          { error: 'Laporan bukan milik Anda' },
          { status: 403 }
        );
      }
    }

    // Validasi tipe file
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Format file tidak didukung. Gunakan JPG, PNG, atau WEBP' },
        { status: 400 }
      );
    }

    // Validasi ukuran file (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Ukuran file maksimal 5MB' },
        { status: 400 }
      );
    }

    // Generate nama file unik
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const ext = path.extname(file.name);
    const fileName = `${timestamp}-${randomString}${ext}`;
    const uploadDir = path.join(process.cwd(), 'public/uploads/laporan');
    const filePath = path.join(uploadDir, fileName);

    // Buat direktori jika belum ada
    await mkdir(uploadDir, { recursive: true });

    // Simpan file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    const imageUrl = `/uploads/laporan/${fileName}`;

    // 🔥 UPDATE: cek apakah sudah ada foto, kalo ada update, kalo gak ada create
    const existingFoto = await prisma.fotoLaporan.findUnique({
      where: { laporanId }
    });

    let fotoLaporan;
    if (existingFoto) {
      // Update foto yang ada
      fotoLaporan = await prisma.fotoLaporan.update({
        where: { laporanId },
        data: { imageUrl }
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
      { error: 'Terjadi kesalahan pada server: ' + error.message },
      { status: 500 }
    );
  }
}
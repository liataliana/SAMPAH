// app/api/upload/route.js
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
        { error: 'Hanya user atau petugas yang dapat upload file' },
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
    const uploadDir = path.join(process.cwd(), 'public/uploads/temp');
    const filePath = path.join(uploadDir, fileName);

    // Buat direktori jika belum ada
    await mkdir(uploadDir, { recursive: true });

    // Simpan file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    const filePathPublic = `/uploads/temp/${fileName}`;

    return NextResponse.json({
      message: 'Upload berhasil',
      filePath: filePathPublic,
      fileName: fileName,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server: ' + error.message },
      { status: 500 }
    );
  }
}
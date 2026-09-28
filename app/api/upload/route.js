import { put } from '@vercel/blob';
import { requireAuth } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const user = await requireAuth(null);

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Hanya USER dan PETUGAS yang boleh upload
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
    const validTypes = [
      'image/jpeg',
      'image/png',
      'image/jpg',
      'image/webp'
    ];

    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Format file tidak didukung. Gunakan JPG, PNG, atau WEBP' },
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

    // Upload ke Vercel Blob
    const blob = await put(
      `laporan/${Date.now()}-${file.name}`,
      file,
      {
        access: 'public',
        addRandomSuffix: true,
      }
    );

    return NextResponse.json({
      message: 'Upload berhasil',
      filePath: blob.url,
      fileName: blob.pathname,
    });

  } catch (error) {
    console.error('Upload error:', error);

    return NextResponse.json(
      {
        error: 'Terjadi kesalahan pada server: ' + error.message
      },
      { status: 500 }
    );
  }
}
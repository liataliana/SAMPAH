// app/api/admin/barang/[id]/route.js
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { put, del } from '@vercel/blob';

// 🔥 GET BARANG BY ID
export async function GET(request, { params }) {
  try {
    const user = await requireAuth('ADMIN');

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    const barang = await prisma.barang.findUnique({
      where: { id }
    });

    if (!barang) {
      return NextResponse.json(
        { error: 'Barang tidak ditemukan' },
        { status: 404 }
      );
    }

    return NextResponse.json(barang);
  } catch (error) {
    console.error('Get barang detail error:', error);

    return NextResponse.json(
      { error: 'Terjadi kesalahan' },
      { status: 500 }
    );
  }
}

// 🔥 UPDATE BARANG
export async function PUT(request, { params }) {
  try {
    const user = await requireAuth('ADMIN');

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    const formData = await request.formData();

    const nama = formData.get('nama');
    const deskripsi = formData.get('deskripsi');
    const hargaPoin = parseInt(formData.get('hargaPoin'));
    const stok = parseInt(formData.get('stok'));
    const file = formData.get('image');

    const existing = await prisma.barang.findUnique({
      where: { id }
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Barang tidak ditemukan' },
        { status: 404 }
      );
    }

    let imageUrl = existing.imageUrl;

    // Upload gambar baru kalau ada
    if (file && file.size > 0) {
      // Validasi tipe file
      const validTypes = [
        'image/jpeg',
        'image/png',
        'image/jpg',
        'image/webp'
      ];

      if (!validTypes.includes(file.type)) {
        return NextResponse.json(
          { error: 'Format file tidak didukung' },
          { status: 400 }
        );
      }

      // Validasi ukuran file maksimal 2MB
      if (file.size > 2 * 1024 * 1024) {
        return NextResponse.json(
          { error: 'Ukuran file maksimal 2MB' },
          { status: 400 }
        );
      }

      // Hapus gambar lama dari Vercel Blob
      if (existing.imageUrl) {
        try {
          await del(existing.imageUrl);
        } catch (e) {
          console.error(
            'Gagal menghapus gambar lama dari Blob:',
            e
          );
        }
      }

      // Upload gambar baru ke Vercel Blob Private
      const blob = await put(
        `barang/${Date.now()}-${file.name}`,
        file,
        {
          access: 'public',
        storeId: process.env.ygbru_STORE_ID,
        }
      );

      imageUrl = blob.url;
    }

    // Update data barang
    const barang = await prisma.barang.update({
      where: { id },
      data: {
        nama: nama || existing.nama,
        deskripsi:
          deskripsi !== null
            ? deskripsi
            : existing.deskripsi,
        hargaPoin:
          hargaPoin || existing.hargaPoin,
        stok:
          stok !== null
            ? stok
            : existing.stok,
        imageUrl
      }
    });

    return NextResponse.json({
      message: 'Barang berhasil diupdate!',
      data: barang
    });

  } catch (error) {
    console.error('Update barang error:', error);

    return NextResponse.json(
      { error: 'Terjadi kesalahan: ' + error.message },
      { status: 500 }
    );
  }
}

// 🔥 DELETE BARANG
export async function DELETE(request, { params }) {
  try {
    const user = await requireAuth('ADMIN');

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    const existing = await prisma.barang.findUnique({
      where: { id }
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Barang tidak ditemukan' },
        { status: 404 }
      );
    }

    // Hapus gambar dari Vercel Blob
    if (existing.imageUrl) {
      try {
        await del(existing.imageUrl);
      } catch (e) {
        console.error(
          'Gagal menghapus gambar dari Blob:',
          e
        );
      }
    }

    // Hapus data barang dari database
    await prisma.barang.delete({
      where: { id }
    });

    return NextResponse.json({
      message: 'Barang berhasil dihapus!'
    });

  } catch (error) {
    console.error('Delete barang error:', error);

    return NextResponse.json(
      { error: 'Terjadi kesalahan: ' + error.message },
      { status: 500 }
    );
  }
}
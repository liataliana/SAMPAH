// app/api/admin/petugas/[id]/route.js
import { prisma } from '@/lib/prisma';
import { requireAuth, hashPassword } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function PUT(request, { params }) {
  try {
    const user = await requireAuth('ADMIN');
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = params;
    const { nama, email, password, noHp } = await request.json();

    if (!nama || !email || !noHp) {
      return NextResponse.json(
        { error: 'Nama, email, dan nomor HP wajib diisi' },
        { status: 400 }
      );
    }

    // Cek apakah data exists
    const existing = await prisma.user.findUnique({
      where: { id },
    });

    if (!existing || existing.role !== 'PETUGAS') {
      return NextResponse.json(
        { error: 'Petugas tidak ditemukan' },
        { status: 404 }
      );
    }

    // Cek duplikat email
    const duplicateEmail = await prisma.user.findFirst({
      where: {
        email,
        id: { not: id },
      },
    });

    if (duplicateEmail) {
      return NextResponse.json(
        { error: 'Email sudah digunakan' },
        { status: 400 }
      );
    }

    // Cek duplikat noHp
    const duplicateNoHp = await prisma.user.findFirst({
      where: {
        noHp,
        id: { not: id },
      },
    });

    if (duplicateNoHp) {
      return NextResponse.json(
        { error: 'Nomor HP sudah digunakan' },
        { status: 400 }
      );
    }

    const updateData = {
      nama,
      email,
      noHp,
    };

    // Update password jika diisi
    if (password && password.length >= 6) {
      updateData.password = await hashPassword(password);
    }

    const petugas = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        nama: true,
        email: true,
        noHp: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      message: 'Petugas berhasil diupdate',
      data: petugas,
    });
  } catch (error) {
    console.error('Update petugas error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const user = await requireAuth('ADMIN');
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = params;

    // Cek apakah petugas sedang bertugas
    const hasTugas = await prisma.pengangkutan.findFirst({
      where: {
        petugasId: id,
        status: {
          in: ['BELUM_DIANGKUT', 'SEDANG_DIANGKUT'],
        },
      },
    });

    if (hasTugas) {
      return NextResponse.json(
        { error: 'Petugas masih memiliki tugas aktif, tidak dapat dihapus' },
        { status: 400 }
      );
    }

    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({
      message: 'Petugas berhasil dihapus',
    });
  } catch (error) {
    console.error('Delete petugas error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}
// app/api/admin/petugas/route.js
import { prisma } from '@/lib/prisma';
import { requireAuth, hashPassword } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const user = await requireAuth('ADMIN');
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const petugas = await prisma.user.findMany({
      where: {
        role: 'PETUGAS',
      },
      select: {
        id: true,
        nama: true,
        email: true,
        noHp: true,
        role: true,
        createdAt: true,
      },
      orderBy: {
        nama: 'asc',
      },
    });

    return NextResponse.json(petugas);
  } catch (error) {
    console.error('Get petugas error:', error);
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

    const { nama, email, password, noHp } = await request.json();

    // Validasi
    if (!nama || !email || !password || !noHp) {
      return NextResponse.json(
        { error: 'Semua field wajib diisi' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password minimal 6 karakter' },
        { status: 400 }
      );
    }

    // Cek email sudah terdaftar
    const existingEmail = await prisma.user.findUnique({
      where: { email },
    });

    if (existingEmail) {
      return NextResponse.json(
        { error: 'Email sudah terdaftar' },
        { status: 400 }
      );
    }

    // Cek noHp sudah terdaftar
    const existingNoHp = await prisma.user.findUnique({
      where: { noHp },
    });

    if (existingNoHp) {
      return NextResponse.json(
        { error: 'Nomor HP sudah terdaftar' },
        { status: 400 }
      );
    }

    const hashedPassword = await hashPassword(password);

    const petugas = await prisma.user.create({
      data: {
        nama,
        email,
        password: hashedPassword,
        noHp,
        role: 'PETUGAS',
        sekolahId: null,
      },
      select: {
        id: true,
        nama: true,
        email: true,
        noHp: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      {
        message: 'Petugas berhasil ditambahkan',
        data: petugas,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create petugas error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}
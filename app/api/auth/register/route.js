// app/api/auth/register/route.js
import { prisma } from '../../../../lib/prisma';
import { hashPassword } from '../../../../lib/auth';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { nama, email, password, noHp, sekolahId } = await request.json();

    // Validasi input
    if (!nama || !email || !password || !noHp || !sekolahId) {
      return NextResponse.json(
        { error: 'Semua field wajib diisi' },
        { status: 400 }
      );
    }

    // Validasi email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Format email tidak valid' },
        { status: 400 }
      );
    }

    // Validasi password minimal 6 karakter
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password minimal 6 karakter' },
        { status: 400 }
      );
    }

    // Cek apakah sekolah sudah memiliki user
    const existingSchoolUser = await prisma.user.findUnique({
      where: { sekolahId },
    });

    if (existingSchoolUser) {
      return NextResponse.json(
        { error: 'Sekolah ini sudah memiliki akun' },
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

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Buat user baru
    const user = await prisma.user.create({
      data: {
        nama,
        email,
        password: hashedPassword,
        noHp,
        sekolahId,
        role: 'USER',
      },
      include: {
        sekolah: {
          include: {
            kota: true,
          },
        },
      },
    });

    // Return user data tanpa password
    const { password: _, ...userData } = user;

    return NextResponse.json(
      {
        message: 'Registrasi berhasil',
        user: userData,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}
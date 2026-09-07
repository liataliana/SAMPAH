// app/api/auth/login/route.js
import { prisma } from '../../../../lib/prisma';
import { verifyPassword, generateToken } from '../../../../lib/auth';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    // Validasi input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email dan password wajib diisi' },
        { status: 400 }
      );
    }

    // Cari user
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        sekolah: {
          include: {
            kota: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Email atau password salah' },
        { status: 401 }
      );
    }

    // Verifikasi password
    const isValid = await verifyPassword(password, user.password);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Email atau password salah' },
        { status: 401 }
      );
    }

    // Generate token
    const token = generateToken(user);

   // Set cookie
    const cookieStore = await cookies();

    cookieStore.set('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60,
        path: '/',
        });

    // Return user data tanpa password
    const { password: _, ...userData } = user;

    return NextResponse.json({
      message: 'Login berhasil',
      user: userData,
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}
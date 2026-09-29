// app/api/auth/login/route.js

import { prisma } from '../../../../lib/prisma';
import {
  verifyPassword,
  generateToken,
} from '../../../../lib/auth';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        {
          error: 'Email dan password wajib diisi',
        },
        {
          status: 400,
        }
      );
    }

    const user = await prisma.user.findUnique({
      where: {
        email,
      },
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
        {
          error: 'Email atau password salah',
        },
        {
          status: 401,
        }
      );
    }

    const isValid = await verifyPassword(
      password,
      user.password
    );

    if (!isValid) {
      return NextResponse.json(
        {
          error: 'Email atau password salah',
        },
        {
          status: 401,
        }
      );
    }

    const token = generateToken(user);

    const { password: _, ...userData } = user;

    const response = NextResponse.json({
      message: 'Login berhasil',
      user: userData,
    });

    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    console.log('LOGIN BERHASIL');
    console.log('Email:', user.email);
    console.log('Role:', user.role);
    console.log('Cookie token berhasil dibuat');

    return response;
  } catch (error) {
    console.error('Login error:', error);

    return NextResponse.json(
      {
        error: 'Terjadi kesalahan pada server',
      },
      {
        status: 500,
      }
    );
  }
}
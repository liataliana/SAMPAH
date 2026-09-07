// app/api/admin/jenis-sampah/route.js
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
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

    const jenisSampah = await prisma.jenisSampah.findMany({
      orderBy: {
        namaJenis: 'asc',
      },
    });

    return NextResponse.json(jenisSampah);
  } catch (error) {
    console.error('Get jenis sampah error:', error);
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

    const { namaJenis } = await request.json();

    if (!namaJenis || namaJenis.trim() === '') {
      return NextResponse.json(
        { error: 'Nama jenis sampah wajib diisi' },
        { status: 400 }
      );
    }

    // Cek duplikat
    const existing = await prisma.jenisSampah.findUnique({
      where: { namaJenis },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Nama jenis sampah sudah ada' },
        { status: 400 }
      );
    }

    const jenisSampah = await prisma.jenisSampah.create({
      data: {
        namaJenis: namaJenis.trim(),
      },
    });

    return NextResponse.json(
      {
        message: 'Jenis sampah berhasil ditambahkan',
        data: jenisSampah,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create jenis sampah error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}
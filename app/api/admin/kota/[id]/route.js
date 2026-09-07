    // app/api/admin/kota/[id]/route.js
    import { prisma } from '@/lib/prisma';
    import { requireAuth } from '@/lib/auth';
    import { NextResponse } from 'next/server';

    export async function PUT(request, context) {
    try {
        const user = await requireAuth('ADMIN');
        if (!user) {
        return NextResponse.json(
            { error: 'Unauthorized' },
            { status: 401 }
        );
        }

        const { id } = await context.params;
        const { namaKota } = await request.json();

        if (!namaKota || namaKota.trim() === '') {
        return NextResponse.json(
            { error: 'Nama kota wajib diisi' },
            { status: 400 }
        );
        }

        // Cek apakah data exists
        const existing = await prisma.kota.findUnique({
        where: { id },
        });

        if (!existing) {
        return NextResponse.json(
            { error: 'Kota tidak ditemukan' },
            { status: 404 }
        );
        }

        // Cek duplikat nama
        const duplicate = await prisma.kota.findFirst({
        where: {
            namaKota,
            id: { not: id },
        },
        });

        if (duplicate) {
        return NextResponse.json(
            { error: 'Nama kota sudah digunakan' },
            { status: 400 }
        );
        }

        const kota = await prisma.kota.update({
        where: { id },
        data: {
            namaKota: namaKota.trim(),
        },
        });

        return NextResponse.json({
        message: 'Kota berhasil diupdate',
        data: kota,
        });
    } catch (error) {
        console.error('Update kota error:', error);
        return NextResponse.json(
        { error: 'Terjadi kesalahan pada server' },
        { status: 500 }
        );
    }
    }

    export async function DELETE(request, context) {
    try {
        const user = await requireAuth('ADMIN');
        if (!user) {
        return NextResponse.json(
            { error: 'Unauthorized' },
            { status: 401 }
        );
        }

        const { id } = await context.params;

        // Cek apakah masih ada sekolah yang menggunakan kota ini
        const usedInSekolah = await prisma.sekolah.findFirst({
        where: { kotaId: id },
        });

        if (usedInSekolah) {
        return NextResponse.json(
            { error: 'Kota masih memiliki sekolah, tidak dapat dihapus' },
            { status: 400 }
        );
        }

        await prisma.kota.delete({
        where: { id },
        });

        return NextResponse.json({
        message: 'Kota berhasil dihapus',
        });
    } catch (error) {
        console.error('Delete kota error:', error);
        return NextResponse.json(
        { error: 'Terjadi kesalahan pada server' },
        { status: 500 }
        );
    }
    }
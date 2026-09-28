import { get } from '@vercel/blob';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');

    if (!url) {
      return NextResponse.json(
        { error: 'URL blob wajib diisi' },
        { status: 400 }
      );
    }

    const blob = await get(url, {
      access: 'private',
    });

    if (!blob) {
      return NextResponse.json(
        { error: 'File tidak ditemukan' },
        { status: 404 }
      );
    }

    return new Response(blob.stream, {
      headers: {
        'Content-Type': blob.contentType || 'application/octet-stream',
        'Cache-Control': 'private, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Blob access error:', error);

    return NextResponse.json(
      {
        error: 'Gagal mengambil file: ' + error.message,
      },
      { status: 500 }
    );
  }
}
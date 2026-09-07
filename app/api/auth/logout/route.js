// app/api/auth/logout/route.js
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST() {
  cookies().delete('token');
  return NextResponse.json({ message: 'Logout berhasil' });
}
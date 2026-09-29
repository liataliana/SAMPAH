// lib/auth.js

import { prisma } from './prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function hashPassword(password) {
  return await bcrypt.hash(password, 10);
}

export async function verifyPassword(password, hashedPassword) {
  return await bcrypt.compare(password, hashedPassword);
}

export function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      nama: user.nama,
    },
    JWT_SECRET,
    {
      expiresIn: '7d',
    }
  );
}

export function verifyToken(token) {
  try {
    if (!token) {
      return null;
    }

    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    console.error('JWT verify error:', error.message);
    return null;
  }
}

export async function getCurrentUser() {
  try {
    const cookieStore = await cookies();

    const token = cookieStore.get('token')?.value;

    console.log('===== GET CURRENT USER =====');
    console.log('Token ada:', !!token);

    if (!token) {
      console.log('Token tidak ditemukan');
      return null;
    }

    const decoded = verifyToken(token);

    console.log('Token valid:', !!decoded);

    if (!decoded) {
      console.log('Token tidak valid');
      return null;
    }

    console.log('User ID:', decoded.id);
    console.log('Role:', decoded.role);

    const user = await prisma.user.findUnique({
      where: {
        id: decoded.id,
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
      console.log('User tidak ditemukan di database');
      return null;
    }

    console.log('User ditemukan:', user.email);
    console.log('Role user:', user.role);
    console.log('============================');

    return user;
  } catch (error) {
    console.error('Get current user error:', error);
    return null;
  }
}

export async function requireAuth(role = null) {
  const user = await getCurrentUser();

  if (!user) {
    console.log('requireAuth gagal: user tidak login');
    return null;
  }

  if (role && user.role !== role) {
    console.log('requireAuth gagal: role tidak sesuai');
    console.log('Role yang dibutuhkan:', role);
    console.log('Role user:', user.role);

    return null;
  }

  console.log('requireAuth berhasil:', user.email);

  return user;
}

export function requireRole(allowedRoles) {
  return async function (req, res, next) {
    const user = await getCurrentUser();

    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized',
      });
    }

    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({
        error: 'Forbidden',
      });
    }

    req.user = user;

    return next();
  };
}
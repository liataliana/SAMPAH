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
    { expiresIn: '7d' }
  );
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

export async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    console.log("TOKEN:", token);

    if (!token) return null;

    const decoded = verifyToken(token);

    console.log("DECODED:", decoded);

    if (!decoded) return null;

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: {
        sekolah: {
          include: {
            kota: true,
          },
        },
      },
    });

    console.log("USER:", user);

    return user;
  } catch (error) {
    console.error("Get current user error:", error);
    return null;
  }
}
export async function requireAuth(role = null) {
  const user = await getCurrentUser();
  if (!user) return null;
  
  if (role && user.role !== role) {
    // Jika role yang dibutuhkan adalah ADMIN tapi user bukan ADMIN
    if (role === 'ADMIN' && user.role !== 'ADMIN') return null;
    // Jika role yang dibutuhkan adalah PETUGAS
    if (role === 'PETUGAS' && user.role !== 'PETUGAS') return null;
    // Jika role yang dibutuhkan adalah USER
    if (role === 'USER' && user.role !== 'USER') return null;
  }
  
  return user;
}

export function requireRole(allowedRoles) {
  return async function (req, res, next) {
    const user = await getCurrentUser();
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    req.user = user;
    return next();
  };
}
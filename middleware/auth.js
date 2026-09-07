const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding...');

  // 1. Buat Admin
  const adminPassword = await bcrypt.hash('admin123', 10);
  await prisma.user.upsert({
    where: { email: 'admin@school.com' },
    update: {},
    create: {
      nama: 'Super Admin',
      email: 'admin@school.com',
      password: adminPassword,
      noHp: '081234567890',
      role: 'ADMIN',
    },
  });

  // 2. Buat Kota
  const jakarta = await prisma.kota.upsert({
    where: { namaKota: 'Jakarta' },
    update: {},
    create: { namaKota: 'Jakarta' },
  });

  // 3. Buat Sekolah
  const sekolah = await prisma.sekolah.upsert({
    where: { namaSekolah: 'SMKN 21 Jakarta' },
    update: {},
    create: {
      namaSekolah: 'SMKN 21 Jakarta',
      alamat: 'Jl. Pendidikan No. 123',
      kotaId: jakarta.id,
    },
  });

  // 4. Buat User (perwakilan sekolah)
  const userPassword = await bcrypt.hash('user123', 10);
  const user = await prisma.user.upsert({
    where: { email: 'user@school.com' },
    update: {},
    create: {
      nama: 'Budi Santoso',
      email: 'user@school.com',
      password: userPassword,
      noHp: '081234567891',
      role: 'USER',
      sekolahId: sekolah.id,
    },
  });

  // 5. Buat Petugas
  const petugasPassword = await bcrypt.hash('petugas123', 10);
  await prisma.user.upsert({
    where: { email: 'petugas@school.com' },
    update: {},
    create: {
      nama: 'Caci',
      email: 'petugas@school.com',
      password: petugasPassword,
      noHp: '081234567892',
      role: 'PETUGAS',
    },
  });

  // 6. Buat Jenis Sampah
  const organik = await prisma.jenisSampah.upsert({
    where: { namaJenis: 'Organik' },
    update: {},
    create: { namaJenis: 'Organik' },
  });

  // 7. Buat Laporan Sampel
  const laporan = await prisma.laporanSampah.create({
    data: {
      userId: user.id,
      sekolahId: sekolah.id,
      jenisSampahId: organik.id,
      berat: 10,
      status: 'SELESAI',
    },
  });

  // 8. Buat Foto Laporan
  await prisma.fotoLaporan.create({
    data: {
      imageUrl: '/uploads/sample.jpg',
      laporanId: laporan.id,
    },
  });

  // 9. Buat Ecopoint untuk user
  await prisma.ecopoint.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      totalPoin: 10,
      poinTerpakai: 0,
    },
  });

  console.log('✅ Seeding selesai!');
  console.log('📝 Akun yang tersedia:');
  console.log('  Admin   : admin@school.com / admin123');
  console.log('  User    : user@school.com / user123');
  console.log('  Petugas : petugas@school.com / petugas123');
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
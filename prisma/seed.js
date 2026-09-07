// prisma/seed.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ============================
  // 1. SUPER ADMIN
  // ============================
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'superadmin@schoolwaste.com' },
    update: {},
    create: {
      nama: 'Super Admin',
      email: 'superadmin@schoolwaste.com',
      password: adminPassword,
      noHp: '081234567890',
      role: 'ADMIN',
    },
  });
  console.log('✅ Super Admin created:', admin.email);

  // ============================
  // 2. PETUGAS
  // ============================
  const petugasPassword = await bcrypt.hash('petugas123', 10);
  const petugas = await prisma.user.upsert({
    where: { email: 'petugas@school.com' },
    update: {},
    create: {
      nama: 'Caci Petugas',
      email: 'petugas@school.com',
      password: petugasPassword,
      noHp: '081234567891',
      role: 'PETUGAS',
    },
  });
  console.log('✅ Petugas created:', petugas.email);

  // ============================
  // 3. KOTA
  // ============================
  const jakarta = await prisma.kota.upsert({
    where: { namaKota: 'Jakarta' },
    update: {},
    create: { namaKota: 'Jakarta' },
  });
  console.log('✅ Kota created:', jakarta.namaKota);

  // ============================
  // 4. SEKOLAH
  // ============================
  const sekolah = await prisma.sekolah.upsert({
    where: { namaSekolah: 'SMKN 21 Jakarta' },
    update: {},
    create: {
      namaSekolah: 'SMKN 21 Jakarta',
      alamat: 'Jl. Pendidikan No. 123, Jakarta',
      kotaId: jakarta.id,
    },
  });
  console.log('✅ Sekolah created:', sekolah.namaSekolah);

  // ============================
  // 5. USER (Perwakilan Sekolah)
  // ============================
  const userPassword = await bcrypt.hash('user123', 10);
  const user = await prisma.user.upsert({
    where: { email: 'user@school.com' },
    update: {},
    create: {
      nama: 'Budi Santoso',
      email: 'user@school.com',
      password: userPassword,
      noHp: '081234567892',
      role: 'USER',
      sekolahId: sekolah.id,
    },
  });
  console.log('✅ User created:', user.email);

  // ============================
  // 6. JENIS SAMPAH + poinPerKg
  // ============================
  const jenisSampahData = [
    { namaJenis: 'Organik', poinPerKg: 1 },
    { namaJenis: 'Anorganik', poinPerKg: 1 },
    { namaJenis: 'Plastik', poinPerKg: 1 },
    { namaJenis: 'Kertas', poinPerKg: 1 },
    { namaJenis: 'B3', poinPerKg: 3 },
    { namaJenis: 'Baterai', poinPerKg: 3 },
    { namaJenis: 'Logam', poinPerKg: 2 },
  ];

  for (const jenis of jenisSampahData) {
    await prisma.jenisSampah.upsert({
      where: { namaJenis: jenis.namaJenis },
      update: { poinPerKg: jenis.poinPerKg },
      create: jenis,
    });
  }
  console.log('✅ Jenis Sampah created');

  // ============================
  // 7. LAPORAN SAMPEL
  // ============================
  const organik = await prisma.jenisSampah.findUnique({
    where: { namaJenis: 'Organik' },
  });

  if (organik) {
    const laporan = await prisma.laporanSampah.create({
      data: {
        userId: user.id,
        sekolahId: sekolah.id,
        jenisSampahId: organik.id,
        berat: 10,
        status: 'MENUNGGU',
      },
    });
    console.log('✅ Laporan created:', laporan.id);

    await prisma.fotoLaporan.create({
      data: {
        imageUrl: '/uploads/sample.jpg',
        laporanId: laporan.id,
      },
    });
    console.log('✅ Foto laporan created');
  }

  // ============================
  // 8. ECOPOINT BUAT USER
  // ============================
  await prisma.ecopoint.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      totalPoin: 10,
      poinTerpakai: 0,
    },
  });
  console.log('✅ Ecopoint created');

  // ============================
  // 9. 🔥 BARANG MARKETPLACE
  // ============================
  const barangData = [
    { nama: 'Pulsa 10.000', hargaPoin: 100, stok: 10 },
    { nama: 'Voucher GoFood 20.000', hargaPoin: 200, stok: 5 },
    { nama: 'E-Wallet 50.000', hargaPoin: 500, stok: 3 },
    { nama: 'T-Shirt Eco', hargaPoin: 150, stok: 7 },
    { nama: 'Tumbler Stainless', hargaPoin: 300, stok: 4 },
  ];

  for (const barang of barangData) {
    await prisma.barang.upsert({
      where: { nama: barang.nama },
      update: {
        hargaPoin: barang.hargaPoin,
        stok: barang.stok,
      },
      create: {
        nama: barang.nama,
        hargaPoin: barang.hargaPoin,
        stok: barang.stok,
        deskripsi: `Tukarkan ${barang.nama} dengan poinmu!`,
      },
    });
  }
  console.log('✅ Barang marketplace created');

  // ============================
  // 10. INFO AKUN
  // ============================
  console.log('\n📝 AKUN YANG TERSEDIA:');
  console.log('  🔵 Super Admin : superadmin@schoolwaste.com / admin123');
  console.log('  🟢 User        : user@school.com / user123');
  console.log('  🟡 Petugas     : petugas@school.com / petugas123');
  console.log('\n🎉 Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
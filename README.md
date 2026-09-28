# ♻️ School Waste Management

**School Waste Management** adalah aplikasi berbasis web yang dibuat untuk membantu pengelolaan sampah di lingkungan sekolah. Aplikasi ini menyediakan fitur pelaporan sampah, pengelolaan laporan oleh petugas, sistem Ecopoint, serta marketplace untuk penukaran poin.

## 🌐 Live Preview

[**🔗 Buka Website School Waste Management**](https://sampah-nv62.vercel.app/login)

> **Live Website:** https://sampah-nv62.vercel.app/

---

## 🛠️ Teknologi yang Digunakan

- **Next.js** — Framework untuk pengembangan aplikasi web
- **JavaScript** — Bahasa pemrograman
- **Prisma ORM** — Pengelolaan dan akses database
- **PostgreSQL** — Database
- **Vercel** — Deployment aplikasi

---

## 👥 Role Pengguna

Aplikasi memiliki beberapa role pengguna dengan hak akses yang berbeda.

### 🔵 Super Admin

Super Admin memiliki akses untuk mengelola data utama dalam sistem, seperti:

- Mengelola data pengguna
- Mengelola data sekolah
- Mengelola data kota
- Mengelola jenis sampah
- Mengelola data barang marketplace
- Mengelola Ecopoint
- Melihat dan mengelola data laporan

### 🟡 Petugas

Petugas bertugas menangani laporan sampah yang masuk, seperti:

- Melihat laporan sampah
- Melihat detail laporan
- Menangani proses pengangkutan sampah
- Mengubah status laporan
- Menyelesaikan laporan sampah

### 🟢 User

User dapat menggunakan fitur aplikasi untuk:

- Membuat laporan sampah
- Mengunggah foto laporan
- Melihat status laporan
- Melihat riwayat laporan
- Melihat jumlah Ecopoint
- Melihat marketplace
- Menukarkan poin dengan barang yang tersedia

---

## ♻️ Fitur Utama

### 1. Login dan Registrasi

Pengguna dapat masuk ke dalam sistem menggunakan akun yang telah terdaftar sesuai dengan role masing-masing.

### 2. Pelaporan Sampah

User dapat membuat laporan sampah dengan memberikan informasi mengenai sampah yang ditemukan serta mengunggah foto sebagai bukti laporan.

### 3. Pengelolaan Laporan

Petugas dapat melihat laporan yang masuk dan menangani laporan tersebut hingga proses selesai.

### 4. Ecopoint

User dapat memperoleh poin dari aktivitas pengelolaan sampah yang dilakukan melalui sistem.

### 5. Marketplace

Poin yang dimiliki user dapat digunakan untuk melakukan penukaran barang yang tersedia pada marketplace.

### 6. Pengelolaan Data

Super Admin dapat melakukan pengelolaan berbagai data yang digunakan dalam sistem melalui dashboard admin.

---

## 🗄️ Database

Aplikasi menggunakan:

- **PostgreSQL** sebagai database
- **Prisma ORM** sebagai penghubung dan pengelola database

Database digunakan untuk menyimpan berbagai data aplikasi, seperti:

- User
- Sekolah
- Kota
- Jenis Sampah
- Laporan Sampah
- Foto Laporan
- Petugas
- Pengangkutan
- Ecopoint
- Barang Marketplace
- Transaksi Poin

---

## 🚀 Deployment

Aplikasi telah di-deploy menggunakan **Vercel**.

### Live Website

🔗 [**https://sampah-nv62.vercel.app/**](https://sampah-nv62.vercel.app/login)

### Repository GitHub

🔗 [**GitHub Repository — SAMPAH**](https://github.com/liataliana/SAMPAH)

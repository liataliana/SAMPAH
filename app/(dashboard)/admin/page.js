// app/(dashboard)/admin/page.js
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState({
    totalLaporan: 0,
    totalSekolah: 0,
    totalKota: 0,
    totalPetugas: 0,
    laporanMenunggu: 0,
    laporanDiproses: 0,
    laporanSelesai: 0,
  });
  const [laporanTerbaru, setLaporanTerbaru] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch laporan untuk statistik
      const laporanRes = await fetch('/api/laporan');
      const laporanData = await laporanRes.json();

      if (Array.isArray(laporanData)) {
        const total = laporanData.length;
        const menunggu = laporanData.filter(l => l.status === 'MENUNGGU').length;
        const diproses = laporanData.filter(l => l.status === 'DIPROSES').length;
        const selesai = laporanData.filter(l => l.status === 'SELESAI').length;

        setStats(prev => ({
          ...prev,
          totalLaporan: total,
          laporanMenunggu: menunggu,
          laporanDiproses: diproses,
          laporanSelesai: selesai,
        }));

        // Ambil 5 laporan terbaru
        setLaporanTerbaru(laporanData.slice(0, 5));
      }

      // Fetch sekolah
      const sekolahRes = await fetch('/api/admin/sekolah');
      const sekolahData = await sekolahRes.json();
      if (Array.isArray(sekolahData)) {
        setStats(prev => ({ ...prev, totalSekolah: sekolahData.length }));
      }

      // Fetch kota
      const kotaRes = await fetch('/api/admin/kota');
      const kotaData = await kotaRes.json();
      if (Array.isArray(kotaData)) {
        setStats(prev => ({ ...prev, totalKota: kotaData.length }));
      }

      // Fetch petugas
      const petugasRes = await fetch('/api/admin/petugas');
      const petugasData = await petugasRes.json();
      if (Array.isArray(petugasData)) {
        setStats(prev => ({ ...prev, totalPetugas: petugasData.length }));
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      MENUNGGU: 'bg-yellow-100 text-yellow-800',
      DIPROSES: 'bg-blue-100 text-blue-800',
      SELESAI: 'bg-green-100 text-green-800',
    };
    const labelMap = {
      MENUNGGU: 'Menunggu',
      DIPROSES: 'Diproses',
      SELESAI: 'Selesai',
    };
    return (
      <span className={`px-2 py-1 text-xs rounded-full ${statusMap[status] || 'bg-gray-100'}`}>
        {labelMap[status] || status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">Admin Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              {/* Menu Utama */}
              <Link href="/admin/laporan" className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700">
                📋 Kelola Laporan
              </Link>
              <Link href="/admin/kota" className="text-gray-700 hover:text-gray-900">Kota</Link>
              <Link href="/admin/sekolah" className="text-gray-700 hover:text-gray-900">Sekolah</Link>
              <Link href="/admin/jenis-sampah" className="text-gray-700 hover:text-gray-900">Jenis Sampah</Link>
              <Link href="/admin/petugas" className="text-gray-700 hover:text-gray-900">Petugas</Link>
              <Link href="/admin/barang" className="text-gray-700 hover:text-gray-900">🛍️Barang</Link>
              <button
                onClick={handleLogout}
                className="text-red-600 hover:text-red-800"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-500">Total Laporan</div>
            <div className="text-2xl font-bold text-gray-900">{stats.totalLaporan}</div>
          </div>
          <div className="bg-yellow-50 rounded-lg shadow p-6 border border-yellow-200">
            <div className="text-sm text-yellow-700">Menunggu</div>
            <div className="text-2xl font-bold text-yellow-800">{stats.laporanMenunggu}</div>
          </div>
          <div className="bg-blue-50 rounded-lg shadow p-6 border border-blue-200">
            <div className="text-sm text-blue-700">Diproses</div>
            <div className="text-2xl font-bold text-blue-800">{stats.laporanDiproses}</div>
          </div>
          <div className="bg-green-50 rounded-lg shadow p-6 border border-green-200">
            <div className="text-sm text-green-700">Selesai</div>
            <div className="text-2xl font-bold text-green-800">{stats.laporanSelesai}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-500">Sekolah</div>
            <div className="text-2xl font-bold text-gray-900">{stats.totalSekolah}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-500">Petugas</div>
            <div className="text-2xl font-bold text-gray-900">{stats.totalPetugas}</div>
          </div>
        </div>

        {/* Laporan Terbaru */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">Laporan Terbaru</h2>
            <Link
              href="/admin/laporan"
              className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
            >
              Lihat Semua →
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sekolah
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Jenis Sampah
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Berat (kg)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tanggal
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {laporanTerbaru.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                      Belum ada laporan
                    </td>
                  </tr>
                ) : (
                  laporanTerbaru.map((laporan) => (
                    <tr key={laporan.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {laporan.sekolah?.namaSekolah || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {laporan.jenisSampah?.namaJenis || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {laporan.berat}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(laporan.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(laporan.tanggalLapor).toLocaleDateString('id-ID')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <Link
                          href={`/admin/laporan/${laporan.id}`}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          Detail
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
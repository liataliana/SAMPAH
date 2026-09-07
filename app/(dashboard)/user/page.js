// app/(dashboard)/user/page.js
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function UserDashboard() {
  const router = useRouter();
  const [laporanList, setLaporanList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    menunggu: 0,
    diproses: 0,
    selesai: 0,
  });

  useEffect(() => {
    fetchLaporan();
  }, []);

  const fetchLaporan = async () => {
    try {
      const response = await fetch('/api/laporan');
      const data = await response.json();
      if (Array.isArray(data)) {
        setLaporanList(data);
        const total = data.length;
        const menunggu = data.filter(l => l.status === 'MENUNGGU').length;
        const diproses = data.filter(l => l.status === 'DIPROSES').length;
        const selesai = data.filter(l => l.status === 'SELESAI').length;
        setStats({ total, menunggu, diproses, selesai });
      }
    } catch (error) {
      console.error('Error fetching laporan:', error);
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
              <h1 className="text-xl font-semibold text-gray-900">User Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/user/laporan"
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
              >
                Buat Laporan
              </Link>
              
              <Link href="/user/marketplace" className="text-indigo-600 hover:text-indigo-900"> 🛍️ Marketplace</Link>

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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-500">Total Laporan</div>
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          </div>
          <div className="bg-yellow-50 rounded-lg shadow p-6 border border-yellow-200">
            <div className="text-sm text-yellow-700">Menunggu</div>
            <div className="text-2xl font-bold text-yellow-800">{stats.menunggu}</div>
          </div>
          <div className="bg-blue-50 rounded-lg shadow p-6 border border-blue-200">
            <div className="text-sm text-blue-700">Diproses</div>
            <div className="text-2xl font-bold text-blue-800">{stats.diproses}</div>
          </div>
          <div className="bg-green-50 rounded-lg shadow p-6 border border-green-200">
            <div className="text-sm text-green-700">Selesai</div>
            <div className="text-2xl font-bold text-green-800">{stats.selesai}</div>
          </div>
        </div>

        {/* Laporan Terbaru */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">Laporan Terbaru</h2>
            <Link
              href="/user/laporan"
              className="text-indigo-600 hover:text-indigo-900 text-sm"
            >
              Lihat Semua
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
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
                    Foto
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {laporanList.slice(0, 5).length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                      Belum ada laporan
                    </td>
                  </tr>
                ) : (
                  laporanList.slice(0, 5).map((laporan) => (
                    <tr key={laporan.id}>
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
                        {laporan.fotoLaporan && (
                          <a
                            href={laporan.fotoLaporan.imageUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            Lihat
                          </a>
                        )}
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
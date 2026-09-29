// app/(dashboard)/petugas/tugas/page.js
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function TugasPage() {
  const router = useRouter();
  const [tugasList, setTugasList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    fetchTugas();
  }, []);

  const fetchTugas = async () => {
    try {
      setLoading(true);
      // 🔥 PAKE /api/laporan (BUKAN /api/pengangkutan!)
      const response = await fetch('/api/laporan');
      
      if (!response.ok) {
        throw new Error('Gagal mengambil data tugas');
      }
      
      const data = await response.json();
      if (Array.isArray(data)) {
        setTugasList(data);
      }
    } catch (error) {
      console.error('Error fetching tugas:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // 🔥 CUMA BUAT MULAI PENGANGKUTAN (MENUNGGU → DIPROSES)
  const handleMulai = async (id) => {
    try {
      setError('');
      setSuccess('');
      setUpdatingId(id);

      const response = await fetch(`/api/laporan/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'DIPROSES' }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Gagal memulai pengangkutan');
      }

      setSuccess('🚚 Pengangkutan dimulai!');
      fetchTugas();
    } catch (error) {
      console.error('Error:', error);
      setError(error.message);
    } finally {
      setUpdatingId(null);
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

  const filteredTugas = filter === 'all' 
    ? tugasList 
    : tugasList.filter(t => t.status === filter);

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
              <h1 className="text-xl font-semibold text-gray-900">Daftar Tugas</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/petugas" className="text-gray-700 hover:text-gray-900">
                Dashboard
              </Link>
              <button onClick={handleLogout} className="text-red-600 hover:text-red-800">
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-4 bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded">
            ❌ {error}
          </div>
        )}
        {success && (
          <div className="mb-4 bg-green-50 border border-green-400 text-green-700 px-4 py-3 rounded">
            ✅ {success}
          </div>
        )}

        {/* Filter */}
        <div className="bg-white rounded-lg shadow p-4 mb-6 flex gap-4 items-center flex-wrap">
          <span className="text-sm font-medium text-gray-700">Filter Status:</span>
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 text-sm rounded-md ${
              filter === 'all' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            Semua ({tugasList.length})
          </button>
          <button
            onClick={() => setFilter('MENUNGGU')}
            className={`px-3 py-1 text-sm rounded-md ${
              filter === 'MENUNGGU' ? 'bg-yellow-600 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            Menunggu ({tugasList.filter(t => t.status === 'MENUNGGU').length})
          </button>
          <button
            onClick={() => setFilter('DIPROSES')}
            className={`px-3 py-1 text-sm rounded-md ${
              filter === 'DIPROSES' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            Diproses ({tugasList.filter(t => t.status === 'DIPROSES').length})
          </button>
          <button
            onClick={() => setFilter('SELESAI')}
            className={`px-3 py-1 text-sm rounded-md ${
              filter === 'SELESAI' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            Selesai ({tugasList.filter(t => t.status === 'SELESAI').length})
          </button>
        </div>

        {/* Tugas List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">No</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sekolah</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jenis Sampah</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Berat (kg)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTugas.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                      Tidak ada tugas
                    </td>
                  </tr>
                ) : (
                  filteredTugas.map((tugas, index) => (
                    <tr key={tugas.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {index + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {tugas.sekolah?.namaSekolah || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {tugas.jenisSampah?.namaJenis || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {tugas.berat || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(tugas.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                        {/* 🔥 TOMBOL MULAI (PAKE /api/laporan) */}
                        {tugas.status === 'MENUNGGU' && (
                          <button
                            onClick={() => handleMulai(tugas.id)}
                            disabled={updatingId === tugas.id}
                            className="text-yellow-600 hover:text-yellow-900 disabled:opacity-50"
                          >
                            {updatingId === tugas.id ? 'Loading...' : '🚚 Mulai'}
                          </button>
                        )}
                        
                        {/* 🔥 TOMBOL SELESAI DIHAPUS! SURUH KE DETAIL! */}
                        {tugas.status === 'DIPROSES' && (
                          <span className="text-blue-600 text-xs">
                            📸 Upload di Detail
                          </span>
                        )}
                        
                        {tugas.status === 'SELESAI' && (
                          <span className="text-green-600 text-xs">✅ Selesai</span>
                        )}
                        
                        <Link
                          href={`/petugas/tugas/${tugas.id}`}
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
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
      const response = await fetch('/api/pengangkutan');
      
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

  const handleUpdateStatus = async (id, status) => {
    try {
      setError('');
      setSuccess('');
      setUpdatingId(id);

      console.log('Updating status:', { id, status }); // Debug

      const response = await fetch(`/api/pengangkutan/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      const data = await response.json();
      console.log('Response:', data); // Debug

      if (!response.ok) {
        throw new Error(data.error || 'Gagal mengupdate status');
      }

      setSuccess('Status berhasil diupdate!');
      fetchTugas(); // Refresh data
    } catch (error) {
      console.error('Error updating status:', error);
      setError(error.message);
    } finally {
      setUpdatingId(null);
    }
  };

  // 🔥 UPLOAD FOTO + LANGSUNG SELESAIKAN LAPORAN (OTOMATIS POIN!)
const handleUploadFoto = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  try {
    setUpdating(true);
    setError('');
    setSuccess('');

    // 1. Upload foto ke pengangkutan
    const formData = new FormData();
    formData.append('file', file);
    formData.append('laporanId', laporanId);

    const uploadRes = await fetch('/api/pengangkutan/upload', {
      method: 'POST',
      body: formData,
    });

    const uploadData = await uploadRes.json();

    if (!uploadRes.ok) {
      throw new Error(uploadData.error || 'Gagal upload foto');
    }

    // 2. 🔥 LANGSUNG SELESAIKAN LAPORAN (INI YANG NGASI POIN!)
    const selesaiRes = await fetch(`/api/laporan/${laporanId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status: 'SELESAI' }),
    });

    const selesaiData = await selesaiRes.json();

    if (!selesaiRes.ok) {
      throw new Error(selesaiData.error || 'Gagal menyelesaikan laporan');
    }

    setSuccess('✅ Laporan selesai! Poin telah ditambahkan! 🎉');
    fetchDetail();
  } catch (error) {
    console.error('Error:', error);
    setError(error.message);
  } finally {
    setUpdating(false);
  }
};

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      BELUM_DIANGKUT: 'bg-gray-100 text-gray-800',
      SEDANG_DIANGKUT: 'bg-yellow-100 text-yellow-800',
      SUDAH_DIANGKUT: 'bg-green-100 text-green-800',
    };
    const labelMap = {
      BELUM_DIANGKUT: 'Belum Diangkut',
      SEDANG_DIANGKUT: 'Sedang Diangkut',
      SUDAH_DIANGKUT: 'Sudah Diangkut',
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

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl text-gray-600">Loading...</div>
        </div>
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
        {/* Error & Success Messages */}
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
              filter === 'all'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Semua ({tugasList.length})
          </button>
          <button
            onClick={() => setFilter('BELUM_DIANGKUT')}
            className={`px-3 py-1 text-sm rounded-md ${
              filter === 'BELUM_DIANGKUT'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Belum Diangkut ({tugasList.filter(t => t.status === 'BELUM_DIANGKUT').length})
          </button>
          <button
            onClick={() => setFilter('SEDANG_DIANGKUT')}
            className={`px-3 py-1 text-sm rounded-md ${
              filter === 'SEDANG_DIANGKUT'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Sedang Diangkut ({tugasList.filter(t => t.status === 'SEDANG_DIANGKUT').length})
          </button>
          <button
            onClick={() => setFilter('SUDAH_DIANGKUT')}
            className={`px-3 py-1 text-sm rounded-md ${
              filter === 'SUDAH_DIANGKUT'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Sudah Diangkut ({tugasList.filter(t => t.status === 'SUDAH_DIANGKUT').length})
          </button>
        </div>

        {/* Tugas List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    No
                  </th>
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
                    Aksi
                  </th>
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
                        {tugas.laporan?.sekolah?.namaSekolah || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {tugas.laporan?.jenisSampah?.namaJenis || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {tugas.laporan?.berat || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(tugas.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                        {tugas.status === 'BELUM_DIANGKUT' && (
                          <button
                            onClick={() => handleUpdateStatus(tugas.id, 'SEDANG_DIANGKUT')}
                            disabled={updatingId === tugas.id}
                            className="text-yellow-600 hover:text-yellow-900 disabled:opacity-50"
                          >
                            {updatingId === tugas.id ? 'Loading...' : 'Mulai'}
                          </button>
                        )}
                        {tugas.status === 'SEDANG_DIANGKUT' && (
                          <>
                            <button
                              onClick={() => handleUpdateStatus(tugas.id, 'SUDAH_DIANGKUT')}
                              disabled={updatingId === tugas.id}
                              className="text-green-600 hover:text-green-900 disabled:opacity-50"
                            >
                              {updatingId === tugas.id ? 'Loading...' : 'Selesai'}
                            </button>
                            <label className="cursor-pointer text-blue-600 hover:text-blue-900">
                              Upload Foto
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  if (e.target.files[0]) {
                                    handleUploadFoto(tugas.id, e.target.files[0]);
                                  }
                                }}
                              />
                            </label>
                          </>
                        )}
                        {tugas.status === 'SUDAH_DIANGKUT' && (
                          <span className="text-green-600">✓ Selesai</span>
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
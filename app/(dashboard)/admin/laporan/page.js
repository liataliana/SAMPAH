// app/(dashboard)/admin/laporan/page.js
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminLaporanPage() {
  const router = useRouter();
  const [laporanList, setLaporanList] = useState([]);
  const [petugasList, setPetugasList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedLaporan, setSelectedLaporan] = useState(null);
  
  // 🔥 UBAH: dari string jadi ARRAY
  const [selectedPetugas, setSelectedPetugas] = useState([]);
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [assignLoading, setAssignLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const laporanRes = await fetch('/api/laporan');
      const laporanData = await laporanRes.json();
      if (Array.isArray(laporanData)) {
        setLaporanList(laporanData);
      }

      const petugasRes = await fetch('/api/admin/petugas');
      const petugasData = await petugasRes.json();
      if (Array.isArray(petugasData)) {
        setPetugasList(petugasData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // 🔥 UBAH: pake API assign-petugas (Many-to-Many)
  const handleAssignPetugas = async () => {
    if (selectedPetugas.length === 0) {
      setError('Pilih minimal 1 petugas');
      return;
    }

    setAssignLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/admin/laporan/assign-petugas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          laporanId: selectedLaporan.id,
          petugasIds: selectedPetugas,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Gagal menugaskan petugas');
      }

      setSuccess(`${selectedPetugas.length} petugas berhasil ditugaskan!`);
      setShowAssignModal(false);
      setSelectedLaporan(null);
      setSelectedPetugas([]);
      fetchData();
    } catch (err) {
      setError(err.message);
    } finally {
      setAssignLoading(false);
    }
  };

  // 🔥 FUNGSI TOGGLE PETUGAS (checkbox)
  const togglePetugas = (petugasId) => {
    setSelectedPetugas(prev => {
      if (prev.includes(petugasId)) {
        return prev.filter(id => id !== petugasId);
      } else {
        return [...prev, petugasId];
      }
    });
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

  const filteredLaporan = filter === 'all' 
    ? laporanList 
    : laporanList.filter(l => l.status === filter);

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
              <h1 className="text-xl font-semibold text-gray-900">Kelola Laporan</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/admin" className="text-gray-700 hover:text-gray-900">
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
        {error && (
          <div className="mb-4 bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 bg-green-50 border border-green-400 text-green-700 px-4 py-3 rounded">
            {success}
          </div>
        )}

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
            Semua ({laporanList.length})
          </button>
          <button
            onClick={() => setFilter('MENUNGGU')}
            className={`px-3 py-1 text-sm rounded-md ${
              filter === 'MENUNGGU'
                ? 'bg-yellow-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Menunggu ({laporanList.filter(l => l.status === 'MENUNGGU').length})
          </button>
          <button
            onClick={() => setFilter('DIPROSES')}
            className={`px-3 py-1 text-sm rounded-md ${
              filter === 'DIPROSES'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Diproses ({laporanList.filter(l => l.status === 'DIPROSES').length})
          </button>
          <button
            onClick={() => setFilter('SELESAI')}
            className={`px-3 py-1 text-sm rounded-md ${
              filter === 'SELESAI'
                ? 'bg-green-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Selesai ({laporanList.filter(l => l.status === 'SELESAI').length})
          </button>
        </div>

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
                    User
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
                    Petugas
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredLaporan.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-6 py-4 text-center text-gray-500">
                      Tidak ada laporan
                    </td>
                  </tr>
                ) : (
                  filteredLaporan.map((laporan, index) => (
                    <tr key={laporan.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {index + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {laporan.sekolah?.namaSekolah || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {laporan.user?.nama || '-'}
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
                      {/* 🔥 UBAH: tampilin banyak petugas */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {laporan.petugasTugas && laporan.petugasTugas.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {laporan.petugasTugas.map((tugas, idx) => (
                              <span key={idx} className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs">
                                {tugas.petugas?.nama || 'Unknown'}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                        <Link
                          href={`/admin/laporan/${laporan.id}`}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          Detail
                        </Link>
                        {laporan.status === 'MENUNGGU' && (
                          <button
                            onClick={() => {
                              setSelectedLaporan(laporan);
                              setSelectedPetugas([]);
                              setShowAssignModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Tugaskan
                          </button>
                        )}
                        {laporan.status === 'DIPROSES' && (
                          <span className="text-blue-600 text-xs">
                            ⏳ Menunggu Petugas
                          </span>
                        )}
                        {laporan.status === 'SELESAI' && (
                          <span className="text-green-600 text-xs">
                            ✅ Selesai
                          </span>
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

      {/* 🔥 MODAL ASSIGN PETUGAS (UBAH JADI CHECKBOX) */}
      {showAssignModal && selectedLaporan && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 text-center">
                Tugaskan Petugas
              </h3>
              <p className="text-sm text-gray-500 text-center mt-2">
                Laporan dari: {selectedLaporan.sekolah?.namaSekolah}
              </p>
              <p className="text-xs text-green-600 text-center mt-1">
                💡 Bisa pilih lebih dari 1 petugas (Many-to-Many)
              </p>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pilih Petugas ({selectedPetugas.length} dipilih)
                </label>
                <div className="space-y-2 max-h-60 overflow-y-auto border rounded-md p-2">
                  {petugasList.map((petugas) => (
                    <label key={petugas.id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedPetugas.includes(petugas.id)}
                        onChange={() => togglePetugas(petugas.id)}
                        className="h-4 w-4 text-indigo-600 rounded"
                      />
                      <span className="text-sm text-gray-900">{petugas.nama}</span>
                      <span className="text-xs text-gray-500">({petugas.email})</span>
                    </label>
                  ))}
                  {petugasList.length === 0 && (
                    <p className="text-gray-500 text-sm text-center py-4">
                      Belum ada petugas terdaftar
                    </p>
                  )}
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={handleAssignPetugas}
                  disabled={assignLoading || selectedPetugas.length === 0}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                >
                  {assignLoading ? 'Loading...' : `Tugaskan (${selectedPetugas.length})`}
                </button>
                <button
                  onClick={() => {
                    setShowAssignModal(false);
                    setSelectedLaporan(null);
                    setSelectedPetugas([]);
                    setError('');
                  }}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
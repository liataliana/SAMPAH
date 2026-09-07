// app/(dashboard)/admin/laporan/[id]/page.js
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminLaporanDetailPage({ params }) {
  const router = useRouter();
  const [laporan, setLaporan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [petugasList, setPetugasList] = useState([]);
  
  // 🔥 UBAH: dari string jadi ARRAY
  const [selectedPetugas, setSelectedPetugas] = useState([]);
  
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [success, setSuccess] = useState('');
  const [assignLoading, setAssignLoading] = useState(false);
  const [laporanId, setLaporanId] = useState(null);

  useEffect(() => {
    async function unwrapParams() {
      try {
        const resolvedParams = await params;
        setLaporanId(resolvedParams.id);
      } catch (err) {
        console.error('Error unwrapping params:', err);
        setError('Gagal memuat parameter');
      }
    }
    unwrapParams();
  }, [params]);

  useEffect(() => {
    if (laporanId) {
      fetchDetail();
      fetchPetugas();
    }
  }, [laporanId]);

  const fetchDetail = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch(`/api/laporan/${laporanId}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Gagal mengambil data');
      }
      
      const data = await response.json();
      setLaporan(data);
    } catch (error) {
      console.error('Error fetching laporan detail:', error);
      setError(error.message || 'Gagal mengambil data laporan');
    } finally {
      setLoading(false);
    }
  };

  const fetchPetugas = async () => {
    try {
      const response = await fetch('/api/admin/petugas');
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          setPetugasList(data);
        }
      }
    } catch (error) {
      console.error('Error fetching petugas:', error);
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
          laporanId: laporanId,
          petugasIds: selectedPetugas,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Gagal menugaskan petugas');
      }

      setSuccess(`${selectedPetugas.length} petugas berhasil ditugaskan!`);
      setShowAssignModal(false);
      setSelectedPetugas([]);
      fetchDetail();
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
      <span className={`px-3 py-1 text-sm rounded-full ${statusMap[status] || 'bg-gray-100'}`}>
        {labelMap[status] || status}
      </span>
    );
  };

  const getStatusPengangkutanBadge = (status) => {
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
      <span className={`px-3 py-1 text-sm rounded-full ${statusMap[status] || 'bg-gray-100'}`}>
        {labelMap[status] || status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl text-gray-600">Loading...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl text-red-600 mb-4">Error: {error}</div>
          <button
            onClick={() => router.push('/admin/laporan')}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Kembali ke Daftar Laporan
          </button>
        </div>
      </div>
    );
  }

  if (!laporan) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl text-gray-600 mb-4">Laporan tidak ditemukan</div>
          <button
            onClick={() => router.push('/admin/laporan')}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Kembali ke Daftar Laporan
          </button>
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
              <h1 className="text-xl font-semibold text-gray-900">Detail Laporan</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/admin/laporan" className="text-gray-700 hover:text-gray-900">
                Kembali
              </Link>
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Informasi Laporan</h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Sekolah</label>
                    <p className="mt-1 text-gray-900 font-medium">
                      {laporan.sekolah?.namaSekolah || '-'}
                    </p>
                    <p className="text-sm text-gray-500">{laporan.sekolah?.alamat || '-'}</p>
                    <p className="text-sm text-gray-500">{laporan.sekolah?.kota?.namaKota || '-'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">User</label>
                    <p className="mt-1 text-gray-900 font-medium">
                      {laporan.user?.nama || '-'}
                    </p>
                    <p className="text-sm text-gray-500">{laporan.user?.email || '-'}</p>
                    <p className="text-sm text-gray-500">{laporan.user?.noHp || '-'}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Jenis Sampah</label>
                    <p className="mt-1 text-gray-900 font-medium">
                      {laporan.jenisSampah?.namaJenis || '-'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Berat</label>
                    <p className="mt-1 text-gray-900 font-medium">
                      {laporan.berat} kg
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Status</label>
                    <div className="mt-1">{getStatusBadge(laporan.status)}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Tanggal Lapor</label>
                    <p className="mt-1 text-gray-900">
                      {laporan.tanggalLapor 
                        ? new Date(laporan.tanggalLapor).toLocaleString('id-ID', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        : '-'
                      }
                    </p>
                  </div>
                </div>

                {/* 🔥 TAMPILIN PETUGAS YANG DITUGASKAN */}
                <div>
                  <label className="text-sm font-medium text-gray-500">Petugas yang Ditugaskan</label>
                  <div className="mt-2">
                    {laporan.petugasTugas && laporan.petugasTugas.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {laporan.petugasTugas.map((tugas, index) => (
                          <span 
                            key={index}
                            className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                          >
                            {tugas.petugas?.nama || 'Unknown'}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">Belum ada petugas yang ditugaskan</p>
                    )}
                  </div>
                </div>

                {laporan.fotoLaporan && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Foto Bukti</label>
                    <div className="mt-2">
                      <img
                        src={laporan.fotoLaporan.imageUrl}
                        alt="Foto Laporan"
                        className="max-h-64 object-cover rounded-lg border"
                        onError={(e) => {
                          e.target.src = '/placeholder-image.png';
                        }}
                      />
                      <a
                        href={laporan.fotoLaporan.imageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 hover:text-indigo-900 text-sm mt-2 inline-block"
                      >
                        Buka gambar di tab baru
                      </a>
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t border-gray-200">
                  {laporan.status === 'MENUNGGU' && (
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => setShowAssignModal(true)}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                      >
                        📋 Tugaskan Petugas (Many-to-Many)
                      </button>
                      <p className="text-sm text-gray-500">
                        💡 Bisa pilih lebih dari 1 petugas
                      </p>
                    </div>
                  )}
                  {laporan.status === 'DIPROSES' && (
                    <div className="flex items-center gap-2">
                      <span className="px-4 py-2 bg-blue-100 text-blue-700 rounded-md">
                        🔄 Sedang diproses oleh {laporan.petugasTugas?.length || 0} petugas
                      </span>
                    </div>
                  )}
                  {laporan.status === 'SELESAI' && (
                    <span className="px-4 py-2 bg-green-100 text-green-700 rounded-md">
                      ✅ Laporan Selesai
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 🔥 BAGIAN PENGANGKUTAN - UBAH! */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Pengangkutan</h2>
              </div>
              <div className="p-6">
                {laporan.status === 'SELESAI' ? (
                  // 🔥 KALO LAPORAN SUDAH SELESAI
                  <div className="space-y-4">
                    <div className="bg-green-50 border border-green-200 rounded-md p-4 text-center">
                      <p className="text-green-700 font-semibold">✅ Laporan Selesai</p>
                      <p className="text-sm text-green-600 mt-1">
                        Sampah telah berhasil diangkut
                      </p>
                    </div>
                    
                    {/* Tampilin petugas yang bertugas */}
                    {laporan.petugasTugas && laporan.petugasTugas.length > 0 && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Petugas yang Bertugas</label>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {laporan.petugasTugas.map((tugas, idx) => (
                            <span key={idx} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                              {tugas.petugas?.nama || 'Unknown'} ✅
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Kalo ada foto hasil angkut */}
                    {laporan.pengangkutan?.fotoPengangkutan && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Foto Hasil Angkut</label>
                        <div className="mt-2">
                          <img
                            src={laporan.pengangkutan.fotoPengangkutan.imageUrl}
                            alt="Foto Hasil Angkut"
                            className="max-h-48 object-cover rounded-lg border"
                            onError={(e) => {
                              e.target.src = '/placeholder-image.png';
                            }}
                          />
                          <a
                            href={laporan.pengangkutan.fotoPengangkutan.imageUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-600 hover:text-indigo-900 text-sm mt-2 inline-block"
                          >
                            Buka gambar di tab baru
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                ) : laporan.pengangkutan ? (
                  // KALO ADA DATA PENGANGKUTAN
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Petugas</label>
                      <p className="mt-1 text-gray-900 font-medium">
                        {laporan.pengangkutan.petugas?.nama || '-'}
                      </p>
                      <p className="text-sm text-gray-500">{laporan.pengangkutan.petugas?.email || '-'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Status Pengangkutan</label>
                      <div className="mt-1">
                        {getStatusPengangkutanBadge(laporan.pengangkutan.status)}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Tanggal Tugas</label>
                      <p className="mt-1 text-gray-900">
                        {laporan.pengangkutan.tanggalPengangkutan 
                          ? new Date(laporan.pengangkutan.tanggalPengangkutan).toLocaleString('id-ID', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          : '-'
                        }
                      </p>
                    </div>
                    {laporan.pengangkutan.fotoPengangkutan && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Foto Hasil Angkut</label>
                        <div className="mt-2">
                          <img
                            src={laporan.pengangkutan.fotoPengangkutan.imageUrl}
                            alt="Foto Hasil Angkut"
                            className="max-h-48 object-cover rounded-lg border"
                            onError={(e) => {
                              e.target.src = '/placeholder-image.png';
                            }}
                          />
                          <a
                            href={laporan.pengangkutan.fotoPengangkutan.imageUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-600 hover:text-indigo-900 text-sm mt-2 inline-block"
                          >
                            Buka gambar di tab baru
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  // BELUM ADA PENGANGKUTAN
                  <div className="text-center py-6">
                    <p className="text-gray-500">⏳ Menunggu proses pengangkutan</p>
                    <p className="text-sm text-gray-400 mt-1">
                      Petugas akan segera ditugaskan
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 🔥 MODAL ASSIGN PETUGAS (CHECKBOX) */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 text-center">
                Tugaskan Petugas
              </h3>
              <p className="text-sm text-gray-500 text-center mt-2">
                Laporan dari: {laporan.sekolah?.namaSekolah || 'Unknown'}
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
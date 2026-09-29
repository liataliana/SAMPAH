// app/(dashboard)/petugas/tugas/[id]/page.js
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function PetugasTugasDetailPage({ params }) {
  const router = useRouter();
  const [laporan, setLaporan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [updating, setUpdating] = useState(false);
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
    }
  }, [laporanId]);

  const fetchDetail = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch(
        `/api/laporan/${laporanId}`
      );

      if (!response.ok) {
        const errorData = await response.json();

        throw new Error(
          errorData.error || 'Gagal mengambil data'
        );
      }

      const data = await response.json();

      console.log('📊 Detail laporan:', data);

      setLaporan(data);

    } catch (error) {
      console.error(
        'Error fetching laporan detail:',
        error
      );

      setError(error.message);

    } finally {
      setLoading(false);
    }
  };

  // ======================================================
  // UPDATE STATUS LAPORAN
  // MULAI ATAU SELESAI
  // ======================================================
  const handleUpdateStatus = async (status) => {
    try {
      setUpdating(true);
      setError('');
      setSuccess('');

      const response = await fetch(
        `/api/laporan/${laporanId}`,
        {
          method: 'PUT',

          headers: {
            'Content-Type': 'application/json',
          },

          body: JSON.stringify({
            status,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            'Gagal mengupdate status'
        );
      }

      if (status === 'SELESAI') {
        setSuccess(
          '✅ Laporan berhasil diselesaikan dan poin telah ditambahkan! 🎉'
        );
      } else {
        setSuccess(
          '🚚 Pengangkutan dimulai!'
        );
      }

      await fetchDetail();

    } catch (error) {
      console.error(
        'Error updating status:',
        error
      );

      setError(error.message);

    } finally {
      setUpdating(false);
    }
  };

  // ======================================================
  // UPLOAD FOTO HASIL ANGKUT
  //
  // PENTING:
  // Upload foto TIDAK langsung menyelesaikan laporan.
  // Status tetap DIPROSES.
  //
  // Laporan baru menjadi SELESAI setelah tombol
  // "Selesaikan Laporan" ditekan.
  // ======================================================
  const handleUploadFoto = async (e) => {
    const file = e.target.files[0];

    if (!file) return;

    try {
      setUpdating(true);
      setError('');
      setSuccess('');

      // ==================================================
      // UPLOAD FOTO KE PENGANGKUTAN
      // ==================================================
      const formData = new FormData();

      formData.append('file', file);
      formData.append('laporanId', laporanId);

      const uploadRes = await fetch(
        '/api/pengangkutan/upload',
        {
          method: 'POST',
          body: formData,
        }
      );

      const uploadData =
        await uploadRes.json();

      if (!uploadRes.ok) {
        throw new Error(
          uploadData.error ||
            'Gagal upload foto'
        );
      }

      // ==================================================
      // JANGAN LANGSUNG UPDATE KE SELESAI
      //
      // EcoPoint akan diproses nanti ketika user menekan
      // tombol "Selesaikan Laporan".
      // ==================================================

      setSuccess(
        '📸 Foto hasil angkut berhasil diupload! Silakan klik "Selesaikan Laporan".'
      );

      await fetchDetail();

    } catch (error) {
      console.error(
        'Error upload foto:',
        error
      );

      setError(error.message);

    } finally {
      setUpdating(false);

      // Reset input file supaya file yang sama
      // bisa dipilih lagi kalau diperlukan.
      e.target.value = '';
    }
  };

  // ======================================================
  // LOGOUT
  // ======================================================
  const handleLogout = async () => {
    await fetch(
      '/api/auth/logout',
      {
        method: 'POST',
      }
    );

    router.push('/login');
  };

  // ======================================================
  // STATUS LAPORAN BADGE
  // ======================================================
  const getStatusBadge = (status) => {
    const statusMap = {
      MENUNGGU:
        'bg-yellow-100 text-yellow-800',

      DIPROSES:
        'bg-blue-100 text-blue-800',

      SELESAI:
        'bg-green-100 text-green-800',
    };

    const labelMap = {
      MENUNGGU: 'Menunggu',
      DIPROSES: 'Diproses',
      SELESAI: 'Selesai',
    };

    return (
      <span
        className={`px-3 py-1 text-sm rounded-full ${
          statusMap[status] ||
          'bg-gray-100'
        }`}
      >
        {labelMap[status] || status}
      </span>
    );
  };

  // ======================================================
  // STATUS PENGANGKUTAN BADGE
  // ======================================================
  const getStatusPengangkutanBadge = (
    status
  ) => {
    const statusMap = {
      BELUM_DIANGKUT:
        'bg-gray-100 text-gray-800',

      SEDANG_DIANGKUT:
        'bg-yellow-100 text-yellow-800',

      SUDAH_DIANGKUT:
        'bg-green-100 text-green-800',
    };

    const labelMap = {
      BELUM_DIANGKUT:
        'Belum Diangkut',

      SEDANG_DIANGKUT:
        'Sedang Diangkut',

      SUDAH_DIANGKUT:
        'Sudah Diangkut',
    };

    return (
      <span
        className={`px-3 py-1 text-sm rounded-full ${
          statusMap[status] ||
          'bg-gray-100'
        }`}
      >
        {labelMap[status] || status}
      </span>
    );
  };

  // ======================================================
  // LOADING
  // ======================================================
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          Loading...
        </div>
      </div>
    );
  }

  // ======================================================
  // ERROR
  // ======================================================
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl text-red-600 mb-4">
            Error: {error}
          </div>

          <button
            onClick={() =>
              router.push(
                '/petugas/tugas'
              )
            }
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Kembali ke Daftar Tugas
          </button>
        </div>
      </div>
    );
  }

  // ======================================================
  // LAPORAN TIDAK DITEMUKAN
  // ======================================================
  if (!laporan) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center text-gray-600">
          Tugas tidak ditemukan
        </div>
      </div>
    );
  }

  // ======================================================
  // MAIN PAGE
  // ======================================================
  return (
    <div className="min-h-screen bg-gray-100">

      {/* ==================================================
          NAVBAR
      ================================================== */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="flex justify-between h-16">

            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                Detail Tugas
              </h1>
            </div>

            <div className="flex items-center space-x-4">

              <Link
                href="/petugas/tugas"
                className="text-gray-700 hover:text-gray-900"
              >
                Kembali
              </Link>

              <Link
                href="/petugas"
                className="text-gray-700 hover:text-gray-900"
              >
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

      {/* ==================================================
          CONTENT
      ================================================== */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ERROR */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded">
            ❌ {error}
          </div>
        )}

        {/* SUCCESS */}
        {success && (
          <div className="mb-4 bg-green-50 border border-green-400 text-green-700 px-4 py-3 rounded">
            ✅ {success}
          </div>
        )}

        <div className="bg-white rounded-lg shadow overflow-hidden">

          <div className="p-6 space-y-4">

            {/* ==================================================
                SEKOLAH & USER
            ================================================== */}
            <div className="grid grid-cols-2 gap-4">

              <div>
                <label className="text-sm font-medium text-gray-500">
                  Sekolah
                </label>

                <p className="mt-1 text-gray-900 font-medium">
                  {laporan.sekolah?.namaSekolah ||
                    '-'}
                </p>

                <p className="text-sm text-gray-500">
                  {laporan.sekolah?.alamat ||
                    '-'}
                </p>

                <p className="text-sm text-gray-500">
                  {laporan.sekolah?.kota?.namaKota ||
                    '-'}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">
                  User
                </label>

                <p className="mt-1 text-gray-900 font-medium">
                  {laporan.user?.nama ||
                    '-'}
                </p>

                <p className="text-sm text-gray-500">
                  {laporan.user?.email ||
                    '-'}
                </p>
              </div>

            </div>

            {/* ==================================================
                JENIS SAMPAH & BERAT
            ================================================== */}
            <div className="grid grid-cols-2 gap-4">

              <div>
                <label className="text-sm font-medium text-gray-500">
                  Jenis Sampah
                </label>

                <p className="mt-1 text-gray-900 font-medium">
                  {laporan.jenisSampah?.namaJenis ||
                    '-'}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">
                  Berat
                </label>

                <p className="mt-1 text-gray-900 font-medium">
                  {laporan.berat || 0} kg
                </p>
              </div>

            </div>

            {/* ==================================================
                STATUS & TANGGAL
            ================================================== */}
            <div className="grid grid-cols-2 gap-4">

              <div>
                <label className="text-sm font-medium text-gray-500">
                  Status Laporan
                </label>

                <div className="mt-1">
                  {getStatusBadge(
                    laporan.status
                  )}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">
                  Tanggal Lapor
                </label>

                <p className="mt-1 text-gray-900">
                  {laporan.tanggalLapor
                    ? new Date(
                        laporan.tanggalLapor
                      ).toLocaleString(
                        'id-ID'
                      )
                    : '-'}
                </p>
              </div>

            </div>

            {/* ==================================================
                PETUGAS
            ================================================== */}
            <div>

              <label className="text-sm font-medium text-gray-500">
                👥 Petugas yang Ditugaskan
              </label>

              <div className="mt-2">

                {laporan.petugasTugas &&
                laporan.petugasTugas.length >
                  0 ? (
                  <div className="flex flex-wrap gap-2">

                    {laporan.petugasTugas.map(
                      (tugas, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                        >
                          {tugas.petugas?.nama ||
                            'Unknown'}
                        </span>
                      )
                    )}

                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">
                    ⚠️ Belum ada petugas yang
                    ditugaskan
                  </p>
                )}

              </div>

            </div>

            {/* ==================================================
                FOTO BUKTI USER
            ================================================== */}
            {laporan.fotoLaporan && (
              <div>

                <label className="text-sm font-medium text-gray-500">
                  📷 Foto Bukti Laporan (dari User)
                </label>

                <div className="mt-2">

                  <img
                    src={
                      laporan.fotoLaporan
                        .imageUrl
                    }
                    alt="Foto Laporan"
                    className="max-h-64 object-cover rounded-lg border"
                    onError={(e) => {
                      e.target.src =
                        '/placeholder-image.png';
                    }}
                  />

                  <a
                    href={
                      laporan.fotoLaporan
                        .imageUrl
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:text-indigo-900 text-sm mt-2 inline-block"
                  >
                    Buka gambar di tab baru
                  </a>

                </div>

              </div>
            )}

            {/* ==================================================
                FOTO HASIL ANGKUT
            ================================================== */}
            <div className="border-t border-gray-200 pt-4">

              <label className="text-sm font-medium text-gray-500">
                📸 Foto Hasil Angkut (dari Petugas)
              </label>

              {laporan.pengangkutan
                ?.fotoPengangkutan ? (

                <div className="mt-2">

                  <div className="bg-green-50 border border-green-200 rounded-lg p-2 mb-2">
                    <p className="text-xs text-green-700">
                      ✅ Foto hasil angkut sudah
                      diupload
                    </p>
                  </div>

                  <img
                    src={
                      laporan.pengangkutan
                        .fotoPengangkutan
                        .imageUrl
                    }
                    alt="Foto Hasil Angkut"
                    className="max-h-64 object-cover rounded-lg border"
                    onError={(e) => {
                      e.target.src =
                        '/placeholder-image.png';
                    }}
                  />

                  <a
                    href={
                      laporan.pengangkutan
                        .fotoPengangkutan
                        .imageUrl
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:text-indigo-900 text-sm mt-2 inline-block"
                  >
                    Buka gambar di tab baru
                  </a>

                </div>

              ) : (

                <div className="mt-2">

                  <div
                    className={`rounded-lg p-3 mb-2 ${
                      laporan.status ===
                      'DIPROSES'
                        ? 'bg-yellow-50 border border-yellow-200'
                        : 'bg-gray-50 border border-gray-200'
                    }`}
                  >

                    <p
                      className={`text-sm ${
                        laporan.status ===
                        'DIPROSES'
                          ? 'text-yellow-700'
                          : 'text-gray-500'
                      }`}
                    >
                      {laporan.status ===
                      'DIPROSES'
                        ? '⚠️ Upload foto hasil angkut untuk menyelesaikan laporan'
                        : laporan.status ===
                          'MENUNGGU'
                          ? '⏳ Tunggu sampai pengangkutan dimulai'
                          : '📸 Belum ada foto hasil angkut'}
                    </p>

                  </div>

                  {laporan.status ===
                    'DIPROSES' && (

                    <label className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer">

                      📤 Upload Foto Hasil Angkut

                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={
                          handleUploadFoto
                        }
                        disabled={updating}
                      />

                    </label>
                  )}

                </div>
              )}

            </div>

            {/* ==================================================
                INFORMASI PENGANGKUTAN
            ================================================== */}
            <div className="border-t border-gray-200 pt-4">

              <h3 className="text-md font-semibold text-gray-700 mb-2">
                📋 Informasi Pengangkutan
              </h3>

              {laporan.pengangkutan ? (

                <div className="grid grid-cols-2 gap-4">

                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Status
                    </label>

                    <div className="mt-1">
                      {getStatusPengangkutanBadge(
                        laporan.pengangkutan
                          .status
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Tanggal
                    </label>

                    <p className="mt-1 text-gray-900">
                      {laporan.pengangkutan
                        .tanggalPengangkutan
                        ? new Date(
                            laporan
                              .pengangkutan
                              .tanggalPengangkutan
                          ).toLocaleString(
                            'id-ID'
                          )
                        : '-'}
                    </p>
                  </div>

                </div>

              ) : (

                <p className="text-gray-500 text-sm">
                  Belum ada data pengangkutan
                </p>

              )}

            </div>

            {/* ==================================================
                BUTTON STATUS
            ================================================== */}
            <div className="pt-4 border-t border-gray-200 flex gap-2 flex-wrap">

              {/* MULAI PENGANGKUTAN */}
              {laporan.status ===
                'MENUNGGU' && (

                <button
                  onClick={() =>
                    handleUpdateStatus(
                      'DIPROSES'
                    )
                  }
                  disabled={updating}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:opacity-50"
                >
                  {updating
                    ? 'Loading...'
                    : '🚚 Mulai Pengangkutan'}
                </button>
              )}

              {/* SELESAIKAN LAPORAN */}
              {laporan.status ===
                'DIPROSES' && (

                <button
                  onClick={() =>
                    handleUpdateStatus(
                      'SELESAI'
                    )
                  }
                  disabled={
                    updating ||
                    !laporan.pengangkutan
                      ?.fotoPengangkutan
                  }
                  className={`px-4 py-2 rounded-md ${
                    laporan.pengangkutan
                      ?.fotoPengangkutan
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {updating
                    ? 'Loading...'
                    : '✅ Selesaikan Laporan'}
                </button>
              )}

              {/* SUDAH SELESAI */}
              {laporan.status ===
                'SELESAI' && (

                <span className="px-4 py-2 bg-green-100 text-green-700 rounded-md">
                  ✅ Laporan Selesai
                </span>
              )}

            </div>

            {/* ==================================================
                PETUNJUK
            ================================================== */}
            {laporan.status ===
              'DIPROSES' && (

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">

                <p className="text-sm text-blue-700">
                  📌 Langkah-langkah:
                  <br />
                  1. 📸 Upload foto hasil angkut
                  <br />
                  2. ✅ Klik "Selesaikan Laporan"
                  <br />
                  3. 🪙 EcoPoint otomatis ditambahkan
                </p>

              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
// app/(dashboard)/user/laporan/page.js
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LaporanPage() {
  const router = useRouter();
  const [laporanList, setLaporanList] = useState([]);
  const [jenisSampahList, setJenisSampahList] = useState([]);
  const [formData, setFormData] = useState({
    jenisSampahId: '',
    berat: '',
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch laporan
      const laporanRes = await fetch('/api/laporan');
      const laporanData = await laporanRes.json();
      if (Array.isArray(laporanData)) {
        setLaporanList(laporanData);
      }

      // Fetch jenis sampah
      const jenisRes = await fetch('/api/jenis-sampah');
      const jenisData = await jenisRes.json();
      if (Array.isArray(jenisData)) {
        setJenisSampahList(jenisData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      // Upload file dulu
      const formDataFile = new FormData();
      formDataFile.append('file', selectedFile);

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formDataFile,
      });

      const uploadData = await uploadRes.json();

      if (!uploadRes.ok) {
        throw new Error(uploadData.error || 'Gagal upload foto');
      }

      // Kirim laporan
      const response = await fetch('/api/laporan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jenisSampahId: formData.jenisSampahId,
          berat: parseFloat(formData.berat),
          imageUrl: uploadData.filePath,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Gagal membuat laporan');
      }

      setSuccess('Laporan berhasil dibuat!');
      setFormData({ jenisSampahId: '', berat: '' });
      setSelectedFile(null);
      setPreviewUrl(null);
      setShowForm(false);
      fetchData();
    } catch (err) {
      setError(err.message);
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

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">Kelola Laporan</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/user" className="text-gray-700 hover:text-gray-900">
                Dashboard
              </Link>
              <button
                onClick={() => setShowForm(!showForm)}
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
              >
                {showForm ? 'Tutup Form' : 'Buat Laporan'}
              </button>
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

        {/* Form Buat Laporan */}
        {showForm && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-lg font-semibold mb-4">Buat Laporan Baru</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Jenis Sampah</label>
                <select
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  value={formData.jenisSampahId}
                  onChange={(e) => setFormData({ ...formData, jenisSampahId: e.target.value })}
                  required
                >
                  <option value="">Pilih Jenis Sampah</option>
                  {jenisSampahList.map((jenis) => (
                    <option key={jenis.id} value={jenis.id}>
                      {jenis.namaJenis}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Berat (kg)</label>
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  value={formData.berat}
                  onChange={(e) => setFormData({ ...formData, berat: e.target.value })}
                  required
                />
                <p className="mt-1 text-xs text-gray-500">* Berat harus lebih dari 0 kg</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Foto Bukti</label>
                <input
                  type="file"
                  accept="image/*"
                  className="mt-1 block w-full"
                  onChange={handleFileChange}
                  required
                />
                {previewUrl && (
                  <div className="mt-2">
                    <img src={previewUrl} alt="Preview" className="h-32 object-cover rounded" />
                  </div>
                )}
                <p className="mt-1 text-xs text-gray-500">* Upload foto kondisi sampah</p>
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={loading || !selectedFile}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {loading ? 'Loading...' : 'Kirim Laporan'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setFormData({ jenisSampahId: '', berat: '' });
                    setSelectedFile(null);
                    setPreviewUrl(null);
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Daftar Laporan */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Riwayat Laporan</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    No
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
                    Foto
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {laporanList.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                      Belum ada laporan
                    </td>
                  </tr>
                ) : (
                  laporanList.map((laporan, index) => (
                    <tr key={laporan.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {index + 1}
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
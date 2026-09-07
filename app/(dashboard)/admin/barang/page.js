// app/(dashboard)/admin/barang/page.js
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminBarangPage() {
  const router = useRouter();
  const [barangList, setBarangList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    nama: '',
    deskripsi: '',
    hargaPoin: '',
    stok: '',
  });
  const [selectedFile, setSelectedFile] = useState(null);

  useEffect(() => {
    fetchBarang();
  }, []);

  const fetchBarang = async () => {
    try {
      const response = await fetch('/api/admin/barang');
      const data = await response.json();
      if (Array.isArray(data)) {
        setBarangList(data);
      }
    } catch (error) {
      console.error('Error fetching barang:', error);
      setError('Gagal mengambil data barang');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const formDataSend = new FormData();
      formDataSend.append('nama', formData.nama);
      formDataSend.append('deskripsi', formData.deskripsi || '');
      formDataSend.append('hargaPoin', formData.hargaPoin);
      formDataSend.append('stok', formData.stok);
      if (selectedFile) {
        formDataSend.append('image', selectedFile);
      }

      const url = editingId ? `/api/admin/barang/${editingId}` : '/api/admin/barang';
      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        body: formDataSend,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Gagal menyimpan data');
      }

      setSuccess(data.message);
      setShowForm(false);
      setEditingId(null);
      setFormData({ nama: '', deskripsi: '', hargaPoin: '', stok: '' });
      setSelectedFile(null);
      fetchBarang();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEdit = (barang) => {
    setFormData({
      nama: barang.nama,
      deskripsi: barang.deskripsi || '',
      hargaPoin: barang.hargaPoin.toString(),
      stok: barang.stok.toString(),
    });
    setEditingId(barang.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Yakin hapus barang ini?')) return;

    try {
      const response = await fetch(`/api/admin/barang/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Gagal menghapus');
      }

      setSuccess('Barang berhasil dihapus!');
      fetchBarang();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
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
              <h1 className="text-xl font-semibold text-gray-900">🛍️ Kelola Barang</h1>
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
            ❌ {error}
          </div>
        )}
        {success && (
          <div className="mb-4 bg-green-50 border border-green-400 text-green-700 px-4 py-3 rounded">
            ✅ {success}
          </div>
        )}

        <button
          onClick={() => {
            setShowForm(!showForm);
            setEditingId(null);
            setFormData({ nama: '', deskripsi: '', hargaPoin: '', stok: '' });
            setSelectedFile(null);
          }}
          className="mb-6 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          {showForm ? 'Tutup Form' : '➕ Tambah Barang'}
        </button>

        {/* Form */}
        {showForm && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h3 className="text-lg font-semibold mb-4">
              {editingId ? 'Edit Barang' : 'Tambah Barang Baru'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nama Barang *</label>
                <input
                  type="text"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Deskripsi</label>
                <textarea
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows="3"
                  value={formData.deskripsi}
                  onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Harga (Poin) *</label>
                <input
                  type="number"
                  min="1"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={formData.hargaPoin}
                  onChange={(e) => setFormData({ ...formData, hargaPoin: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Stok *</label>
                <input
                  type="number"
                  min="0"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={formData.stok}
                  onChange={(e) => setFormData({ ...formData, stok: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Gambar</label>
                <input
                  type="file"
                  accept="image/*"
                  className="mt-1 block w-full"
                  onChange={(e) => setSelectedFile(e.target.files[0])}
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                {editingId ? 'Update' : 'Simpan'}
              </button>
            </form>
          </div>
        )}

        {/* Tabel Barang */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Gambar
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nama
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Harga (Poin)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stok
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {barangList.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                      Belum ada barang
                    </td>
                  </tr>
                ) : (
                  barangList.map((barang) => (
                    <tr key={barang.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {barang.imageUrl ? (
                          <img src={barang.imageUrl} alt={barang.nama} className="h-12 w-12 object-cover rounded" />
                        ) : (
                          <div className="h-12 w-12 bg-gray-200 rounded flex items-center justify-center text-gray-400">
                            No img
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {barang.nama}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {barang.hargaPoin}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {barang.stok}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => handleEdit(barang)}
                          className="text-indigo-600 hover:text-indigo-900 mr-3"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(barang.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Hapus
                        </button>
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
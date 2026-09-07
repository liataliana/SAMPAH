// app/(dashboard)/user/ecopoint/page.js
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function EcopointPage() {
  const router = useRouter();
  const [ecopoint, setEcopoint] = useState(null);
  const [transaksi, setTransaksi] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchEcopoint();
  }, []);

  const fetchEcopoint = async () => {
    try {
      const response = await fetch('/api/ecopoint');
      const data = await response.json();
      setEcopoint(data);
      setTransaksi(data.transaksi || []);
    } catch (error) {
      console.error('Error fetching ecopoint:', error);
      setError('Gagal mengambil data poin');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const totalPoin = ecopoint?.totalPoin ?? 0;
  const poinTerpakai = ecopoint?.poinTerpakai ?? 0;
  const poinTersisa = Number(totalPoin) - Number(poinTerpakai);

  // Level berdasarkan total poin
  const getLevel = (poin) => {
    if (poin >= 1000) return { nama: '🌍 Legendary', color: 'text-purple-600', bg: 'bg-purple-100' };
    if (poin >= 500) return { nama: '⭐ Platinum', color: 'text-blue-600', bg: 'bg-blue-100' };
    if (poin >= 200) return { nama: '🥇 Gold', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    if (poin >= 100) return { nama: '🥈 Silver', color: 'text-gray-600', bg: 'bg-gray-100' };
    return { nama: '🥉 Bronze', color: 'text-orange-600', bg: 'bg-orange-100' };
  };

  const level = getLevel(totalPoin);

  // Progress ke level berikutnya (max 1000 poin)
  const progress = Math.min((totalPoin / 1000) * 100, 100);

  // Filter transaksi
  const filteredTransaksi = filter === 'all' 
    ? transaksi 
    : transaksi.filter(t => t.jenis === filter);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/user" className="text-2xl font-bold text-indigo-600">
                🪙 My Ecopoint
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/user/marketplace" className="text-indigo-600 hover:text-indigo-800 font-medium">
                🛍️ Marketplace
              </Link>
              <Link href="/user" className="text-gray-600 hover:text-gray-900">
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
          <div className="mb-4 bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
            ❌ {error}
          </div>
        )}
        {success && (
          <div className="mb-4 bg-green-50 border border-green-400 text-green-700 px-4 py-3 rounded-lg">
            ✅ {success}
          </div>
        )}

        {/* Header */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl shadow-lg p-6 mb-8 text-white">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">🪙 Ecopoint Saya</h1>
              <p className="mt-1 opacity-90">Kumpulkan poin dari laporan sampah, tukarkan dengan hadiah!</p>
            </div>
            <div className={`px-4 py-2 rounded-full ${level.bg} text-sm font-bold ${level.color}`}>
              {level.nama}
            </div>
          </div>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow p-6 border-l-4 border-green-500 hover:shadow-lg transition-shadow">
            <div className="text-sm text-gray-500">Total Poin</div>
            <div className="text-3xl font-bold text-green-600">{totalPoin}</div>
          </div>
          <div className="bg-white rounded-xl shadow p-6 border-l-4 border-blue-500 hover:shadow-lg transition-shadow">
            <div className="text-sm text-gray-500">Poin Terpakai</div>
            <div className="text-3xl font-bold text-blue-600">{poinTerpakai}</div>
          </div>
          <div className="bg-white rounded-xl shadow p-6 border-l-4 border-yellow-500 hover:shadow-lg transition-shadow">
            <div className="text-sm text-gray-500">Poin Tersisa</div>
            <div className="text-3xl font-bold text-yellow-600">{poinTersisa}</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-white rounded-xl shadow p-6 mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Progress ke Level Legendary</span>
            <span className="text-sm font-medium text-gray-700">{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div 
              className="bg-gradient-to-r from-green-500 to-emerald-500 h-4 rounded-full transition-all duration-1000"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            {totalPoin >= 1000 ? '🎉 Selamat! Anda sudah mencapai level Legendary!' : `Butuh ${1000 - totalPoin} poin lagi untuk mencapai Legendary`}
          </p>
        </div>

        {/* Tombol ke Marketplace */}
        <Link
          href="/user/marketplace"
          className="inline-block w-full sm:w-auto px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 text-center transition-colors mb-8 shadow-md hover:shadow-lg"
        >
          🛍️ Yuk ke Marketplace & Tukar Poin!
        </Link>

        {/* Riwayat Transaksi */}
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex flex-wrap justify-between items-center">
            <h3 className="text-lg font-semibold">📋 Riwayat Transaksi</h3>
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1 text-xs rounded-full ${
                  filter === 'all' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Semua
              </button>
              <button
                onClick={() => setFilter('DAPAT')}
                className={`px-3 py-1 text-xs rounded-full ${
                  filter === 'DAPAT' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Dapat
              </button>
              <button
                onClick={() => setFilter('TUKAR')}
                className={`px-3 py-1 text-xs rounded-full ${
                  filter === 'TUKAR' ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Tukar
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            {filteredTransaksi.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📭</div>
                <p className="text-gray-500">Belum ada transaksi</p>
                <p className="text-sm text-gray-400">Mulai kumpulkan poin dengan melaporkan sampah!</p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jenis</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Poin</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Deskripsi</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredTransaksi.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          item.jenis === 'DAPAT' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {item.jenis === 'DAPAT' ? '📥 Dapat' : '📤 Tukar'}
                        </span>
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap font-medium ${
                        item.poin > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {item.poin > 0 ? `+${item.poin}` : item.poin}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {item.deskripsi}
                        {item.alamat && (
                          <div className="text-xs text-gray-400 mt-1">📦 {item.alamat}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                        {new Date(item.createdAt).toLocaleString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          {filteredTransaksi.length > 0 && (
            <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
              <p className="text-xs text-gray-400">
                Total {filteredTransaksi.length} transaksi
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
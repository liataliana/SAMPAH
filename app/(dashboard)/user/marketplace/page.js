// app/(dashboard)/user/marketplace/page.js
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function MarketplacePage() {
  const router = useRouter();
  const [barangList, setBarangList] = useState([]);
  const [ecopoint, setEcopoint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedBarang, setSelectedBarang] = useState(null);
  const [jumlah, setJumlah] = useState(1);
  const [alamat, setAlamat] = useState('');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('default');
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const barangRes = await fetch('/api/admin/barang');
      const barangData = await barangRes.json();
      if (Array.isArray(barangData)) {
        setBarangList(barangData.filter(b => b.stok > 0));
      }

      const ecoRes = await fetch('/api/ecopoint');
      const ecoData = await ecoRes.json();
      setEcopoint(ecoData);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Gagal mengambil data');
    } finally {
      setLoading(false);
    }
  };

  const handleTukar = async (barangId) => {
    if (!alamat || alamat.trim() === '') {
      setError('⚠️ Alamat pengiriman wajib diisi!');
      return;
    }

    try {
      const response = await fetch('/api/ecopoint/tukar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ barangId, jumlah, alamat }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Gagal menukar');

      setSuccess(`✅ Berhasil menukar ${data.data?.deskripsi || 'barang'}!`);
      setIsModalOpen(false);
      setSelectedBarang(null);
      setJumlah(1);
      setAlamat('');
      fetchData();
      
      // Auto close success setelah 3 detik
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const totalPoin = ecopoint?.totalPoin ?? 0;
  const poinTerpakai = ecopoint?.poinTerpakai ?? 0;
  const poinTersisa = Number(totalPoin) - Number(poinTerpakai);

  // Sortir barang
  const getSortedBarang = () => {
    let sorted = [...barangList];
    switch (sortBy) {
      case 'termurah':
        sorted.sort((a, b) => a.hargaPoin - b.hargaPoin);
        break;
      case 'termahal':
        sorted.sort((a, b) => b.hargaPoin - a.hargaPoin);
        break;
      case 'stok':
        sorted.sort((a, b) => b.stok - a.stok);
        break;
      default:
        break;
    }
    return sorted;
  };

  const filteredBarang = getSortedBarang().filter(item =>
    item.nama.toLowerCase().includes(search.toLowerCase())
  );

  // Loading skeleton
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl shadow-md overflow-hidden animate-pulse">
                <div className="h-48 bg-gray-200"></div>
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                  <div className="h-10 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white shadow-md sticky top-0 z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/user" className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              🛍️ EcoShop
            </Link>
            <div className="flex items-center space-x-4">
              <Link href="/user/ecopoint" className="flex items-center space-x-2 bg-gradient-to-r from-green-100 to-emerald-100 px-4 py-2 rounded-full hover:shadow-md transition-shadow">
                <span className="text-green-600 font-bold">🪙 {poinTersisa}</span>
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
        {/* Notifikasi */}
        {error && (
          <div className="mb-4 bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-lg shadow-sm animate-slideDown">
            ❌ {error}
          </div>
        )}
        {success && (
          <div className="mb-4 bg-green-50 border-l-4 border-green-500 text-green-700 px-4 py-3 rounded-lg shadow-sm animate-slideDown">
            ✅ {success}
          </div>
        )}

        {/* Header Banner */}
        <div className="relative bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 rounded-2xl shadow-xl p-6 md:p-8 mb-8 text-white overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>
          <div className="relative z-10">
            <h1 className="text-3xl md:text-4xl font-bold">Selamat Datang di EcoShop! 🎉</h1>
            <p className="mt-2 text-indigo-100">Tukarkan poin sampahmu dengan berbagai hadiah menarik!</p>
            <div className="mt-4 flex flex-wrap items-center gap-6">
              <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2">
                <span className="text-sm opacity-80">Poin Tersisa</span>
                <div className="text-2xl font-bold">{poinTersisa}</div>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2">
                <span className="text-sm opacity-80">Total Poin</span>
                <div className="text-2xl font-bold">{totalPoin}</div>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2">
                <span className="text-sm opacity-80">Terpakai</span>
                <div className="text-2xl font-bold">{poinTerpakai}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Filter & Search */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <input
              type="text"
              placeholder="🔍 Cari barang..."
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-3 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="default">📌 Default</option>
              <option value="termurah">💰 Termurah</option>
              <option value="termahal">💎 Termahal</option>
              <option value="stok">📦 Stok</option>
            </select>
          </div>
        </div>

        {/* Grid Barang */}
        {filteredBarang.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl shadow-sm">
            <div className="text-6xl mb-4">🛒</div>
            <h3 className="text-xl font-semibold text-gray-700">Belum ada barang</h3>
            <p className="text-gray-400 mt-1">Tunggu admin menambahkan barang menarik!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
            {filteredBarang.map((barang) => {
              const isPoinCukup = poinTersisa >= barang.hargaPoin;
              const isStokHabis = barang.stok === 0;
              
              return (
                <div
                  key={barang.id}
                  className="group bg-white rounded-xl shadow-sm hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-indigo-200 hover:-translate-y-1"
                >
                  <div className="relative h-48 bg-gray-100 overflow-hidden">
                    {barang.imageUrl ? (
                      <img
                        src={barang.imageUrl}
                        alt={barang.nama}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-6xl text-gray-300">
                        📦
                      </div>
                    )}
                    {barang.stok <= 5 && barang.stok > 0 && (
                      <span className="absolute top-3 right-3 bg-yellow-500 text-white text-xs px-2.5 py-1 rounded-full shadow-md animate-pulse">
                        ⚡ Sisa {barang.stok}
                      </span>
                    )}
                    {isStokHabis && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <span className="text-white font-bold text-xl bg-red-500/80 px-4 py-2 rounded-lg">HABIS</span>
                      </div>
                    )}
                    {isPoinCukup && !isStokHabis && (
                      <span className="absolute top-3 left-3 bg-green-500 text-white text-xs px-2.5 py-1 rounded-full shadow-md">
                        ✅ Bisa ditukar
                      </span>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 line-clamp-1 group-hover:text-indigo-600 transition-colors">
                      {barang.nama}
                    </h3>
                    <p className="text-sm text-gray-500 line-clamp-1 mt-0.5">
                      {barang.deskripsi || '-'}
                    </p>
                    <div className="mt-2 flex justify-between items-center">
                      <span className="text-green-600 font-bold text-lg">🪙 {barang.hargaPoin}</span>
                      <span className={`text-xs ${barang.stok <= 5 ? 'text-yellow-600' : 'text-gray-400'}`}>
                        📦 {barang.stok}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        if (!isStokHabis && isPoinCukup) {
                          setSelectedBarang(barang);
                          setJumlah(1);
                          setAlamat('');
                          setError('');
                          setIsModalOpen(true);
                        }
                      }}
                      disabled={isStokHabis || !isPoinCukup}
                      className={`mt-3 w-full py-2.5 rounded-xl font-medium transition-all duration-300 ${
                        isStokHabis
                          ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          : !isPoinCukup
                          ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                          : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-lg hover:-translate-y-0.5'
                      }`}
                    >
                      {isStokHabis ? 'Habis' : !isPoinCukup ? 'Poin Kurang' : 'Tukar Sekarang'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer info */}
        <div className="mt-8 text-center text-sm text-gray-400 border-t border-gray-200 pt-6">
          <p>Menampilkan {filteredBarang.length} dari {barangList.length} barang</p>
        </div>
      </div>

      {/* Modal Tukar - Elegan */}
      {isModalOpen && selectedBarang && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl animate-scaleIn">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">
                Tukar <span className="text-indigo-600">{selectedBarang.nama}</span>
              </h3>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setSelectedBarang(null);
                  setJumlah(1);
                  setAlamat('');
                }}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors"
              >
                ✕
              </button>
            </div>

            {selectedBarang.imageUrl && (
              <div className="rounded-xl overflow-hidden mb-4 bg-gray-100">
                <img
                  src={selectedBarang.imageUrl}
                  alt={selectedBarang.nama}
                  className="w-full h-48 object-cover"
                />
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Jumlah</label>
                <div className="flex items-center space-x-4 mt-1">
                  <button
                    onClick={() => setJumlah(Math.max(1, jumlah - 1))}
                    className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 text-xl font-bold text-gray-600 transition-colors"
                  >
                    -
                  </button>
                  <span className="text-2xl font-bold w-12 text-center">{jumlah}</span>
                  <button
                    onClick={() => setJumlah(Math.min(selectedBarang.stok, jumlah + 1))}
                    className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 text-xl font-bold text-gray-600 transition-colors"
                  >
                    +
                  </button>
                </div>
                <div className="flex justify-between text-sm text-gray-500 mt-1">
                  <span>Stok: {selectedBarang.stok}</span>
                  <span className="font-medium text-gray-700">Total: {selectedBarang.hargaPoin * jumlah} poin</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Alamat Pengiriman</label>
                <textarea
                  className="mt-1 w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
                  rows="3"
                  placeholder="Masukkan alamat lengkap untuk pengiriman"
                  value={alamat}
                  onChange={(e) => setAlamat(e.target.value)}
                  required
                />
              </div>

              <button
                onClick={() => handleTukar(selectedBarang.id)}
                disabled={!alamat.trim()}
                className="w-full py-3.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 disabled:bg-gray-300 disabled:hover:shadow-none disabled:hover:translate-y-0 disabled:cursor-not-allowed"
              >
                {!alamat.trim() ? '📝 Isi alamat dulu' : `✅ Tukar Sekarang (${selectedBarang.hargaPoin * jumlah} poin)`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Style tambahan untuk animasi */}
      <style jsx>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-slideDown {
          animation: slideDown 0.3s ease-out;
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        .animate-scaleIn {
          animation: scaleIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
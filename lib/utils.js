// lib/utils.js
export function formatDate(date) {
  return new Date(date).toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatCurrency(amount) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
  }).format(amount);
}

export function getStatusColor(status) {
  const colors = {
    MENUNGGU: 'bg-yellow-100 text-yellow-800',
    DIPROSES: 'bg-blue-100 text-blue-800',
    SELESAI: 'bg-green-100 text-green-800',
    BELUM_DIANGKUT: 'bg-gray-100 text-gray-800',
    SEDANG_DIANGKUT: 'bg-orange-100 text-orange-800',
    SUDAH_DIANGKUT: 'bg-green-100 text-green-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}

export function getStatusLabel(status) {
  const labels = {
    MENUNGGU: 'Menunggu',
    DIPROSES: 'Diproses',
    SELESAI: 'Selesai',
    BELUM_DIANGKUT: 'Belum Diangkut',
    SEDANG_DIANGKUT: 'Sedang Diangkut',
    SUDAH_DIANGKUT: 'Sudah Diangkut',
  };
  return labels[status] || status;
}
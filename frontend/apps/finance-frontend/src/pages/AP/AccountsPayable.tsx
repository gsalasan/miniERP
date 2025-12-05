// Accounts Payable (AP) - Manajemen Utang
// Per TSD FITUR 3.4.B - FIN-13

import React, { useState, useEffect } from 'react';
import {
  DocumentTextIcon,
  CurrencyDollarIcon,
  BuildingOfficeIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  CheckCircleIcon,
  ClockIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

interface Payable {
  id: string;
  payable_number: string;
  vendor_name: string;
  vendor_address?: string;
  vendor_npwp?: string;
  bill_date: string;
  due_date: string;
  type: 'GOODS' | 'SERVICES';
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  paid_amount: number;
  remaining_amount: number;
  status: 'DRAFT' | 'APPROVED' | 'PARTIALLY_PAID' | 'PAID';
  notes?: string;
}

const AccountsPayable: React.FC = () => {
  const [payables, setPayables] = useState<Payable[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPayable, setSelectedPayable] = useState<Payable | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch payables from API
  useEffect(() => {
    fetchPayables();
  }, []);

  const fetchPayables = async () => {
    try {
      console.log('📡 Fetching payables from API...');
      const response = await fetch('/api/payables');
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Payables loaded:', data.data?.length || 0);
        setPayables(data.data || []);
      } else {
        console.error('❌ Failed to fetch payables:', response.status);
        setPayables([]);
      }
    } catch (error) {
      console.error('❌ Error fetching payables:', error);
      setPayables([]);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'bg-gray-100 text-gray-800 border border-gray-300';
      case 'APPROVED': return 'bg-yellow-100 text-yellow-800 border border-yellow-300';
      case 'PARTIALLY_PAID': return 'bg-blue-100 text-blue-800 border border-blue-300';
      case 'PAID': return 'bg-green-100 text-green-800 border border-green-300';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      DRAFT: 'Draft',
      APPROVED: 'Disetujui',
      PARTIALLY_PAID: 'Sebagian Dibayar',
      PAID: 'Lunas',
    };
    return labels[status] || status;
  };

  const totalPayable = payables
    .filter(p => p.status !== 'PAID')
    .reduce((sum, p) => sum + p.remaining_amount, 0);

  const overdueAmount = payables
    .filter(p => p.status !== 'PAID' && new Date(p.due_date) < new Date())
    .reduce((sum, p) => sum + p.remaining_amount, 0);

  const filteredPayables = payables.filter(p => {
    const matchesSearch = p.vendor_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         p.payable_number.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !statusFilter || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-red-700 to-red-500 rounded-3xl shadow-2xl p-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-orange-500/30 rounded-full blur-3xl"></div>
        
        <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
                <BuildingOfficeIcon className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-white drop-shadow-lg">Manajemen Utang (AP)</h1>
            </div>
            <p className="text-white/90 text-lg font-medium drop-shadow">
              💸 Kelola tagihan vendor dan pembayaran utang perusahaan
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs bg-white/25 text-white px-3 py-1 rounded-full backdrop-blur-sm font-medium">
                TSD FITUR 3.4.B - Accounts Payable
              </span>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-white text-red-600 rounded-xl hover:bg-gray-100 transition-colors font-semibold shadow-lg flex items-center gap-2"
            >
              <PlusIcon className="w-5 h-5" />
              Catat Tagihan Vendor
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-600 mb-1">Total Utang</p>
              <p className="text-3xl font-bold text-gray-900">{formatCurrency(totalPayable)}</p>
              <p className="text-xs text-gray-500 mt-1">{payables.filter(p => p.status !== 'PAID').length} tagihan</p>
            </div>
            <div className="bg-red-100 p-4 rounded-xl">
              <DocumentTextIcon className="w-10 h-10 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-600 mb-1">Jatuh Tempo</p>
              <p className="text-3xl font-bold text-orange-600">{formatCurrency(overdueAmount)}</p>
              <p className="text-xs text-gray-500 mt-1">Segera bayar!</p>
            </div>
            <div className="bg-orange-100 p-4 rounded-xl">
              <ClockIcon className="w-10 h-10 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-600 mb-1">Total Vendor</p>
              <p className="text-3xl font-bold text-gray-900">
                {new Set(payables.map(p => p.vendor_name)).size}
              </p>
              <p className="text-xs text-gray-500 mt-1">Vendor aktif</p>
            </div>
            <div className="bg-green-100 p-4 rounded-xl">
              <BuildingOfficeIcon className="w-10 h-10 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari vendor atau nomor tagihan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent"
          >
            <option value="">Semua Status</option>
            <option value="DRAFT">Draft</option>
            <option value="APPROVED">Disetujui</option>
            <option value="PARTIALLY_PAID">Sebagian Dibayar</option>
            <option value="PAID">Lunas</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-red-700 to-red-500">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase">No. Tagihan</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase">Vendor</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase">Tanggal</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase">Jatuh Tempo</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-white uppercase">Total</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-white uppercase">Sisa Bayar</th>
                <th className="px-6 py-4 text-center text-xs font-bold text-white uppercase">Status</th>
                <th className="px-6 py-4 text-center text-xs font-bold text-white uppercase">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filteredPayables.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    <BuildingOfficeIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                    <p className="text-lg font-semibold">Belum ada tagihan vendor</p>
                    <p className="text-sm mt-2">Klik "Catat Tagihan Vendor" untuk menambahkan</p>
                  </td>
                </tr>
              ) : (
                filteredPayables.map((payable) => (
                  <tr key={payable.id} className="hover:bg-red-50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-gray-900">{payable.payable_number}</td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900">{payable.vendor_name}</div>
                      <div className="text-xs text-gray-500">{payable.type === 'GOODS' ? 'Barang' : 'Jasa'}</div>
                    </td>
                    <td className="px-6 py-4 text-sm">{formatDate(payable.bill_date)}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={new Date(payable.due_date) < new Date() ? 'text-red-600 font-semibold' : ''}>
                        {formatDate(payable.due_date)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-semibold">{formatCurrency(payable.total_amount)}</td>
                    <td className="px-6 py-4 text-right font-bold text-red-600">{formatCurrency(payable.remaining_amount)}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(payable.status)}`}>
                        {payable.status === 'PAID' && <CheckCircleIcon className="w-4 h-4 mr-1" />}
                        {getStatusLabel(payable.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {payable.status === 'APPROVED' && (
                        <button
                          onClick={() => {
                            setSelectedPayable(payable);
                            setShowPaymentModal(true);
                          }}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-green-500 to-green-600 text-white text-sm font-bold shadow-md hover:shadow-lg transition-all"
                        >
                          <CurrencyDollarIcon className="w-4 h-4" />
                          Bayar
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* TODO: Modals akan ditambahkan berikutnya */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Coming Soon</h2>
            <p className="text-gray-600 mb-6">
              Modal untuk catat tagihan vendor akan segera tersedia.
            </p>
            <button
              onClick={() => setShowCreateModal(false)}
              className="px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-semibold"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {showPaymentModal && selectedPayable && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Coming Soon</h2>
            <p className="text-gray-600 mb-6">
              Modal untuk catat pembayaran utang akan segera tersedia.
            </p>
            <button
              onClick={() => {
                setShowPaymentModal(false);
                setSelectedPayable(null);
              }}
              className="px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-semibold"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountsPayable;

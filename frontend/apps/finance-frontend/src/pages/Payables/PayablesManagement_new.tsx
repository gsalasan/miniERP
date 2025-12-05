import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DocumentTextIcon,
  PlusIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  CurrencyDollarIcon,
  CalendarDaysIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

interface PayableItem {
  description: string;
  po_qty: number;
  received_qty: number | null;
  invoice_qty: number;
  unit_price: number;
  total: number;
  matched: boolean;
}

interface Payable {
  id: number;
  vendor_invoice_number: string;
  po_number: string;
  vendor_name: string;
  invoice_date: Date;
  due_date: Date;
  subtotal: number;
  tax_ppn: number;
  tax_pph23: number;
  total_amount: number;
  paid_amount: number;
  status: 'PENDING' | 'READY_TO_PAY' | 'PAID' | 'DISPUTE';
  matching_status: 'MATCHED' | 'MISMATCH' | 'PENDING';
  po_matched: boolean;
  gr_matched: boolean;
  payment_terms: string;
  notes: string;
  items?: PayableItem[];
  payments?: any[];
}

interface APSummary {
  totalPayable: number;
  dueThisWeek: number;
}

const PayablesManagement: React.FC = () => {
  const navigate = useNavigate();
  const [payables, setPayables] = useState<Payable[]>([]);
  const [apSummary, setAPSummary] = useState<APSummary>({
    totalPayable: 0,
    dueThisWeek: 0,
  });
  const [loading, setLoading] = useState(true);
  const [selectedPayable, setSelectedPayable] = useState<Payable | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [bankAccount, setBankAccount] = useState('BCA 1234567890');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load Payables
      const response = await fetch('/api/payables');
      const result = await response.json();
      
      if (result.success) {
        setPayables(result.data);
      }

      // Load AP Summary
      const summaryResponse = await fetch('/api/payables/summary/ap');
      const summaryResult = await summaryResponse.json();
      
      if (summaryResult.success) {
        setAPSummary(summaryResult.data);
      }
    } catch (error) {
      console.error('Failed to load payables:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRecordPayment = async () => {
    if (!selectedPayable) return;
    
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      alert('Jumlah pembayaran tidak valid');
      return;
    }

    try {
      const response = await fetch(`/api/payables/${selectedPayable.id}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payment_date: paymentDate,
          amount,
          bank_account: bankAccount,
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        alert('Pembayaran berhasil dicatat!');
        setShowPaymentModal(false);
        loadData();
      } else {
        alert(result.message || 'Gagal mencatat pembayaran');
      }
    } catch (error) {
      console.error('Error recording payment:', error);
      alert('Gagal mencatat pembayaran');
    }
  };

  const openPaymentModal = (payable: Payable) => {
    setSelectedPayable(payable);
    setPaymentAmount(payable.total_amount.toString());
    setShowPaymentModal(true);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'READY_TO_PAY':
        return 'bg-blue-100 text-blue-800';
      case 'PAID':
        return 'bg-green-100 text-green-800';
      case 'DISPUTE':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      PENDING: 'Pending Validasi',
      READY_TO_PAY: 'Siap Dibayar',
      PAID: 'Lunas',
      DISPUTE: 'Sengketa',
    };
    return labels[status] || status;
  };

  const getMatchingBadge = (status: string) => {
    if (status === 'MATCHED') {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircleIcon className="w-4 h-4 mr-1" />
          3-Way Match ✓
        </span>
      );
    } else if (status === 'MISMATCH') {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <XCircleIcon className="w-4 h-4 mr-1" />
          Tidak Cocok
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
        Pending
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-primary-dark to-primary-light rounded-2xl shadow-lg p-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold mb-2 text-white">
              Manajemen Utang (Accounts Payable)
            </h1>
            <p className="text-white/90 text-lg">
              Catat tagihan vendor, validasi dengan 3-way matching, dan kelola pembayaran
            </p>
            <p className="text-xs text-accent-gold mt-1">TSD FITUR 3.4.B</p>
          </div>
          <button
            onClick={() => navigate('/payables/new')}
            className="flex items-center gap-2 bg-white text-rose-600 px-6 py-3 rounded-lg font-semibold hover:bg-rose-50 transition-all shadow-md"
          >
            <PlusIcon className="w-5 h-5" />
            Catat Tagihan Vendor
          </button>
        </div>
      </div>

      {/* AP Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Total Utang */}
        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-orange-300 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Utang</p>
              <p className="text-3xl font-bold text-gray-900">
                {formatCurrency(apSummary.totalPayable)}
              </p>
            </div>
            <div className="bg-orange-100 p-3 rounded-lg">
              <DocumentTextIcon className="w-8 h-8 text-orange-600" />
            </div>
          </div>
        </div>

        {/* Jatuh Tempo Minggu Ini */}
        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-yellow-300 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Jatuh Tempo Minggu Ini</p>
              <p className="text-3xl font-bold text-yellow-600">
                {formatCurrency(apSummary.dueThisWeek)}
              </p>
            </div>
            <div className="bg-yellow-100 p-3 rounded-lg">
              <CalendarDaysIcon className="w-8 h-8 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Payables Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  No. Tagihan Vendor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vendor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  PO Terkait
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Jatuh Tempo
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Nilai
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  3-Way Match
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                      <p>Memuat data payables...</p>
                    </div>
                  </td>
                </tr>
              ) : payables.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    <DocumentTextIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium">Belum ada tagihan vendor</p>
                    <p className="text-sm">Klik "Catat Tagihan Vendor" untuk mencatat tagihan baru</p>
                  </td>
                </tr>
              ) : (
                payables.map((payable) => (
                  <tr key={payable.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-blue-600">{payable.vendor_invoice_number}</div>
                      <div className="text-xs text-gray-500">{new Date(payable.invoice_date).toLocaleDateString('id-ID')}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{payable.vendor_name}</div>
                      <div className="text-xs text-gray-500">{payable.payment_terms}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{payable.po_number}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        <CalendarDaysIcon className="w-4 h-4 mr-1 text-gray-400" />
                        {new Date(payable.due_date).toLocaleDateString('id-ID')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-sm font-semibold text-gray-900">{formatCurrency(payable.total_amount)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {getMatchingBadge(payable.matching_status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(payable.status)}`}>
                        {payable.status === 'PAID' && <CheckCircleIcon className="w-4 h-4 mr-1" />}
                        {payable.status === 'DISPUTE' && <ExclamationTriangleIcon className="w-4 h-4 mr-1" />}
                        {getStatusLabel(payable.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {payable.status === 'READY_TO_PAY' && (
                        <button
                          onClick={() => openPaymentModal(payable)}
                          className="text-green-600 hover:text-green-900 px-3 py-1 rounded-lg bg-green-50 hover:bg-green-100 text-xs font-medium"
                        >
                          Catat Bayar
                        </button>
                      )}
                      {payable.status === 'PAID' && (
                        <span className="text-xs text-gray-500">Lunas</span>
                      )}
                      {payable.status === 'DISPUTE' && (
                        <button className="text-red-600 hover:text-red-900 px-3 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-xs font-medium">
                          Tinjau
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

      {/* Payment Modal */}
      {showPaymentModal && selectedPayable && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 m-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Catat Pembayaran Utang</h3>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Vendor Invoice</div>
              <div className="font-semibold text-gray-900">{selectedPayable.vendor_invoice_number}</div>
              <div className="text-sm text-gray-600 mt-2">Vendor</div>
              <div className="font-medium text-gray-900">{selectedPayable.vendor_name}</div>
              <div className="text-sm text-gray-600 mt-2">Total Tagihan</div>
              <div className="font-bold text-gray-900 text-lg">{formatCurrency(selectedPayable.total_amount)}</div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tanggal Pembayaran *
                </label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Jumlah Dibayar (Rp) *
                </label>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dari Akun Bank *
                </label>
                <select
                  value={bankAccount}
                  onChange={(e) => setBankAccount(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="BCA 1234567890">BCA 1234567890</option>
                  <option value="Mandiri 9876543210">Mandiri 9876543210</option>
                  <option value="BNI 5555666677">BNI 5555666677</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleRecordPayment}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                Konfirmasi Pembayaran
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayablesManagement;

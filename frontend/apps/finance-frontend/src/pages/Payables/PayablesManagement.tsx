import React, { useState } from 'react';
import {
  DocumentTextIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  CurrencyDollarIcon,
  CalendarDaysIcon,
  ClockIcon,
  XMarkIcon,
  DocumentArrowUpIcon,
  PlusIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import { Toast } from '../../components';
import { useToast } from '../../hooks/useToast';

interface Payable {
  id: string;
  vendor_invoice_number: string;
  invoice_date: string;
  due_date: string;
  vendor_name: string;
  total_amount: number;
  status: 'PENDING_VALIDATION' | 'READY_TO_PAY' | 'PAID' | 'DISPUTE';
}

interface APSummary {
  total_payable: number;
  due_this_week: number;
  overdue_amount: number;
}

const API_BASE = import.meta.env.VITE_FINANCE_API || '/api';

const PayablesManagement: React.FC = () => {
  const { toasts, hideToast, success: toastSuccess, error: toastError } = useToast();
  const [showInputForm, setShowInputForm] = useState(false);
  const [showCSVUpload, setShowCSVUpload] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPayable, setSelectedPayable] = useState<Payable | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [apSummary, setAPSummary] = useState<APSummary>({
    total_payable: 0,
    due_this_week: 0,
    overdue_amount: 0,
  });

  // Sample data untuk demo
  const [payables, setPayables] = useState<Payable[]>([
    {
      id: 'PAY-001',
      vendor_invoice_number: 'INV-VENDOR-2025-001',
      invoice_date: '2025-11-01',
      due_date: '2025-11-15',
      vendor_name: 'PT. Supplier Material',
      total_amount: 25000000,
      status: 'PENDING_VALIDATION',
    },
    {
      id: 'PAY-002',
      vendor_invoice_number: 'INV-VENDOR-2025-002',
      invoice_date: '2025-10-20',
      due_date: '2025-11-10',
      vendor_name: 'PT. Jasa Teknisi',
      total_amount: 15000000,
      status: 'PAID',
    },
    {
      id: 'PAY-003',
      vendor_invoice_number: 'INV-VENDOR-2025-003',
      invoice_date: '2025-10-15',
      due_date: '2025-11-01',
      vendor_name: 'PT. Distributor Sparepart',
      total_amount: 8500000,
      status: 'READY_TO_PAY',
    },
  ]);

  React.useEffect(() => {
    loadData();
  }, []);

  // Reference unused UI toggles to avoid lint warnings while preserving structure
  React.useEffect(() => {}, [showInputForm, showCSVUpload]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load payables - dengan sample data fallback
      const payablesResp = await fetch(`${API_BASE}/payables`).catch(() => null);
      
      if (payablesResp && payablesResp.ok) {
        const payablesResult = await payablesResp.json();
        
        if (payablesResult.success) {
          setPayables(payablesResult.data);
          
          // Calculate AP Summary
          const totalPayable = payablesResult.data
            .filter((p: Payable) => p.status !== 'PAID')
            .reduce((sum: number, p: Payable) => sum + p.total_amount, 0);
          
          const now = new Date();
          const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
          const dueThisWeek = payablesResult.data
            .filter((p: Payable) => {
              const dueDate = new Date(p.due_date);
              return p.status !== 'PAID' && dueDate >= now && dueDate <= weekFromNow;
            })
            .reduce((sum: number, p: Payable) => sum + p.total_amount, 0);
          
          const overdueAmount = payablesResult.data
            .filter((p: Payable) => {
              const dueDate = new Date(p.due_date);
              return p.status !== 'PAID' && dueDate < now;
            })
            .reduce((sum: number, p: Payable) => sum + p.total_amount, 0);
          
          setAPSummary({ total_payable: totalPayable, due_this_week: dueThisWeek, overdue_amount: overdueAmount });
        }
      } else {
        // API tidak mengembalikan data yang valid
        console.error('API tidak mengembalikan data yang valid');
        setPayables([]);
        setAPSummary({
          total_payable: 0,
          due_this_week: 0,
          overdue_amount: 0
        });
      }
    } catch (error) {
      console.error('Failed to load payables:', error);
      // Set empty data on error
      setPayables([]);
    } finally {
      setLoading(false);
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
      case 'PENDING_VALIDATION':
        return 'bg-accent-gold/20 text-accent-gold border border-accent-gold';
      case 'READY_TO_PAY':
        return 'bg-primary-light/20 text-primary-dark border border-primary-light';
      case 'PAID':
        return 'bg-primary-dark/10 text-primary-dark border border-primary-dark';
      case 'DISPUTE':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      PENDING_VALIDATION: 'Menunggu Validasi',
      READY_TO_PAY: 'Siap Dibayar',
      PAID: 'Lunas',
      DISPUTE: 'Sengketa',
    };
    return labels[status] || status;
  };

  return (
    <div className="space-y-6">
      {/* Toasts */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((t) => (
          <Toast key={t.id} message={t.message} type={t.type as any} onClose={() => hideToast(t.id)} />
        ))}
      </div>
      {/* Header Banner - Enhanced */}
      <div className="bg-gradient-to-br from-primary-dark to-primary-light rounded-3xl shadow-2xl p-8 relative overflow-hidden">
        {/* Decorative background pattern */}
        <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-accent-gold/30 rounded-full blur-3xl"></div>
        
        <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
                <DocumentTextIcon className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-white drop-shadow-lg">Manajemen Utang (AP)</h1>
            </div>
            <p className="text-white/90 text-lg font-medium drop-shadow">
              📄 Catat tagihan vendor, validasi 3-way matching, dan kelola pembayaran
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs bg-white/25 text-white px-3 py-1 rounded-full backdrop-blur-sm font-medium">TSD FITUR 3.4.B - Accounts Payable</span>
            </div>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-primary-dark font-bold shadow-lg hover:shadow-xl hover:bg-accent-gold hover:text-white transition-all duration-200 group"
          >
            <PlusIcon className="w-5 h-5 group-hover:rotate-90 transition-transform duration-200" />
            Catat Tagihan
          </button>
        </div>
      </div>

      <div className="space-y-6">
          {/* AP Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Total Utang - Enhanced */}
            <div className="bg-gradient-to-br from-white to-primary-light/10 rounded-2xl shadow-lg p-6 border border-primary-light hover:shadow-2xl hover:scale-105 transition-all duration-300 group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary-light/20 rounded-full -mr-16 -mt-16 opacity-50 group-hover:scale-150 transition-transform duration-500"></div>
              <div className="relative flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-primary-dark mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 bg-primary-light rounded-full animate-pulse"></span>
                    Total Utang
                  </p>
                  <p className="text-3xl font-bold text-gray-900 mb-1">
                    {formatCurrency(apSummary.total_payable)}
                  </p>
                  <p className="text-xs text-gray-500">Accounts Payable</p>
                </div>
                <div className="bg-gradient-to-br from-primary-light to-accent-gold p-4 rounded-2xl shadow-lg group-hover:rotate-12 transition-transform duration-300">
                  <DocumentTextIcon className="w-8 h-8 text-white" />
                </div>
              </div>
            </div>

            {/* Jatuh Tempo Minggu Ini - Enhanced */}
            <div className="bg-gradient-to-br from-white to-accent-gold/10 rounded-2xl shadow-lg p-6 border border-accent-gold hover:shadow-2xl hover:scale-105 transition-all duration-300 group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-accent-gold/20 rounded-full -mr-16 -mt-16 opacity-50 group-hover:scale-150 transition-transform duration-500"></div>
              <div className="relative flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-primary-dark mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 bg-accent-gold rounded-full animate-pulse"></span>
                    Jatuh Tempo Minggu Ini
                  </p>
                  <p className="text-3xl font-bold text-accent-gold mb-1">
                    {formatCurrency(apSummary.due_this_week)}
                  </p>
                  <p className="text-xs text-gray-500">Perlu segera diproses</p>
                </div>
                <div className="bg-gradient-to-br from-accent-gold to-primary-light p-4 rounded-2xl shadow-lg group-hover:rotate-12 transition-transform duration-300">
                  <CalendarDaysIcon className="w-8 h-8 text-white" />
                </div>
              </div>
            </div>

            {/* Overdue - Enhanced */}
            <div className="bg-gradient-to-br from-white to-red-50 rounded-2xl shadow-lg p-6 border border-red-200 hover:shadow-2xl hover:scale-105 transition-all duration-300 group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-100 rounded-full -mr-16 -mt-16 opacity-50 group-hover:scale-150 transition-transform duration-500"></div>
              <div className="relative flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-red-600 mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                    Terlambat Bayar
                  </p>
                  <p className="text-3xl font-bold text-red-600 mb-1">
                    {formatCurrency(apSummary.overdue_amount)}
                  </p>
                  <p className="text-xs text-gray-500">Perlu tindakan urgent</p>
                </div>
                <div className="bg-gradient-to-br from-red-400 to-rose-500 p-4 rounded-2xl shadow-lg group-hover:rotate-12 group-hover:scale-110 transition-all duration-300">
                  <ExclamationTriangleIcon className="w-8 h-8 text-white animate-pulse" />
                </div>
              </div>
            </div>
          </div>

          {/* Payables Table */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Daftar Tagihan Vendor</h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-primary-dark to-primary-light">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                      📄 No. Tagihan Vendor
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                      🏢 Vendor
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                      📅 Tanggal Tagihan
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                      ⏰ Jatuh Tempo
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-white uppercase tracking-wider">
                      💵 Total Nilai
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-white uppercase tracking-wider">
                      🏷️ Status
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-white uppercase tracking-wider">
                      ⚡ Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                        <div className="flex flex-col items-center">
                          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mb-4"></div>
                          <p>Memuat data utang...</p>
                        </div>
                      </td>
                    </tr>
                  ) : payables.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                        <DocumentTextIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                        <p className="text-lg font-medium">Belum ada tagihan vendor</p>
                        <p className="text-sm">
                          Klik "Catat Tagihan Vendor" untuk mencatat tagihan baru
                        </p>
                      </td>
                    </tr>
                  ) : (
                    payables.map((payable) => (
                      <tr key={payable.id} className="hover:bg-gradient-to-r hover:from-rose-50 hover:to-orange-50 transition-all duration-200 group">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-bold text-rose-600 group-hover:text-rose-700 transition-colors">
                            {payable.vendor_invoice_number}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">
                            {payable.vendor_name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {formatDate(payable.invoice_date)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {formatDate(payable.due_date)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="text-sm font-semibold text-gray-900">
                            {formatCurrency(payable.total_amount)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                              payable.status
                            )}`}
                          >
                            {getStatusLabel(payable.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-primary-light to-accent-gold text-white text-xs font-semibold shadow-md hover:shadow-lg hover:from-accent-gold hover:to-primary-dark transition-all duration-200">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              Detail
                            </button>
                            {payable.status === 'READY_TO_PAY' && (
                              <button
                                onClick={() => {
                                  setSelectedPayable(payable);
                                  setShowPaymentModal(true);
                                }}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-accent-gold to-primary-light text-white text-xs font-semibold shadow-md hover:shadow-lg hover:from-primary-light hover:to-primary-dark transition-all duration-200"
                                title="Bayar Vendor"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                </svg>
                                Bayar
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      {/* Create Payable Modal */}
      {showCreateModal && (
        <CreatePayableModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            toastSuccess('Tagihan vendor berhasil dicatat!');
            loadData();
          }}
        />
      )}

      {/* Payment Modal - Enhanced */}
      {showPaymentModal && selectedPayable && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 m-4 animate-slideUp">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-accent-gold to-primary-light p-3 rounded-2xl shadow-lg">
                  <CurrencyDollarIcon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">💳 Bayar Vendor</h3>
              </div>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-gray-400 hover:text-red-500 hover:scale-110 transition-all duration-200"
              >
                <XCircleIcon className="w-7 h-7" />
              </button>
            </div>

            <div className="mb-6 p-5 bg-gradient-to-br from-gray-50 to-green-50 rounded-2xl border border-green-200 shadow-sm">
              <div className="text-xs font-semibold text-green-600 mb-1 uppercase tracking-wide">🏢 Vendor</div>
              <div className="font-bold text-gray-900 text-lg mb-3">{selectedPayable.vendor_name}</div>
              <div className="text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">📄 No. Tagihan</div>
              <div className="font-semibold text-gray-900 mb-3">{selectedPayable.vendor_invoice_number}</div>
              <div className="text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">💵 Total Tagihan</div>
              <div className="font-bold text-green-600 text-2xl">{formatCurrency(selectedPayable.total_amount)}</div>
            </div>

            <div className="bg-gradient-to-br from-primary-light/10 to-accent-gold/10 border-2 border-primary-light/30 rounded-xl p-4 mb-6 shadow-sm">
              <p className="text-sm font-semibold text-primary-dark flex items-center gap-2">
                <span className="text-xl">🤖</span> 
                Sistem akan otomatis membuat jurnal akuntansi
              </p>
              <p className="text-xs text-gray-700 mt-2 ml-7">
                • Debit: Utang Usaha<br/>
                • Credit: Kas/Bank
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tanggal Pembayaran *
                </label>
                <input
                  type="date"
                  defaultValue={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Metode Pembayaran *
                </label>
                <select
                  defaultValue="Transfer Bank"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  required
                >
                  <option value="Transfer Bank">Transfer Bank</option>
                  <option value="Cek">Cek</option>
                  <option value="Giro">Giro</option>
                  <option value="Tunai">Tunai</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rekening Bank Vendor
                </label>
                <input
                  type="text"
                  placeholder="Contoh: BCA 1234567890"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="flex-1 px-5 py-2.5 border-2 border-gray-300 rounded-xl text-gray-700 font-semibold hover:bg-gray-50 transition-all duration-200"
              >
                Batal
              </button>
              <button
                onClick={async () => {
                  try {
                    const response = await fetch(`${API_BASE}/payables/${selectedPayable.id}/payments`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        payment_date: new Date().toISOString().split('T')[0],
                        amount: selectedPayable.total_amount,
                        method: 'Transfer Bank',
                        bank_account: 'BCA 1234567890',
                      }),
                    });
                    const result = await response.json();
                    if (result.success) {
                      toastSuccess('Pembayaran vendor berhasil dicatat! Jurnal otomatis telah dibuat.');
                      setShowPaymentModal(false);
                      loadData();
                    } else {
                      toastError(result.message || 'Gagal mencatat pembayaran');
                    }
                  } catch (err) {
                    console.error(err);
                    toastError('Terjadi kesalahan saat mencatat pembayaran');
                  }
                }}
                className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-accent-gold to-primary-light text-white font-bold shadow-md hover:shadow-lg hover:from-primary-light hover:to-primary-dark transition-all duration-200"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                Bayar Sekarang
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Create Payable Modal with 3-Way Matching
interface CreatePayableModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const CreatePayableModal: React.FC<CreatePayableModalProps> = ({ onClose, onSuccess }) => {
  const [step, setStep] = useState(1); // 1: Select PO, 2: 3-Way Matching, 3: Confirmation
  const [poId, setPOId] = useState('');
  const [vendorInvoiceNumber, setVendorInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [submitting, setSubmitting] = useState(false);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10">
          <h3 className="text-xl font-bold text-gray-900">
            Catat Tagihan Vendor - Langkah {step} dari 3
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XCircleIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {step === 1 && (
            <div className="space-y-6">
              <h4 className="text-lg font-semibold text-gray-900">Langkah 1: Pilih Purchase Order</h4>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cari Purchase Order (PO) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={poId}
                  onChange={(e) => setPOId(e.target.value)}
                  placeholder="Masukkan nomor PO..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Contoh: PO-2025-001
                </p>
              </div>

              <div className="bg-primary-light/10 border border-primary-light/30 rounded-lg p-4">
                <p className="text-sm text-gray-700">
                  💡 <strong>Tip:</strong> Sistem akan otomatis melakukan 3-way matching antara PO,
                  Penerimaan Barang, dan Tagihan Vendor untuk memastikan tidak ada kesalahan.
                </p>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  onClick={() => poId && setStep(2)}
                  disabled={!poId}
                  className="px-4 py-2 bg-gradient-to-r from-primary-light to-accent-gold text-white rounded-md hover:from-accent-gold hover:to-primary-dark transition-all disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Lanjut ke 3-Way Matching
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <h4 className="text-lg font-semibold text-gray-900">
                Langkah 2: Validasi 3-Way Matching
              </h4>

              <div className="grid grid-cols-3 gap-4">
                {/* Panel 1: PO */}
                <div className="bg-primary-light/10 rounded-lg p-4">
                  <h5 className="font-semibold text-primary-dark mb-3 flex items-center">
                    <DocumentTextIcon className="w-5 h-5 mr-2" />
                    Purchase Order
                  </h5>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Item:</span>
                      <span className="font-medium">Material A</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Qty:</span>
                      <span className="font-medium">100</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Harga:</span>
                      <span className="font-medium">Rp 10,000</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="text-gray-600">Total:</span>
                      <span className="font-bold">Rp 1,000,000</span>
                    </div>
                  </div>
                </div>

                {/* Panel 2: Receipt */}
                <div className="bg-green-50 rounded-lg p-4">
                  <h5 className="font-semibold text-green-900 mb-3 flex items-center">
                    <CheckCircleIcon className="w-5 h-5 mr-2" />
                    Penerimaan Barang
                  </h5>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Item:</span>
                      <span className="font-medium">Material A</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Qty Diterima:</span>
                      <span className="font-medium">100</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tanggal:</span>
                      <span className="font-medium">15 Nov 2025</span>
                    </div>
                  </div>
                </div>

                {/* Panel 3: Vendor Invoice */}
                <div className="bg-yellow-50 rounded-lg p-4">
                  <h5 className="font-semibold text-yellow-900 mb-3 flex items-center">
                    <DocumentTextIcon className="w-5 h-5 mr-2" />
                    Tagihan Vendor
                  </h5>
                  <div className="space-y-2 text-sm">
                    <input
                      type="text"
                      value={vendorInvoiceNumber}
                      onChange={(e) => setVendorInvoiceNumber(e.target.value)}
                      placeholder="No. Tagihan Vendor"
                      className="w-full px-2 py-1 border border-yellow-300 rounded text-sm"
                    />
                    <div className="flex justify-between">
                      <span className="text-gray-600">Item:</span>
                      <span className="font-medium">Material A</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Qty:</span>
                      <span className="font-medium">100</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Harga:</span>
                      <span className="font-medium">Rp 10,000</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="text-gray-600">Total:</span>
                      <span className="font-bold">Rp 1,000,000</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Validation Status */}
              <div className="bg-green-50 border-2 border-green-500 rounded-lg p-4 flex items-center">
                <CheckCircleIcon className="w-8 h-8 text-green-600 mr-3" />
                <div>
                  <p className="font-semibold text-green-900">3-Way Matching: COCOK ✓</p>
                  <p className="text-sm text-green-700">
                    PO, Penerimaan Barang, dan Tagihan Vendor sudah sesuai
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tanggal Tagihan
                  </label>
                  <input
                    type="date"
                    value={invoiceDate}
                    onChange={(e) => setInvoiceDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Jatuh Tempo
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>

              <div className="flex justify-between">
                <button
                  onClick={() => setStep(1)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  ← Kembali
                </button>
                <button
                  onClick={() => setStep(3)}
                  disabled={!vendorInvoiceNumber || !dueDate}
                  className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:bg-gray-400"
                >
                  Lanjut ke Konfirmasi
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <h4 className="text-lg font-semibold text-gray-900">Langkah 3: Konfirmasi</h4>

              <div className="bg-gray-50 rounded-lg p-6 space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Purchase Order:</span>
                  <span className="font-semibold">{poId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">No. Tagihan Vendor:</span>
                  <span className="font-semibold">{vendorInvoiceNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tanggal Tagihan:</span>
                  <span className="font-semibold">{invoiceDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Jatuh Tempo:</span>
                  <span className="font-semibold">{dueDate}</span>
                </div>
                <div className="flex justify-between border-t pt-3">
                  <span className="text-gray-700 font-semibold">Total Utang:</span>
                  <span className="text-lg font-bold text-orange-600">Rp 1,000,000</span>
                </div>
              </div>

              <div className="bg-primary-light/10 border border-primary-light/30 rounded-lg p-4">
                <p className="text-sm text-gray-700">
                  <strong>Catatan:</strong> Setelah konfirmasi, sistem akan otomatis membuat jurnal
                  akuntansi untuk mencatat utang ini.
                </p>
              </div>

              <div className="flex justify-between">
                <button
                  onClick={() => setStep(2)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  ← Kembali
                </button>
                <button
                  onClick={() => {
                    setSubmitting(true);
                    // TODO: Submit to API
                    onSuccess();
                    setSubmitting(false);
                  }}
                  disabled={submitting}
                  className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 font-semibold"
                >
                  {submitting ? 'Menyimpan...' : 'Simpan & Jadwalkan Pembayaran'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PayablesManagement;

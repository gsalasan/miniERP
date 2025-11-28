import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DocumentTextIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  ClockIcon,
  CurrencyDollarIcon,
  CalendarDaysIcon,
  EyeIcon,
  XMarkIcon,
  ArrowUpTrayIcon,
  DocumentArrowDownIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/solid';
import InvoiceImport from './InvoiceImport';
import { Toast } from '../../components';
import { useToast } from '../../hooks/useToast';

interface InvoiceItem {
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

interface InvoicePayment {
  payment_date: Date;
  amount: number;
  method: string;
  reference: string;
}

interface Invoice {
  id: number;
  invoice_number: string;
  invoice_date: Date;
  due_date: Date;
  customer_name: string;
  project_name: string;
  customer_po: string;
  subtotal: number;
  discount: number;
  tax_ppn: number;
  tax_pph23: number;
  total_amount: number;
  paid_amount: number;
  remaining_amount: number;
  status: 'DRAFT' | 'SENT' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE';
  payment_terms: string;
  notes: string;
  created_at: Date;
  updated_at: Date;
  items?: InvoiceItem[];
  payments?: InvoicePayment[];
}

interface ARSummary {
  totalReceivable: number;
  overdue: number;
  avgDSO: number;
}

const InvoiceManagement: React.FC = () => {
  const navigate = useNavigate();
  const { toasts, hideToast, success: toastSuccess, error: toastError } = useToast();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [arSummary, setARSummary] = useState<ARSummary>({
    totalReceivable: 0,
    overdue: 0,
    avgDSO: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('Transfer Bank');
  const [paymentReference, setPaymentReference] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const loadData = async () => {
    setLoading(true);
    try {
      const qs: string[] = [];
      if (statusFilter) qs.push(`status=${encodeURIComponent(statusFilter)}`);
      if (searchQuery) qs.push(`q=${encodeURIComponent(searchQuery)}`);
      const response = await fetch(`/api/invoices${qs.length ? `?${qs.join('&')}` : ''}`);
      const result = await response.json();
      
      if (result.success) {
        setInvoices(result.data);
        
        // Calculate AR Summary
        const totalReceivable = result.data
          .filter((inv: Invoice) => inv.status !== 'PAID' && inv.status !== 'DRAFT')
          .reduce((sum: number, inv: Invoice) => sum + inv.remaining_amount, 0);
        
        const overdue = result.data
          .filter((inv: Invoice) => inv.status === 'OVERDUE')
          .reduce((sum: number, inv: Invoice) => sum + inv.remaining_amount, 0);
        
        setARSummary({
          totalReceivable,
          overdue,
          avgDSO: 35, // Days Sales Outstanding
        });
      } else {
        toastError(result.message || 'Gagal memuat data invoice');
      }
    } catch (err) {
      console.error('Failed to load invoices:', err);
      toastError('Gagal memuat data invoice');
    } finally {
      setLoading(false);
    }
  };

  const handleSendInvoice = async () => {
    if (!selectedInvoice) return;
    
    setSubmitting(true);
    try {
      const response = await fetch(`/api/invoices/${selectedInvoice.id}/send`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sent_by: 'User Finance',
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        toastSuccess('Invoice berhasil dikirim! Jurnal otomatis telah dibuat.');
        setShowSendModal(false);
        loadData();
      } else {
        toastError(result.message || 'Gagal mengirim invoice');
      }
    } catch (err) {
      console.error('Error sending invoice:', err);
      toastError('Gagal mengirim invoice');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRecordPayment = async () => {
    if (!selectedInvoice) return;
    
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      toastError('Jumlah pembayaran tidak valid');
      return;
    }

    if (amount > selectedInvoice.remaining_amount) {
      toastError('Jumlah pembayaran melebihi sisa tagihan');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`/api/invoices/${selectedInvoice.id}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payment_date: paymentDate,
          amount,
          method: paymentMethod,
          reference: paymentReference || `PAY-${Date.now()}`,
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        toastSuccess('Pembayaran berhasil dicatat! Jurnal otomatis telah dibuat.');
        setShowPaymentModal(false);
        setPaymentAmount('');
        setPaymentReference('');
        loadData();
      } else {
        toastError(result.message || 'Gagal mencatat pembayaran');
      }
    } catch (err) {
      console.error('Error recording payment:', err);
      toastError('Gagal mencatat pembayaran');
    } finally {
      setSubmitting(false);
    }
  };

  const openSendModal = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setShowSendModal(true);
  };

  const openPaymentModal = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setPaymentAmount(invoice.remaining_amount.toString());
    setShowPaymentModal(true);
  };

  const formatCurrency = (amount: number | string) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(num);
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
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800';
      case 'SENT':
        return 'bg-primary-light/20 text-primary-dark';
      case 'PARTIALLY_PAID':
        return 'bg-accent-gold/20 text-accent-gold border border-accent-gold';
      case 'PAID':
        return 'bg-primary-dark/10 text-primary-dark border border-primary-dark';
      case 'OVERDUE':
        return 'bg-red-100 text-red-800';
      case 'CANCELLED':
        return 'bg-gray-100 text-gray-600';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      DRAFT: 'Draft',
      SENT: 'Terkirim',
      PARTIALLY_PAID: 'Lunas Sebagian',
      PAID: 'Lunas',
      OVERDUE: 'Jatuh Tempo',
      CANCELLED: 'Dibatalkan',
    };
    return labels[status] || status;
  };

  return (
    <div className="space-y-6">
      {/* Toasts */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((t) => (
          <Toast
            key={t.id}
            message={t.message}
            type={t.type as any}
            onClose={() => hideToast(t.id)}
          />
        ))}
      </div>
      {/* Header Banner - Enhanced with better gradient */}
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
              <h1 className="text-4xl font-bold text-white drop-shadow-lg">Manajemen Invoice & Piutang</h1>
            </div>
            <p className="text-white/90 text-lg font-medium drop-shadow">
              💰 Kelola invoice, lacak pembayaran, dan monitor piutang perusahaan
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs bg-white/25 text-white px-3 py-1 rounded-full backdrop-blur-sm font-medium">TSD FITUR 3.4.A - Accounts Receivable</span>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowImportModal(true)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-accent-gold text-white font-bold shadow-lg hover:shadow-xl hover:bg-accent-gold/90 transition-all duration-200 group"
            >
              <ArrowUpTrayIcon className="w-5 h-5 group-hover:translate-y-[-2px] transition-transform duration-200" />
              Import CSV
            </button>
            <button
              onClick={() => navigate('/invoices/new')}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-primary-dark font-bold shadow-lg hover:shadow-xl hover:bg-accent-gold hover:text-white transition-all duration-200 group"
            >
              <PlusIcon className="w-5 h-5 group-hover:rotate-90 transition-transform duration-200" />
              Buat Invoice
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* AR Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Total Piutang - Enhanced */}
          <div className="bg-gradient-to-br from-white to-primary-light/10 rounded-2xl shadow-lg p-6 border border-primary-light hover:shadow-2xl hover:scale-105 transition-all duration-300 group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary-light/20 rounded-full -mr-16 -mt-16 opacity-50 group-hover:scale-150 transition-transform duration-500"></div>
              <div className="relative flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-primary-dark mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 bg-primary-light rounded-full animate-pulse"></span>
                    Total Piutang
                  </p>
                  <p className="text-3xl font-bold text-gray-900 mb-1">
                    {formatCurrency(arSummary.totalReceivable)}
                  </p>
                  <p className="text-xs text-gray-500">Accounts Receivable</p>
                </div>
                <div className="bg-gradient-to-br from-primary-light to-accent-gold p-4 rounded-2xl shadow-lg group-hover:rotate-12 transition-transform duration-300">
                  <CurrencyDollarIcon className="w-8 h-8 text-white" />
                </div>
              </div>
          </div>

          {/* Overdue Amount - Enhanced */}
          <div className="bg-gradient-to-br from-white to-red-50 rounded-2xl shadow-lg p-6 border border-red-200 hover:shadow-2xl hover:scale-105 transition-all duration-300 group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-100 rounded-full -mr-16 -mt-16 opacity-50 group-hover:scale-150 transition-transform duration-500"></div>
              <div className="relative flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-red-600 mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                    Jatuh Tempo (Overdue)
                  </p>
                  <p className="text-3xl font-bold text-red-600 mb-1">
                    {formatCurrency(arSummary.overdue)}
                  </p>
                  <p className="text-xs text-gray-500">Perlu tindak lanjut segera</p>
                </div>
                <div className="bg-gradient-to-br from-red-400 to-rose-500 p-4 rounded-2xl shadow-lg group-hover:rotate-12 group-hover:scale-110 transition-all duration-300">
                  <ExclamationTriangleIcon className="w-8 h-8 text-white animate-pulse" />
                </div>
              </div>
          </div>

          {/* DSO (Days Sales Outstanding) - Enhanced */}
          <div className="bg-gradient-to-br from-white to-accent-gold/10 rounded-2xl shadow-lg p-6 border border-accent-gold hover:shadow-2xl hover:scale-105 transition-all duration-300 group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-accent-gold/20 rounded-full -mr-16 -mt-16 opacity-50 group-hover:scale-150 transition-transform duration-500"></div>
              <div className="relative flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-primary-dark mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 bg-accent-gold rounded-full animate-pulse"></span>
                    Rata-rata Umur Piutang
                  </p>
                  <p className="text-3xl font-bold text-gray-900 mb-1">
                    {arSummary.avgDSO} <span className="text-lg text-gray-600 font-normal">hari</span>
                  </p>
                  <p className="text-xs text-gray-500">Days Sales Outstanding (DSO)</p>
                </div>
                <div className="bg-gradient-to-br from-accent-gold to-primary-light p-4 rounded-2xl shadow-lg group-hover:rotate-12 transition-transform duration-300">
                  <ClockIcon className="w-8 h-8 text-white" />
                </div>
              </div>
          </div>
        </div>

        {/* Filters & Search - Enhanced */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search */}
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <MagnifyingGlassIcon className="w-4 h-4 text-primary-dark" />
                  Cari Pelanggan
                </label>
                <div className="relative group">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-hover:text-primary-light transition-colors" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && loadData()}
                    placeholder="Ketik nama pelanggan..."
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-accent-gold focus:border-accent-gold transition-all hover:border-primary-light bg-gray-50 focus:bg-white"
                  />
                </div>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <svg className="w-4 h-4 text-primary-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  Filter Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-accent-gold focus:border-accent-gold transition-all hover:border-primary-light bg-gray-50 focus:bg-white font-medium"
                >
                  <option value="">🔍 Semua Status</option>
                  <option value="DRAFT">📝 Draft</option>
                  <option value="SENT">📤 Terkirim</option>
                  <option value="PARTIALLY_PAID">💰 Lunas Sebagian</option>
                  <option value="PAID">✅ Lunas</option>
                  <option value="OVERDUE">⚠️ Jatuh Tempo</option>
                </select>
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={loadData}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-dark to-primary-light text-white rounded-xl hover:from-primary-light hover:to-accent-gold transition-all shadow-lg hover:shadow-xl duration-200 font-semibold group disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <MagnifyingGlassIcon className="w-5 h-5 transition-transform" />
                {loading ? 'Memuat...' : 'Cari Invoice'}
              </button>
            </div>
        </div>

        {/* Invoice Table - Enhanced */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
            <div className="bg-gradient-to-r from-primary-dark to-primary-light px-6 py-4 border-b border-primary-light/20">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <DocumentTextIcon className="w-6 h-6 text-accent-gold" />
                Daftar Invoice
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      📄 No. Invoice
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      👥 Pelanggan
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      📅 Tanggal Invoice
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      ⏰ Jatuh Tempo
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                      💵 Total Nilai
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                      🏷️ Status
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                      ⚡ Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                        <div className="flex flex-col items-center">
                          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                          <p>Memuat data invoice...</p>
                        </div>
                      </td>
                    </tr>
                  ) : invoices.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                        <DocumentTextIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                        <p className="text-lg font-medium">Belum ada invoice</p>
                        <p className="text-sm">Klik "Buat Invoice Manual" untuk membuat invoice baru</p>
                      </td>
                    </tr>
                  ) : (
                    invoices.map((invoice) => (
                      <tr key={invoice.id} className="hover:bg-gradient-to-r hover:from-primary-light/10 hover:to-accent-gold/10 transition-all duration-200 border-b border-gray-100 group">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-bold text-primary-dark group-hover:text-primary-light">{invoice.invoice_number}</div>
                          <div className="text-xs text-gray-500 font-medium">📁 {invoice.project_name}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">{invoice.customer_name}</div>
                          <div className="text-xs text-gray-500">PO: {invoice.customer_po}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {new Date(invoice.invoice_date).toLocaleDateString('id-ID')}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-900">
                            <CalendarDaysIcon className="w-4 h-4 mr-1 text-gray-400" />
                            {new Date(invoice.due_date).toLocaleDateString('id-ID')}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="text-sm font-semibold text-gray-900">{formatCurrency(invoice.total_amount)}</div>
                          {invoice.remaining_amount > 0 && (
                            <div className="text-xs text-orange-600">Sisa: {formatCurrency(invoice.remaining_amount)}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                            {invoice.status === 'PAID' && <CheckCircleIcon className="w-4 h-4 mr-1" />}
                            {invoice.status === 'OVERDUE' && <ExclamationTriangleIcon className="w-4 h-4 mr-1" />}
                            {getStatusLabel(invoice.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => navigate(`/invoices/${invoice.id}`)}
                              className="inline-flex items-center justify-center p-2 rounded-lg bg-primary-light/10 text-primary-dark hover:bg-primary-light/20 hover:text-primary-light transition-all duration-200 hover:scale-110"
                              title="Lihat Detail"
                            >
                              <EyeIcon className="w-4 h-4" />
                            </button>
                            {invoice.status === 'DRAFT' && (
                              <button
                                onClick={() => openSendModal(invoice)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-primary-light to-accent-gold text-white text-xs font-semibold shadow-md hover:shadow-lg hover:from-accent-gold hover:to-primary-dark transition-all duration-200"
                                title="Kirim Invoice"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                </svg>
                                Kirim
                              </button>
                            )}
                            {(invoice.status === 'SENT' || invoice.status === 'PARTIALLY_PAID' || invoice.status === 'OVERDUE') && (
                              <button
                                onClick={() => openPaymentModal(invoice)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-accent-gold to-primary-light text-white text-xs font-semibold shadow-md hover:shadow-lg hover:from-primary-light hover:to-primary-dark transition-all duration-200"
                                title="Catat Pembayaran"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                                Bayar
                              </button>
                            )}
                            <button
                              onClick={() => window.open(`/invoices/${invoice.id}/template`, '_blank')}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-primary-dark to-primary-light text-white text-xs font-semibold shadow-md hover:shadow-lg hover:from-accent-gold hover:to-primary-dark transition-all duration-200"
                              title="Download Invoice PDF"
                            >
                              <DocumentArrowDownIcon className="w-3.5 h-3.5" />
                              PDF
                            </button>
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

      {/* Send Invoice Modal - Enhanced */}
      {showSendModal && selectedInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 m-4 transform transition-all animate-slideUp">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-primary-light to-primary-dark p-3 rounded-xl">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900">Kirim Invoice</h3>
              </div>
              <button
                onClick={() => setShowSendModal(false)}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-lg transition-all"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="mb-4 p-4 bg-primary-light/10 rounded-lg border border-primary-light/30">
              <div className="flex items-start gap-3">
                <div className="text-primary-light mt-1">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-primary-dark mb-1">Konfirmasi Pengiriman Invoice</h4>
                  <p className="text-sm text-gray-700">
                    Dengan mengirim invoice ini, sistem akan:
                  </p>
                  <ul className="text-sm text-gray-700 mt-2 space-y-1 list-disc list-inside">
                    <li>Mengubah status menjadi "SENT"</li>
                    <li>Membuat jurnal otomatis (Debit: Piutang, Credit: Pendapatan + PPN)</li>
                    <li>Invoice siap untuk dicatat pembayarannya</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Invoice</div>
              <div className="font-semibold text-gray-900">{selectedInvoice.invoice_number}</div>
              <div className="text-sm text-gray-600 mt-2">Pelanggan</div>
              <div className="font-medium text-gray-900">{selectedInvoice.customer_name}</div>
              <div className="text-sm text-gray-600 mt-2">Proyek</div>
              <div className="font-medium text-gray-900">{selectedInvoice.project_name}</div>
              <div className="text-sm text-gray-600 mt-2">Total Invoice</div>
              <div className="font-bold text-gray-900 text-lg">{formatCurrency(selectedInvoice.total_amount)}</div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowSendModal(false)}
                disabled={submitting}
                className="flex-1 px-5 py-2.5 border-2 border-gray-300 rounded-xl text-gray-700 font-semibold hover:bg-gray-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Batal
              </button>
              <button
                onClick={handleSendInvoice}
                disabled={submitting}
                className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary-light to-accent-gold text-white font-bold shadow-md hover:shadow-lg hover:from-accent-gold hover:to-primary-dark transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Mengirim...' : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    Kirim Invoice
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal - Enhanced */}
      {showPaymentModal && selectedInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 m-4 transform transition-all animate-slideUp">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-accent-gold to-primary-light p-3 rounded-xl">
                  <CurrencyDollarIcon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Catat Pembayaran</h3>
              </div>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-lg transition-all"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Invoice</div>
              <div className="font-semibold text-gray-900">{selectedInvoice.invoice_number}</div>
              <div className="text-sm text-gray-600 mt-2">Pelanggan</div>
              <div className="font-medium text-gray-900">{selectedInvoice.customer_name}</div>
              <div className="text-sm text-gray-600 mt-2">Total Invoice</div>
              <div className="font-semibold text-gray-900">{formatCurrency(selectedInvoice.total_amount)}</div>
              <div className="text-sm text-gray-600 mt-2">Sudah Dibayar</div>
              <div className="font-medium text-gray-900">{formatCurrency(selectedInvoice.paid_amount)}</div>
              <div className="text-sm text-gray-600 mt-2">Sisa Tagihan</div>
              <div className="font-bold text-orange-600 text-lg">{formatCurrency(selectedInvoice.remaining_amount)}</div>
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-gold focus:border-transparent"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-gold focus:border-transparent"
                  placeholder="0"
                  min="1"
                  max={selectedInvoice.remaining_amount}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Metode Pembayaran *
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-gold focus:border-transparent"
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
                  Nomor Referensi (Opsional)
                </label>
                <input
                  type="text"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-gold focus:border-transparent"
                  placeholder="e.g., TRF-20251117-001"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowPaymentModal(false)}
                disabled={submitting}
                className="flex-1 px-5 py-2.5 border-2 border-gray-300 rounded-xl text-gray-700 font-semibold hover:bg-gray-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Batal
              </button>
              <button
                onClick={handleRecordPayment}
                disabled={submitting}
                className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-accent-gold to-primary-light text-white font-bold shadow-md hover:shadow-lg hover:from-primary-light hover:to-primary-dark transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Menyimpan...' : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Catat Pembayaran
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Import Modal */}
      {showImportModal && (
        <InvoiceImport
          onClose={() => setShowImportModal(false)}
          onImportSuccess={(importedData) => {
            console.log('Imported invoices:', importedData);
            setShowImportModal(false);
            loadData(); // Reload invoice list
          }}
        />
      )}
    </div>
  );
};

export default InvoiceManagement;

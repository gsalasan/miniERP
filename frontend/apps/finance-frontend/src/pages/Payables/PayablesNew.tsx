import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DocumentTextIcon,
  CurrencyDollarIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
  DocumentArrowUpIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';

interface PayableItem {
  id: string;
  vendor_invoice_number: string;
  invoice_date: string;
  due_date: string;
  vendor_name: string;
  vendor_npwp: string;
  description: string;
  total_amount: number;
  paid_amount: number;
  remaining_amount: number;
  status: 'PENDING' | 'APPROVED' | 'PAID' | 'OVERDUE' | 'AWAITING_VERIFICATION';
  payable_type?: 'PO' | 'OPERATIONAL' | 'PROJECT';
  po_id?: string;
  project_id?: string;
}

const PayablesManagementNew: React.FC = () => {
  const navigate = useNavigate();
  const [showInputForm, setShowInputForm] = useState(false);
  const [showCSVUpload, setShowCSVUpload] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showTypeSelection, setShowTypeSelection] = useState(false);
  const [selectedPayableType, setSelectedPayableType] = useState<'PO' | 'OPERATIONAL' | 'PROJECT' | null>(null);
  const [selectedPayable, setSelectedPayable] = useState<PayableItem | null>(null);
  const [activeTab, setActiveTab] = useState<'PO' | 'OPERATIONAL' | 'PROJECT'>('PO');

  const [payables, setPayables] = useState<PayableItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  const API_BASE = import.meta.env.VITE_FINANCE_API || 'http://localhost:3001/api';

  // Fetch payables from backend
  React.useEffect(() => {
    fetchPayables();
  }, []);

  const fetchPayables = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/payables`);
      
      if (!response.ok) {
        console.error('API Error:', response.status, response.statusText);
        setPayables([]);
        return;
      }
      
      const result = await response.json();
      if (result.success) {
        setPayables(result.data);
      } else {
        console.error('Failed to fetch payables:', result.message);
        setPayables([]);
      }
    } catch (error) {
      console.error('Error fetching payables:', error);
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
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 border border-yellow-300';
      case 'APPROVED':
        return 'bg-blue-100 text-blue-800 border border-blue-300';
      case 'PAID':
        return 'bg-green-100 text-green-800 border border-green-300';
      case 'OVERDUE':
        return 'bg-red-100 text-red-800 border border-red-300';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      PENDING: 'Menunggu',
      APPROVED: 'Disetujui',
      PAID: 'Lunas',
      OVERDUE: 'Jatuh Tempo',
    };
    return labels[status] || status;
  };

  const handlePayment = (payable: PayableItem) => {
    // Redirect to Payment Gateway page (like Tokopedia checkout)
    navigate(`/finance/payment/${payable.id}`);
  };

  const handleViewDetail = (payable: PayableItem) => {
    setSelectedPayable(payable);
    setShowDetailModal(true);
  };

  const handleSubmitManualPayable = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    const totalAmount = Number(formData.get('total_amount'));
    const subtotal = totalAmount / 1.11; // Reverse calculate subtotal
    
    const description = formData.get('description') as string;
    const typePrefix = selectedPayableType === 'PO' ? '[PO] ' : selectedPayableType === 'OPERATIONAL' ? '[OPERATIONAL] ' : '[PROJECT] ';
    
    const payableData = {
      vendor_name: formData.get('vendor_name') as string,
      vendor_npwp: formData.get('vendor_npwp') as string || '',
      vendor_invoice_number: formData.get('vendor_invoice_number') as string,
      invoice_date: formData.get('invoice_date') as string,
      due_date: formData.get('due_date') as string,
      description: typePrefix + description,
      total_amount: totalAmount,
      po_id: selectedPayableType === 'PO' && formData.get('po_reference') 
        ? formData.get('po_reference') as string 
        : selectedPayableType === 'OPERATIONAL' ? 'OP-' + Date.now() : 'PRJ-' + Date.now(),
      notes: `Type: ${selectedPayableType}${selectedPayableType === 'PROJECT' && formData.get('project_reference') ? ', Project: ' + formData.get('project_reference') : ''}`,
      items: [
        {
          description: description,
          quantity: 1,
          unit_price: subtotal,
          total: subtotal,
        }
      ]
    };

    try {
      const response = await fetch(`${API_BASE}/payables`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payableData),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        alert('✅ Payable berhasil dibuat!');
        setShowInputForm(false);
        setShowTypeSelection(false);
        setSelectedPayableType(null);
        form.reset();
        fetchPayables(); // Refresh list
      } else {
        alert(`❌ Gagal membuat payable: ${result.message || 'Unknown error'}`);
      }
    } catch (error: any) {
      console.error('Error creating payable:', error);
      alert('❌ Gagal menghubungi server: ' + error.message);
    }
  };

  const handleSubmitPayment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    
    if (!selectedPayable) return;

    console.log('💰 Processing payment with file upload...');
    console.log('📍 API URL:', `${API_BASE}/payables/${selectedPayable.id}/payments`);

    // Log FormData contents for debugging
    for (let [key, value] of formData.entries()) {
      console.log(`${key}:`, value instanceof File ? `File: ${value.name}` : value);
    }

    try {
      // Send FormData directly (no JSON, no Content-Type header - browser sets it with boundary)
      const response = await fetch(`${API_BASE}/payables/${selectedPayable.id}/payments`, {
        method: 'POST',
        body: formData // Send FormData as-is
      });

      console.log('📥 Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        alert(`❌ Gagal memproses pembayaran!\n\nHTTP Error: ${response.status} ${response.statusText}\n\n${errorText}\n\nPastikan Finance Service berjalan di ${API_BASE}`);
        return;
      }
      
      const result = await response.json();
      console.log('📥 Response data:', result);
      
      if (result.success) {
        const amount = parseFloat(formData.get('amount') as string);
        const paymentMethod = formData.get('payment_method') as string;
        const proofFile = formData.get('payment_proof') as File;
        
        alert('✅ Pembayaran berhasil dicatat!\n\nDetail:\n- Jumlah: ' + formatCurrency(amount) + '\n- Metode: ' + paymentMethod + '\n- Bukti: ' + (proofFile ? proofFile.name : 'Tidak ada') + '\n- Status: LUNAS ✓');
        setShowPaymentModal(false);
        fetchPayables(); // Refresh data
      } else {
        alert('❌ Gagal memproses pembayaran!\n\nError: ' + (result.message || 'Unknown error') + '\n\nSilakan cek console untuk detail.');
      }
    } catch (error: any) {
      console.error('❌ Error processing payment:', error);
      alert('❌ Gagal menghubungi server!\n\nError: ' + error.message + '\n\nPastikan Finance Service berjalan di ' + API_BASE);
    }
  };

  // Calculate totals
  const totalPayable = payables.reduce((sum, p) => sum + p.remaining_amount, 0);
  const totalPending = payables.filter(p => p.status === 'PENDING').reduce((sum, p) => sum + p.remaining_amount, 0);
  const totalOverdue = payables.filter(p => p.status === 'OVERDUE').reduce((sum, p) => sum + p.remaining_amount, 0);
  const totalPaid = payables.filter(p => p.status === 'PAID').reduce((sum, p) => sum + p.paid_amount, 0);

  // Filter by type - keep all existing data as PO for backward compatibility
  const poPayables = payables.filter(p => 
    p.description?.startsWith('[PO]') || 
    (!p.description?.startsWith('[OPERATIONAL]') && !p.description?.startsWith('[PROJECT]') && 
     !p.po_id?.startsWith('OP-') && !p.po_id?.startsWith('PRJ-'))
  );
  const operationalPayables = payables.filter(p => 
    p.description?.startsWith('[OPERATIONAL]') || 
    p.po_id?.startsWith('OP-')
  );
  const projectPayables = payables.filter(p => 
    p.description?.startsWith('[PROJECT]') || 
    p.po_id?.startsWith('PRJ-')
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#C8A870] mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading Payables...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-[#06103A] to-[#4E88BE] rounded-3xl shadow-2xl p-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-[#C8A870]/30 rounded-full blur-3xl"></div>
        
        <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
                <CurrencyDollarIcon className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-white drop-shadow-lg">Accounts Payable</h1>
            </div>
            <p className="text-white/90 text-lg font-medium drop-shadow">
              💰 Management hutang & pembayaran ke vendor
            </p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl shadow-lg p-6 border-2 border-blue-200">
          <p className="text-sm font-semibold text-blue-800 mb-2">💼 Total Hutang</p>
          <p className="text-3xl font-bold text-blue-900">{formatCurrency(totalPayable)}</p>
          <p className="text-xs text-blue-700 mt-1">Belum dibayar</p>
        </div>
        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-2xl shadow-lg p-6 border-2 border-yellow-200">
          <p className="text-sm font-semibold text-yellow-800 mb-2">⏳ Pending</p>
          <p className="text-3xl font-bold text-yellow-900">{formatCurrency(totalPending)}</p>
          <p className="text-xs text-yellow-700 mt-1">Menunggu persetujuan</p>
        </div>
        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-2xl shadow-lg p-6 border-2 border-red-200">
          <p className="text-sm font-semibold text-red-800 mb-2">⚠️ Overdue</p>
          <p className="text-3xl font-bold text-red-900">{formatCurrency(totalOverdue)}</p>
          <p className="text-xs text-red-700 mt-1">Jatuh tempo</p>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl shadow-lg p-6 border-2 border-green-200">
          <p className="text-sm font-semibold text-green-800 mb-2">✅ Terbayar</p>
          <p className="text-3xl font-bold text-green-900">{formatCurrency(totalPaid)}</p>
          <p className="text-xs text-green-700 mt-1">Sudah lunas</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
        <div className="flex gap-4">
          <button
            onClick={() => setShowTypeSelection(true)}
            className="flex-1 px-6 py-3 bg-[#4E88BE] text-white rounded-xl hover:bg-[#06103A] transition-all font-semibold shadow-md hover:shadow-lg"
          >
            ➕ Input Payable Manual
          </button>
          <button
            onClick={() => setShowCSVUpload(true)}
            className="flex-1 px-6 py-3 bg-[#C8A870] text-white rounded-xl hover:bg-[#06103A] transition-all font-semibold shadow-md hover:shadow-lg"
          >
            📂 Upload CSV
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('PO')}
            className={`flex-1 px-6 py-4 font-semibold transition-all ${
              activeTab === 'PO'
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white border-b-4 border-blue-700'
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <DocumentTextIcon className="w-5 h-5" />
              <span>📦 Purchase Order ({poPayables.length})</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('OPERATIONAL')}
            className={`flex-1 px-6 py-4 font-semibold transition-all ${
              activeTab === 'OPERATIONAL'
                ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white border-b-4 border-orange-700'
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <CurrencyDollarIcon className="w-5 h-5" />
              <span>💼 Operasional ({operationalPayables.length})</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('PROJECT')}
            className={`flex-1 px-6 py-4 font-semibold transition-all ${
              activeTab === 'PROJECT'
                ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white border-b-4 border-purple-700'
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <DocumentTextIcon className="w-5 h-5" />
              <span>🏗️ Project ({projectPayables.length})</span>
            </div>
          </button>
        </div>

        {/* PO Table Content */}
        {activeTab === 'PO' && (
          <>
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                📦 Hutang dari Purchase Order (PO)
              </h2>
            </div>
            <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-blue-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-blue-900 uppercase whitespace-nowrap">No. PO</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-blue-900 uppercase whitespace-nowrap">Invoice</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-blue-900 uppercase whitespace-nowrap">Vendor</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-blue-900 uppercase whitespace-nowrap">Jatuh Tempo</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-blue-900 uppercase whitespace-nowrap">Total</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-blue-900 uppercase whitespace-nowrap">Terbayar</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-blue-900 uppercase whitespace-nowrap">Sisa</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-blue-900 uppercase whitespace-nowrap">Status</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-blue-900 uppercase whitespace-nowrap">Aksi</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {poPayables.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
                      <p className="text-lg font-semibold mb-2">Tidak ada data hutang dari PO</p>
                      <p className="text-sm">Silakan input payable dengan tipe Purchase Order</p>
                    </td>
                  </tr>
                ) : poPayables.map((payable) => (
                  <tr key={payable.id} className="hover:bg-blue-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-sm font-semibold text-blue-600">{payable.po_id || '-'}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <DocumentTextIcon className="w-5 h-5 text-blue-500 mr-2" />
                        <div>
                          <p className="text-sm font-bold text-gray-900">{payable.vendor_invoice_number}</p>
                          <p className="text-xs text-gray-500">{formatDate(payable.invoice_date)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-gray-900">{payable.vendor_name}</p>
                      <p className="text-xs text-gray-500">{payable.description}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`flex items-center text-sm ${payable.status === 'OVERDUE' ? 'text-red-600 font-bold' : 'text-gray-700'}`}>
                        <CalendarDaysIcon className="w-4 h-4 mr-1" />
                        {formatDate(payable.due_date)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <p className="text-sm font-bold text-gray-900">{formatCurrency(payable.total_amount)}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <p className="text-sm font-bold text-blue-600">{formatCurrency(payable.paid_amount || 0)}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <p className={`text-sm font-bold ${payable.remaining_amount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {formatCurrency(payable.remaining_amount)}
                      </p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(payable.status)}`}>
                        {payable.status === 'PAID' && <CheckCircleIcon className="w-4 h-4 mr-1" />}
                        {payable.status === 'PENDING' && <ClockIcon className="w-4 h-4 mr-1" />}
                        {payable.status === 'OVERDUE' && <ExclamationTriangleIcon className="w-4 h-4 mr-1" />}
                        {getStatusLabel(payable.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-2">
                        {payable.status !== 'PAID' && (
                          <button
                            onClick={() => handlePayment(payable)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-green-500 to-green-600 text-white text-sm font-bold hover:from-green-600 hover:to-green-700 shadow-md hover:shadow-lg transition-all duration-200"
                          >
                            <CurrencyDollarIcon className="w-4 h-4" />
                            Bayar
                          </button>
                        )}
                        <button
                          onClick={() => handleViewDetail(payable)}
                          className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors"
                        >
                          <EyeIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </>
        )}

        {/* Operational Table Content */}
        {activeTab === 'OPERATIONAL' && (
          <>
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                💼 Hutang Pengeluaran Operasional
              </h2>
            </div>
            <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-orange-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-orange-900 uppercase whitespace-nowrap">No. Tagihan</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-orange-900 uppercase whitespace-nowrap">Penerima</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-orange-900 uppercase whitespace-nowrap">Keterangan</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-orange-900 uppercase whitespace-nowrap">Jatuh Tempo</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-orange-900 uppercase whitespace-nowrap">Total</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-orange-900 uppercase whitespace-nowrap">Terbayar</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-orange-900 uppercase whitespace-nowrap">Sisa</th>
                <th className="px-6 py-4 text-center text-xs font-bold text-orange-900 uppercase whitespace-nowrap">Status</th>
                <th className="px-6 py-4 text-center text-xs font-bold text-orange-900 uppercase whitespace-nowrap">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {operationalPayables.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
                    <p className="text-lg font-semibold mb-2">Tidak ada data hutang operasional</p>
                    <p className="text-sm">Silakan input payable dengan tipe Pengeluaran Operasional</p>
                  </td>
                </tr>
              ) : operationalPayables.map((payable) => (
                <tr key={payable.id} className="hover:bg-orange-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <CurrencyDollarIcon className="w-5 h-5 text-orange-500 mr-2" />
                      <div>
                        <p className="text-sm font-bold text-gray-900">{payable.vendor_invoice_number}</p>
                        <p className="text-xs text-gray-500">{formatDate(payable.invoice_date)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-semibold text-gray-900">{payable.vendor_name}</p>
                    <p className="text-xs text-gray-500">{payable.vendor_npwp || '-'}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-700">{payable.description}</p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`flex items-center text-sm ${payable.status === 'OVERDUE' ? 'text-red-600 font-bold' : 'text-gray-700'}`}>
                      <CalendarDaysIcon className="w-4 h-4 mr-1" />
                      {formatDate(payable.due_date)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <p className="text-sm font-bold text-gray-900">{formatCurrency(payable.total_amount)}</p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <p className="text-sm font-bold text-blue-600">
                      {formatCurrency(payable.paid_amount || 0)}
                    </p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <p className={`text-sm font-bold ${payable.remaining_amount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {formatCurrency(payable.remaining_amount)}
                    </p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(payable.status)}`}>
                      {payable.status === 'PAID' && <CheckCircleIcon className="w-4 h-4 mr-1" />}
                      {payable.status === 'PENDING' && <ClockIcon className="w-4 h-4 mr-1" />}
                      {payable.status === 'OVERDUE' && <ExclamationTriangleIcon className="w-4 h-4 mr-1" />}
                      {getStatusLabel(payable.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="flex items-center justify-center gap-2">
                      {payable.status !== 'PAID' && (
                        <button
                          onClick={() => handlePayment(payable)}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-green-500 to-green-600 text-white text-sm font-bold hover:from-green-600 hover:to-green-700 shadow-md hover:shadow-lg transition-all duration-200"
                        >
                          <CurrencyDollarIcon className="w-4 h-4" />
                          Bayar
                        </button>
                      )}
                      <button
                        onClick={() => handleViewDetail(payable)}
                        className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-orange-100 text-orange-600 hover:bg-orange-200 transition-colors"
                      >
                        <EyeIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
            </div>
          </>
        )}

        {/* Project Table Content */}
        {activeTab === 'PROJECT' && (
          <>
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 px-6 py-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                🏗️ Hutang dari Project
              </h2>
            </div>
            <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-purple-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-purple-900 uppercase whitespace-nowrap">Kode Project</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-purple-900 uppercase whitespace-nowrap">Invoice</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-purple-900 uppercase whitespace-nowrap">Vendor/Kontraktor</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-purple-900 uppercase whitespace-nowrap">Keterangan</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-purple-900 uppercase whitespace-nowrap">Jatuh Tempo</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-purple-900 uppercase whitespace-nowrap">Total</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-purple-900 uppercase whitespace-nowrap">Terbayar</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-purple-900 uppercase whitespace-nowrap">Sisa</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-purple-900 uppercase whitespace-nowrap">Status</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-purple-900 uppercase whitespace-nowrap">Aksi</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {projectPayables.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-6 py-12 text-center text-gray-500">
                      <p className="text-lg font-semibold mb-2">Tidak ada data hutang project</p>
                      <p className="text-sm">Silakan input payable dengan tipe Project Expense</p>
                    </td>
                  </tr>
                ) : projectPayables.map((payable) => (
                  <tr key={payable.id} className="hover:bg-purple-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-sm font-semibold text-purple-600">{payable.project_id || '-'}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <DocumentTextIcon className="w-5 h-5 text-purple-500 mr-2" />
                        <div>
                          <p className="text-sm font-bold text-gray-900">{payable.vendor_invoice_number}</p>
                          <p className="text-xs text-gray-500">{formatDate(payable.invoice_date)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-gray-900">{payable.vendor_name}</p>
                      <p className="text-xs text-gray-500">{payable.vendor_npwp || '-'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-700">{payable.description}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`flex items-center text-sm ${payable.status === 'OVERDUE' ? 'text-red-600 font-bold' : 'text-gray-700'}`}>
                        <CalendarDaysIcon className="w-4 h-4 mr-1" />
                        {formatDate(payable.due_date)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <p className="text-sm font-bold text-gray-900">{formatCurrency(payable.total_amount)}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <p className="text-sm font-bold text-purple-600">{formatCurrency(payable.paid_amount || 0)}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <p className={`text-sm font-bold ${payable.remaining_amount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {formatCurrency(payable.remaining_amount)}
                      </p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(payable.status)}`}>
                        {payable.status === 'PAID' && <CheckCircleIcon className="w-4 h-4 mr-1" />}
                        {payable.status === 'PENDING' && <ClockIcon className="w-4 h-4 mr-1" />}
                        {payable.status === 'OVERDUE' && <ExclamationTriangleIcon className="w-4 h-4 mr-1" />}
                        {getStatusLabel(payable.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-2">
                        {payable.status !== 'PAID' && (
                          <button
                            onClick={() => handlePayment(payable)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-green-500 to-green-600 text-white text-sm font-bold hover:from-green-600 hover:to-green-700 shadow-md hover:shadow-lg transition-all duration-200"
                          >
                            <CurrencyDollarIcon className="w-4 h-4" />
                            Bayar
                          </button>
                        )}
                        <button
                          onClick={() => handleViewDetail(payable)}
                          className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-purple-100 text-purple-600 hover:bg-purple-200 transition-colors"
                        >
                          <EyeIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </>
        )}
      </div>

      {/* Rekap Paid Payables */}
      {payables.filter(p => p.status === 'PAID').length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <CheckCircleIcon className="w-6 h-6" />
              📝 Rekap Hutang yang Sudah Dibayar Lunas
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-green-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-green-900 uppercase">Invoice</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-green-900 uppercase">Vendor</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-green-900 uppercase">Tanggal Bayar</th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-green-900 uppercase">Jumlah Dibayar</th>
                  <th className="px-6 py-3 text-center text-xs font-bold text-green-900 uppercase">Status</th>
                  <th className="px-6 py-3 text-center text-xs font-bold text-green-900 uppercase">Aksi</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {payables.filter(p => p.status === 'PAID').map((payable) => (
                  <tr key={payable.id} className="hover:bg-green-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <DocumentTextIcon className="w-5 h-5 text-green-600 mr-2" />
                        <div>
                          <p className="text-sm font-bold text-gray-900">{payable.vendor_invoice_number}</p>
                          <p className="text-xs text-gray-500">{payable.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-gray-900">{payable.vendor_name}</p>
                      <p className="text-xs text-gray-500">{payable.vendor_npwp}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center text-sm text-gray-700">
                        <CalendarDaysIcon className="w-4 h-4 mr-1 text-green-500" />
                        {formatDate(payable.due_date)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <p className="text-sm font-bold text-green-600">{formatCurrency(payable.paid_amount)}</p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-300">
                        <CheckCircleIcon className="w-4 h-4 mr-1" />
                        LUNAS
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleViewDetail(payable)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-green-100 text-green-700 text-sm font-semibold hover:bg-green-200 transition-colors"
                      >
                        <EyeIcon className="w-4 h-4" />
                        Lihat Detail
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="bg-green-50 px-6 py-4 border-t border-green-200">
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold text-green-900">Total Terbayar:</span>
              <span className="text-2xl font-bold text-green-700">{formatCurrency(totalPaid)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Type Selection Modal */}
      {showTypeSelection && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl">
            <div className="bg-gradient-to-r from-[#06103A] to-[#4E88BE] p-6 rounded-t-2xl">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white">📋 Pilih Tipe Payable</h2>
                <button onClick={() => setShowTypeSelection(false)} className="text-white hover:text-gray-200">
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-gray-700 mb-6">Pilih jenis hutang yang akan diinput:</p>
              <div className="grid grid-cols-1 gap-4">
                <button
                  onClick={() => {
                    setSelectedPayableType('PO');
                    setShowTypeSelection(false);
                    setShowInputForm(true);
                  }}
                  className="flex items-center gap-4 p-6 border-2 border-blue-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all text-left"
                >
                  <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <DocumentTextIcon className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">Purchase Order (PO)</h3>
                    <p className="text-sm text-gray-600">Hutang dari pembelian barang/jasa berdasarkan PO</p>
                  </div>
                </button>
                <button
                  onClick={() => {
                    setSelectedPayableType('OPERATIONAL');
                    setShowTypeSelection(false);
                    setShowInputForm(true);
                  }}
                  className="flex items-center gap-4 p-6 border-2 border-orange-200 rounded-xl hover:border-orange-400 hover:bg-orange-50 transition-all text-left"
                >
                  <div className="flex-shrink-0 w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                    <CurrencyDollarIcon className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">Pengeluaran Operasional</h3>
                    <p className="text-sm text-gray-600">Hutang untuk biaya operasional perusahaan (utilitas, sewa, dll)</p>
                  </div>
                </button>
                <button
                  onClick={() => {
                    setSelectedPayableType('PROJECT');
                    setShowTypeSelection(false);
                    setShowInputForm(true);
                  }}
                  className="flex items-center gap-4 p-6 border-2 border-purple-200 rounded-xl hover:border-purple-400 hover:bg-purple-50 transition-all text-left"
                >
                  <div className="flex-shrink-0 w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                    <DocumentTextIcon className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">Project Expense</h3>
                    <p className="text-sm text-gray-600">Hutang untuk pengeluaran project tertentu</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Input Manual Form Modal */}
      {showInputForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl my-8">
            <div className="bg-gradient-to-r from-[#06103A] to-[#4E88BE] p-6 rounded-t-2xl">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white">
                  ➕ Input Payable - {selectedPayableType === 'PO' ? '📦 Purchase Order' : selectedPayableType === 'OPERATIONAL' ? '💼 Operasional' : '🏗️ Project'}
                </h2>
                <button onClick={() => { setShowInputForm(false); setSelectedPayableType(null); }} className="text-white hover:text-gray-200">
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
            </div>
            <form onSubmit={handleSubmitManualPayable} className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {selectedPayableType === 'PO' && (
                <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                  <label className="block text-sm font-semibold text-blue-900 mb-2">No. PO (Opsional)</label>
                  <input name="po_reference" type="text" className="w-full px-4 py-3 border-2 border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-400" placeholder="Contoh: PO-2025-001" />
                </div>
              )}
              {selectedPayableType === 'PROJECT' && (
                <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-4">
                  <label className="block text-sm font-semibold text-purple-900 mb-2">Kode Project (Opsional)</label>
                  <input name="project_reference" type="text" className="w-full px-4 py-3 border-2 border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-400" placeholder="Contoh: PRJ-2025-001" />
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {selectedPayableType === 'OPERATIONAL' ? 'Nama Penerima/Vendor *' : 'Nama Vendor *'}
                  </label>
                  <input name="vendor_name" type="text" className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#C8A870]" placeholder={selectedPayableType === 'OPERATIONAL' ? 'Contoh: PLN, PDAM, Landlord' : 'Contoh: PT. Supplier ABC'} required />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {selectedPayableType === 'OPERATIONAL' ? 'NPWP (Opsional)' : 'NPWP Vendor'}
                  </label>
                  <input name="vendor_npwp" type="text" className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#C8A870]" placeholder="01.234.567.8-901.000" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {selectedPayableType === 'OPERATIONAL' ? 'No. Tagihan/Invoice *' : selectedPayableType === 'PROJECT' ? 'No. Invoice Project *' : 'No. Invoice Vendor *'}
                  </label>
                  <input name="vendor_invoice_number" type="text" className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#C8A870]" placeholder={selectedPayableType === 'OPERATIONAL' ? 'Contoh: INV-PLN-123' : 'Contoh: INV-2025-001'} required />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Tanggal Invoice *</label>
                  <input name="invoice_date" type="date" className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#C8A870]" required />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Jatuh Tempo *</label>
                  <input name="due_date" type="date" className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#C8A870]" required />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {selectedPayableType === 'OPERATIONAL' ? 'Keterangan Pengeluaran *' : selectedPayableType === 'PROJECT' ? 'Deskripsi Pekerjaan *' : 'Deskripsi *'}
                  </label>
                  <textarea name="description" rows={3} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#C8A870]" placeholder={selectedPayableType === 'OPERATIONAL' ? 'Contoh: Tagihan listrik bulan November 2025' : selectedPayableType === 'PROJECT' ? 'Contoh: Progress termin 2 pembangunan gedung' : 'Contoh: Pembelian barang dari PO-2025-001'} required />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Total Amount (Rp) *</label>
                  <input name="total_amount" type="number" step="0.01" min="0" className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#C8A870]" placeholder="10000000" required />
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowInputForm(false)} className="flex-1 px-6 py-3 bg-gray-300 text-gray-700 rounded-xl hover:bg-gray-400 transition-colors font-semibold">
                  Batal
                </button>
                <button type="submit" className="flex-1 px-6 py-3 bg-[#4E88BE] text-white rounded-xl hover:bg-[#06103A] transition-colors font-semibold">
                  Simpan Payable
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV Upload Modal */}
      {showCSVUpload && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl">
            <div className="bg-gradient-to-r from-[#C8A870] to-[#4E88BE] p-6 rounded-t-2xl">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white">📂 Upload CSV Payables</h2>
                <button onClick={() => setShowCSVUpload(false)} className="text-white hover:text-gray-200">
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-6">
              <div className="border-4 border-dashed border-gray-300 rounded-2xl p-12 text-center hover:border-[#C8A870] transition-colors">
                <input type="file" accept=".csv" className="hidden" id="csv-upload" />
                <label htmlFor="csv-upload" className="cursor-pointer">
                  <div className="mb-4">
                    <DocumentArrowUpIcon className="w-16 h-16 mx-auto text-gray-400" />
                  </div>
                  <p className="text-lg font-semibold text-gray-900 mb-2">Klik atau drag & drop file CSV</p>
                  <p className="text-sm text-gray-600">Format: vendor_invoice_number, vendor_name, ...</p>
                </label>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <h3 className="text-sm font-bold text-blue-900 mb-2">📋 Format CSV:</h3>
                <code className="text-xs text-blue-800 block">
                  vendor_invoice_number,invoice_date,due_date,vendor_name,vendor_npwp,description,total_amount
                </code>
              </div>
              <div className="flex gap-4">
                <button type="button" onClick={() => setShowCSVUpload(false)} className="flex-1 px-6 py-3 bg-gray-300 text-gray-700 rounded-xl hover:bg-gray-400 transition-colors font-semibold">
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedPayable && (
        <div className="fixed inset-0 bg-[#06103A]/80 backdrop-blur-md flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-8 border-2 border-[#4E88BE]/30">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#06103A] to-[#4E88BE] px-6 py-4 rounded-t-2xl">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <CurrencyDollarIcon className="w-6 h-6" />
                  Proses Pembayaran Hutang
                </h2>
                <button 
                  onClick={() => setShowPaymentModal(false)} 
                  className="text-white hover:text-[#C8A870] transition-colors"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
              {/* Detail Hutang Card */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-200 rounded-xl p-5 shadow-sm">
                <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <DocumentTextIcon className="w-5 h-5 text-gray-600" />
                  Detail Hutang
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center py-2 border-b border-gray-300">
                    <span className="text-gray-600 font-medium">Vendor:</span>
                    <span className="text-gray-900 font-bold text-right">{selectedPayable.vendor_name}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-300">
                    <span className="text-gray-600 font-medium">No. Invoice:</span>
                    <span className="text-gray-900 font-bold">{selectedPayable.vendor_invoice_number}</span>
                  </div>
                  <div className="py-2 border-b border-gray-300">
                    <span className="text-gray-600 font-medium block mb-1">📝 Deskripsi Hutang:</span>
                    <span className="text-gray-900 font-semibold text-sm bg-yellow-50 px-3 py-2 rounded block">{selectedPayable.description || 'Tidak ada deskripsi'}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-300">
                    <span className="text-gray-600 font-medium">Tanggal Invoice:</span>
                    <span className="text-gray-900 font-bold">{formatDate(selectedPayable.invoice_date)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-300">
                    <span className="text-gray-600 font-medium">Jatuh Tempo:</span>
                    <span className="text-red-600 font-bold">{formatDate(selectedPayable.due_date)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-300">
                    <span className="text-gray-600 font-medium">💰 Total Hutang:</span>
                    <span className="text-gray-900 font-bold">{formatCurrency(selectedPayable.total_amount)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-300">
                    <span className="text-gray-600 font-medium">✅ Sudah Dibayar:</span>
                    <span className="text-blue-600 font-bold">{formatCurrency(selectedPayable.paid_amount)}</span>
                  </div>
                  <div className="flex justify-between items-center py-3 bg-green-50 rounded-lg px-3 mt-3">
                    <span className="text-gray-900 font-bold text-base">⏳ Sisa Tagihan:</span>
                    <span className="text-green-600 font-bold text-xl">{formatCurrency(selectedPayable.remaining_amount)}</span>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3">
                    <p className="text-xs text-blue-800">
                      <span className="font-bold">💡 Info:</span> "Sisa Tagihan" adalah jumlah yang masih harus dibayar. Jika sudah dibayar penuh, status akan berubah menjadi <span className="font-bold">LUNAS (PAID)</span>.
                    </p>
                  </div>
                </div>
              </div>

              {/* Form Pembayaran */}
              <form onSubmit={handleSubmitPayment} className="space-y-4">
                {/* Row 1: Tanggal & Jumlah */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Tanggal Pembayaran <span className="text-red-500">*</span>
                    </label>
                    <input 
                      name="payment_date"
                      type="date" 
                      defaultValue={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all" 
                      required 
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Jumlah Bayar <span className="text-red-500">*</span>
                    </label>
                    <input 
                      name="amount"
                      type="number" 
                      defaultValue={selectedPayable.remaining_amount}
                      min="0"
                      max={selectedPayable.remaining_amount}
                      className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all" 
                      required 
                    />
                  </div>
                </div>

                {/* Metode Pembayaran */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Metode Pembayaran <span className="text-red-500">*</span>
                  </label>
                  <select 
                    name="payment_method"
                    className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all" 
                    required
                  >
                    <option value="">Pilih metode...</option>
                    <option value="TRANSFER">Transfer Bank</option>
                    <option value="CHECK">Cek</option>
                    <option value="CASH">Tunai</option>
                    <option value="GIRO">Giro</option>
                  </select>
                </div>

                {/* Detail Bank */}
                <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 space-y-3">
                  <h4 className="font-semibold text-blue-900 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z"/>
                      <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd"/>
                    </svg>
                    Detail Transfer Bank
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Bank Tujuan <span className="text-red-500">*</span>
                      </label>
                      <input 
                        name="bank_name"
                        type="text" 
                        placeholder="Contoh: BCA, Mandiri, BNI"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm" 
                        required 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Nomor Rekening Tujuan <span className="text-red-500">*</span>
                      </label>
                      <input 
                        name="account_number"
                        type="text" 
                        placeholder="1234567890"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm" 
                        required 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Nama Pemilik Rekening
                      </label>
                      <input 
                        name="account_holder"
                        type="text" 
                        placeholder="Nama di rekening tujuan"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm" 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Nomor Referensi Transfer
                      </label>
                      <input 
                        name="reference_number"
                        type="text" 
                        placeholder="No. transaksi / referensi"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm" 
                      />
                    </div>
                  </div>
                </div>

                {/* Upload Bukti Transfer */}
                <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
                  <label className="block text-sm font-semibold text-green-900 mb-2 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd"/>
                    </svg>
                    Upload Bukti Transfer <span className="text-red-500">*</span>
                  </label>
                  <input 
                    name="payment_proof"
                    type="file" 
                    accept="image/*,.pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          const preview = document.getElementById('proof-preview') as HTMLImageElement;
                          if (preview && file.type.startsWith('image/')) {
                            preview.src = reader.result as string;
                            preview.classList.remove('hidden');
                          }
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="w-full px-4 py-3 border-2 border-dashed border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all bg-white cursor-pointer hover:border-green-500" 
                    required 
                  />
                  <p className="text-xs text-gray-500 mt-2">Format: JPG, PNG, PDF (Max 5MB)</p>
                  
                  {/* Preview */}
                  <img 
                    id="proof-preview" 
                    className="hidden mt-3 rounded-lg border-2 border-green-300 max-h-48 object-contain"
                    alt="Preview bukti transfer"
                  />
                </div>

                {/* Catatan */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Catatan Tambahan
                  </label>
                  <textarea 
                    name="notes"
                    rows={3} 
                    placeholder="Catatan pembayaran (opsional)"
                    className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all resize-none" 
                  />
                </div>

                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <button 
                    type="button" 
                    onClick={() => setShowPaymentModal(false)} 
                    className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all font-semibold shadow-sm hover:shadow-md"
                  >
                    Batal
                  </button>
                  <button 
                    type="submit" 
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-[#06103A] text-white rounded-xl hover:from-green-700 hover:to-[#4E88BE] transition-all font-semibold shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                  >
                    <CheckCircleIcon className="w-5 h-5" />
                    Konfirmasi Bayar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal with Payment History */}
      {showDetailModal && selectedPayable && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl my-8">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#06103A] to-[#4E88BE] px-6 py-4 rounded-t-2xl">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <DocumentTextIcon className="w-6 h-6" />
                  Detail Payable & Payment History
                </h2>
                <button 
                  onClick={() => setShowDetailModal(false)} 
                  className="text-white hover:text-[#C8A870] transition-colors"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
              {/* Payable Info */}
              <div className="bg-gradient-to-br from-gray-50 to-blue-50 border-2 border-blue-200 rounded-xl p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">📄 Informasi Hutang</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Invoice Number</p>
                    <p className="text-sm font-bold text-gray-900">{selectedPayable.vendor_invoice_number}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">ID Payable</p>
                    <p className="text-sm font-bold text-gray-900">{selectedPayable.id}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Vendor</p>
                    <p className="text-sm font-bold text-gray-900">{selectedPayable.vendor_name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">NPWP</p>
                    <p className="text-sm font-bold text-gray-900">{selectedPayable.vendor_npwp}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Tanggal Invoice</p>
                    <p className="text-sm font-bold text-gray-900">{formatDate(selectedPayable.invoice_date)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Jatuh Tempo</p>
                    <p className="text-sm font-bold text-red-600">{formatDate(selectedPayable.due_date)}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-gray-600 mb-1">Deskripsi</p>
                    <p className="text-sm text-gray-700">{selectedPayable.description}</p>
                  </div>
                </div>
              </div>

              {/* Payment Summary */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                  <p className="text-xs font-semibold text-blue-800 mb-1">Total Amount</p>
                  <p className="text-xl font-bold text-blue-900">{formatCurrency(selectedPayable.total_amount)}</p>
                </div>
                <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
                  <p className="text-xs font-semibold text-green-800 mb-1">Paid Amount</p>
                  <p className="text-xl font-bold text-green-900">{formatCurrency(selectedPayable.paid_amount)}</p>
                </div>
                <div className={`${selectedPayable.remaining_amount > 0 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'} border-2 rounded-xl p-4`}>
                  <p className={`text-xs font-semibold mb-1 ${selectedPayable.remaining_amount > 0 ? 'text-red-800' : 'text-green-800'}`}>
                    Remaining
                  </p>
                  <p className={`text-xl font-bold ${selectedPayable.remaining_amount > 0 ? 'text-red-900' : 'text-green-900'}`}>
                    {formatCurrency(selectedPayable.remaining_amount)}
                  </p>
                </div>
              </div>

              {/* Status Badge */}
              <div className="flex items-center justify-between bg-gray-50 rounded-xl p-4 border border-gray-200">
                <span className="text-sm font-semibold text-gray-700">Status Pembayaran:</span>
                <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-bold ${getStatusColor(selectedPayable.status)}`}>
                  {selectedPayable.status === 'PAID' && <CheckCircleIcon className="w-5 h-5 mr-2" />}
                  {selectedPayable.status === 'PENDING' && <ClockIcon className="w-5 h-5 mr-2" />}
                  {selectedPayable.status === 'OVERDUE' && <ExclamationTriangleIcon className="w-5 h-5 mr-2" />}
                  {getStatusLabel(selectedPayable.status)}
                </span>
              </div>

              {/* Payment History - Mock untuk demo */}
              <div className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden">
                <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-4 py-3">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <CurrencyDollarIcon className="w-5 h-5" />
                    Payment History
                  </h3>
                </div>
                {selectedPayable.status === 'PAID' ? (
                  <div className="p-4">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-green-900">Payment #1</span>
                        <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded-full font-bold">
                          COMPLETED
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-xs text-gray-600">Date</p>
                          <p className="font-semibold text-gray-900">{formatDate(selectedPayable.due_date)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Amount</p>
                          <p className="font-bold text-green-600">{formatCurrency(selectedPayable.paid_amount)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Method</p>
                          <p className="font-semibold text-gray-900">Transfer Bank</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Reference</p>
                          <p className="font-semibold text-gray-900">TRX-{selectedPayable.id}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 text-center text-gray-500">
                    <ClockIcon className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm">Belum ada pembayaran</p>
                  </div>
                )}
              </div>

              {/* Action Button */}
              <div className="flex gap-3 pt-4">
                <button 
                  onClick={() => setShowDetailModal(false)} 
                  className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all font-semibold"
                >
                  Tutup
                </button>
                {selectedPayable.status !== 'PAID' && (
                  <button 
                    onClick={() => {
                      setShowDetailModal(false);
                      setShowPaymentModal(true);
                    }}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all font-semibold flex items-center justify-center gap-2"
                  >
                    <CurrencyDollarIcon className="w-5 h-5" />
                    Proses Pembayaran
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayablesManagementNew;

// Bank Reconciliation & Payment Matching
// Import mutasi rekening BCA dan match dengan invoice

import React, { useState, useEffect } from 'react';
import {
  BanknotesIcon,
  ArrowUpTrayIcon,
  CheckCircleIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  DocumentTextIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import * as XLSX from 'xlsx';

interface BankTransaction {
  id: string;
  transaction_date: string;
  sender_name: string;
  sender_account?: string;
  amount: number;
  description: string;
  status: 'PENDING' | 'MATCHED' | 'APPROVED';
  matched_invoice_id?: string;
  matched_invoice_number?: string;
}

interface Invoice {
  id: string;
  invoice_number: string;
  customer_name: string;
  total_amount: number;
  remaining_amount: number;
  status: string;
  invoice_date: string;
}

const BankReconciliation: React.FC = () => {
  const [transactions, setTransactions] = useState<BankTransaction[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Fetch unpaid invoices for matching
  useEffect(() => {
    fetchUnpaidInvoices();
  }, []);

  const fetchUnpaidInvoices = async () => {
    try {
      const response = await fetch('/api/invoices?status=SENT');
      if (response.ok) {
        const data = await response.json();
        setInvoices(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching invoices:', error);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    try {
      const reader = new FileReader();
      reader.onload = (event) => {
        const data = event.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet);

        // Transform bank data to BankTransaction format
        const transactions: BankTransaction[] = jsonData.map((row: any, index) => ({
          id: `TRX-${Date.now()}-${index}`,
          transaction_date: row['Tanggal'] || row['Date'] || new Date().toISOString().split('T')[0],
          sender_name: row['Nama Pengirim'] || row['Sender Name'] || row['Description'] || 'Unknown',
          sender_account: row['Rekening'] || row['Account'] || '',
          amount: parseFloat(row['Nominal'] || row['Amount'] || row['Credit'] || 0),
          description: row['Keterangan'] || row['Description'] || row['Remarks'] || '',
          status: 'PENDING',
        }));

        // Auto-match by amount and customer name
        const matchedTransactions = autoMatchTransactions(transactions);
        setTransactions(matchedTransactions);

        alert(`✅ ${transactions.length} transaksi berhasil diimport!\n${matchedTransactions.filter(t => t.status === 'MATCHED').length} transaksi otomatis ter-match dengan invoice.`);
        setShowUploadModal(false);
      };
      reader.readAsBinaryString(file);
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('❌ Gagal import file. Pastikan format sesuai template.');
    } finally {
      setIsLoading(false);
    }
  };

  const autoMatchTransactions = (transactions: BankTransaction[]): BankTransaction[] => {
    return transactions.map(trx => {
      // Try to match by exact amount
      const matchingInvoices = invoices.filter(inv => 
        Math.abs(inv.remaining_amount - trx.amount) < 1 &&
        (trx.sender_name.toLowerCase().includes(inv.customer_name.toLowerCase().split(' ')[0]) ||
         inv.customer_name.toLowerCase().includes(trx.sender_name.toLowerCase().split(' ')[0]))
      );

      if (matchingInvoices.length === 1) {
        return {
          ...trx,
          status: 'MATCHED',
          matched_invoice_id: matchingInvoices[0].id,
          matched_invoice_number: matchingInvoices[0].invoice_number,
        };
      }

      return trx;
    });
  };

  const handleManualMatch = (transactionId: string, invoiceId: string) => {
    const invoice = invoices.find(inv => inv.id === invoiceId);
    if (!invoice) return;

    setTransactions(prev => prev.map(trx => 
      trx.id === transactionId
        ? {
            ...trx,
            status: 'MATCHED',
            matched_invoice_id: invoice.id,
            matched_invoice_number: invoice.invoice_number,
          }
        : trx
    ));
  };

  const handleApprovePayment = async (transactionId: string) => {
    const transaction = transactions.find(t => t.id === transactionId);
    if (!transaction || !transaction.matched_invoice_id) {
      alert('❌ Transaksi belum di-match dengan invoice!');
      return;
    }

    if (!confirm(`⚠️ Konfirmasi pembayaran:\n\nTransaksi: ${formatCurrency(transaction.amount)}\nDari: ${transaction.sender_name}\nUntuk Invoice: ${transaction.matched_invoice_number}\n\nSetelah approve, invoice akan otomatis LUNAS dan jurnal tercatat.\n\nLanjutkan?`)) {
      return;
    }

    setIsLoading(true);
    try {
      // Call API to record payment
      const response = await fetch(`/api/invoices/${transaction.matched_invoice_id}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payment_date: transaction.transaction_date,
          amount: transaction.amount,
          method: 'TRANSFER',
          notes: `Bank transfer from ${transaction.sender_name} - Auto-matched via Bank Reconciliation`,
        }),
      });

      if (!response.ok) {
        throw new Error('Gagal mencatat pembayaran');
      }

      // Update transaction status
      setTransactions(prev => prev.map(trx =>
        trx.id === transactionId ? { ...trx, status: 'APPROVED' } : trx
      ));

      // Refresh invoices
      await fetchUnpaidInvoices();

      alert(
        `✅ PEMBAYARAN DISETUJUI!\n\n` +
        `📄 Invoice: ${transaction.matched_invoice_number}\n` +
        `💰 Amount: ${formatCurrency(transaction.amount)}\n` +
        `👤 From: ${transaction.sender_name}\n\n` +
        `✨ Invoice status updated to PAID\n` +
        `✨ Journal entry created automatically:\n` +
        `   - Debit: Kas/Bank\n` +
        `   - Kredit: Piutang Usaha\n\n` +
        `📊 All reports updated automatically!`
      );
    } catch (error: any) {
      console.error('Error approving payment:', error);
      alert('❌ Gagal approve pembayaran: ' + error.message);
    } finally {
      setIsLoading(false);
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
      case 'PENDING': return 'bg-yellow-100 text-yellow-800 border border-yellow-300';
      case 'MATCHED': return 'bg-blue-100 text-blue-800 border border-blue-300';
      case 'APPROVED': return 'bg-green-100 text-green-800 border border-green-300';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      PENDING: 'Belum Match',
      MATCHED: 'Sudah Match',
      APPROVED: 'Disetujui',
    };
    return labels[status] || status;
  };

  const filteredTransactions = transactions.filter(trx => {
    const matchesSearch = trx.sender_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         trx.matched_invoice_number?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !statusFilter || trx.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPending = transactions.filter(t => t.status === 'PENDING').reduce((sum, t) => sum + t.amount, 0);
  const totalMatched = transactions.filter(t => t.status === 'MATCHED').reduce((sum, t) => sum + t.amount, 0);
  const totalApproved = transactions.filter(t => t.status === 'APPROVED').reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-700 to-blue-500 rounded-3xl shadow-2xl p-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-cyan-500/30 rounded-full blur-3xl"></div>
        
        <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
                <BanknotesIcon className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-white drop-shadow-lg">Bank Reconciliation</h1>
            </div>
            <p className="text-white/90 text-lg font-medium drop-shadow">
              🏦 Import mutasi BCA dan match dengan invoice untuk approve pembayaran
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs bg-white/25 text-white px-3 py-1 rounded-full backdrop-blur-sm font-medium">
                Auto-matching & Auto-journal
              </span>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowUploadModal(true)}
              className="px-6 py-3 bg-white text-blue-600 rounded-xl hover:bg-gray-100 transition-colors font-semibold shadow-lg flex items-center gap-2"
            >
              <ArrowUpTrayIcon className="w-5 h-5" />
              Import Mutasi BCA
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-600 mb-1">Belum Match</p>
              <p className="text-3xl font-bold text-gray-900">{formatCurrency(totalPending)}</p>
              <p className="text-xs text-gray-500 mt-1">{transactions.filter(t => t.status === 'PENDING').length} transaksi</p>
            </div>
            <div className="bg-yellow-100 p-4 rounded-xl">
              <ClockIcon className="w-10 h-10 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-600 mb-1">Sudah Match</p>
              <p className="text-3xl font-bold text-blue-600">{formatCurrency(totalMatched)}</p>
              <p className="text-xs text-gray-500 mt-1">{transactions.filter(t => t.status === 'MATCHED').length} transaksi</p>
            </div>
            <div className="bg-blue-100 p-4 rounded-xl">
              <DocumentTextIcon className="w-10 h-10 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-600 mb-1">Disetujui</p>
              <p className="text-3xl font-bold text-green-600">{formatCurrency(totalApproved)}</p>
              <p className="text-xs text-gray-500 mt-1">{transactions.filter(t => t.status === 'APPROVED').length} transaksi</p>
            </div>
            <div className="bg-green-100 p-4 rounded-xl">
              <CheckCircleIcon className="w-10 h-10 text-green-600" />
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
              placeholder="Cari pengirim atau invoice..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Semua Status</option>
            <option value="PENDING">Belum Match</option>
            <option value="MATCHED">Sudah Match</option>
            <option value="APPROVED">Disetujui</option>
          </select>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-blue-700 to-blue-500">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase">Tanggal</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase">Pengirim (PT)</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-white uppercase">Nominal</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase">Keterangan</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase">Match Invoice</th>
                <th className="px-6 py-4 text-center text-xs font-bold text-white uppercase">Status</th>
                <th className="px-6 py-4 text-center text-xs font-bold text-white uppercase">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    <BanknotesIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                    <p className="text-lg font-semibold">Belum ada mutasi rekening</p>
                    <p className="text-sm mt-2">Klik "Import Mutasi BCA" untuk upload file Excel/CSV</p>
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((trx) => (
                  <tr key={trx.id} className="hover:bg-blue-50 transition-colors">
                    <td className="px-6 py-4 text-sm">{formatDate(trx.transaction_date)}</td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900">{trx.sender_name}</div>
                      {trx.sender_account && (
                        <div className="text-xs text-gray-500">{trx.sender_account}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-lg text-green-600">
                      {formatCurrency(trx.amount)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{trx.description}</td>
                    <td className="px-6 py-4">
                      {trx.status === 'PENDING' ? (
                        <select
                          onChange={(e) => handleManualMatch(trx.id, e.target.value)}
                          className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                        >
                          <option value="">-- Pilih Invoice --</option>
                          {invoices
                            .filter(inv => Math.abs(inv.remaining_amount - trx.amount) < inv.remaining_amount * 0.1) // Allow 10% tolerance
                            .map(inv => (
                              <option key={inv.id} value={inv.id}>
                                {inv.invoice_number} - {inv.customer_name} ({formatCurrency(inv.remaining_amount)})
                              </option>
                            ))}
                        </select>
                      ) : (
                        <div className="font-semibold text-blue-600">{trx.matched_invoice_number}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(trx.status)}`}>
                        {trx.status === 'APPROVED' && <CheckCircleIcon className="w-4 h-4 mr-1" />}
                        {getStatusLabel(trx.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {trx.status === 'MATCHED' && (
                        <button
                          onClick={() => handleApprovePayment(trx.id)}
                          disabled={isLoading}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-green-500 to-green-600 text-white text-sm font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-50"
                        >
                          <CheckCircleIcon className="w-4 h-4" />
                          Approve
                        </button>
                      )}
                      {trx.status === 'APPROVED' && (
                        <span className="text-sm text-green-600 font-semibold">✓ Done</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Import Mutasi Rekening BCA</h2>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <p className="text-sm text-blue-800 font-semibold mb-2">📋 Format File Excel/CSV:</p>
                <ul className="text-xs text-blue-700 space-y-1">
                  <li>• Kolom 1: <strong>Tanggal</strong> (format: DD/MM/YYYY atau YYYY-MM-DD)</li>
                  <li>• Kolom 2: <strong>Nama Pengirim</strong> (nama PT/perusahaan)</li>
                  <li>• Kolom 3: <strong>Nominal</strong> (jumlah transfer masuk)</li>
                  <li>• Kolom 4: <strong>Keterangan</strong> (optional)</li>
                </ul>
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-500 transition-colors">
                <ArrowUpTrayIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">Pilih file Excel atau CSV mutasi rekening BCA</p>
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-semibold cursor-pointer"
                >
                  <ArrowUpTrayIcon className="w-5 h-5" />
                  Pilih File
                </label>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors font-semibold"
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BankReconciliation;

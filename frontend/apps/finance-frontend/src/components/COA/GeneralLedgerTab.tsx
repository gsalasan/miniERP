import React, { useState, useEffect } from 'react';
import {
  MagnifyingGlassIcon,
  CalendarIcon,
  ArrowPathIcon,
  DocumentArrowDownIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';

interface JournalEntry {
  id: string;
  transaction_date: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
  reference_id?: string;
  reference_type?: string;
}

interface GeneralLedgerData {
  account_id: number;
  account_code: string;
  account_name: string;
  account_type: string;
  opening_balance: number;
  closing_balance: number;
  total_debit: number;
  total_credit: number;
  entries: JournalEntry[];
}

interface Account {
  id: number;
  account_code: string;
  account_name: string;
  account_type: string;
}

const GeneralLedgerTab: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
  const [ledgerData, setLedgerData] = useState<GeneralLedgerData | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Date filters
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  
  // Quick date filters
  const [quickFilter, setQuickFilter] = useState<'all' | 'today' | 'this-week' | 'this-month' | 'this-year' | 'custom'>('this-month');

  // Load accounts on mount
  useEffect(() => {
    fetchAccounts();
  }, []);

  // Load ledger when account or dates change
  useEffect(() => {
    if (selectedAccountId) {
      fetchGeneralLedger();
    }
  }, [selectedAccountId, startDate, endDate]);

  const fetchAccounts = async () => {
    try {
      const response = await fetch('/api/chartofaccounts'); // Use Vite proxy to backend
      if (response.ok) {
        const data = await response.json();
        setAccounts(data.data || data); // Handle { success, data } format
        if ((data.data || data).length > 0 && !selectedAccountId) {
          setSelectedAccountId((data.data || data)[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching accounts:', error);
    }
  };

  const fetchGeneralLedger = async () => {
    if (!selectedAccountId) {
      console.log('⚠️ No account selected for General Ledger');
      return;
    }
    
    setLoading(true);
    try {
      let url = `/api/reports/general-ledger/${selectedAccountId}`; // Use Vite proxy
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (params.toString()) url += `?${params.toString()}`;

      console.log('📡 Fetching General Ledger:', url);
      const response = await fetch(url);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ General Ledger data from DB:', data);
        console.log('📊 Entries count:', data.entries?.length || 0);
        setLedgerData(data);
      } else {
        console.error('❌ Failed to fetch general ledger:', response.status);
        const errorText = await response.text();
        console.error('Error details:', errorText);
      }
    } catch (error) {
      console.error('❌ Error fetching general ledger:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyQuickFilter = (filter: typeof quickFilter) => {
    setQuickFilter(filter);
    const today = new Date();
    
    switch (filter) {
      case 'today':
        setStartDate(today.toISOString().split('T')[0]);
        setEndDate(today.toISOString().split('T')[0]);
        break;
      case 'this-week':
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        setStartDate(weekStart.toISOString().split('T')[0]);
        setEndDate(today.toISOString().split('T')[0]);
        break;
      case 'this-month':
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        setStartDate(monthStart.toISOString().split('T')[0]);
        setEndDate(today.toISOString().split('T')[0]);
        break;
      case 'this-year':
        const yearStart = new Date(today.getFullYear(), 0, 1);
        setStartDate(yearStart.toISOString().split('T')[0]);
        setEndDate(today.toISOString().split('T')[0]);
        break;
      case 'all':
        setStartDate('');
        setEndDate('');
        break;
      case 'custom':
        // User will set dates manually
        break;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const exportToCSV = () => {
    if (!ledgerData) return;

    const headers = ['Tanggal', 'Deskripsi', 'Referensi', 'Debit', 'Kredit', 'Saldo'];
    const rows = ledgerData.entries.map(entry => [
      formatDate(entry.transaction_date),
      entry.description || '-',
      entry.reference_id || '-',
      entry.debit.toString(),
      entry.credit.toString(),
      entry.balance.toString(),
    ]);

    const csv = [
      `Buku Besar - ${ledgerData.account_code} ${ledgerData.account_name}`,
      `Periode: ${startDate ? formatDate(startDate) : 'Awal'} s/d ${endDate ? formatDate(endDate) : 'Akhir'}`,
      '',
      headers.join(','),
      ...rows.map(row => row.join(',')),
      '',
      `Total Debit,${ledgerData.total_debit}`,
      `Total Kredit,${ledgerData.total_credit}`,
      `Saldo Akhir,${ledgerData.closing_balance}`,
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `buku-besar-${ledgerData.account_code}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const filteredAccounts = accounts.filter(
    account =>
      account.account_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      account.account_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl shadow-sm border border-emerald-200 p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-emerald-900 mb-2">
              Buku Besar (General Ledger)
            </h2>
            <p className="text-emerald-700">
              Detail transaksi per akun dengan saldo berjalan yang dihitung otomatis dari Journal Entries
            </p>
          </div>
          <button
            onClick={exportToCSV}
            disabled={!ledgerData || ledgerData.entries.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-white text-emerald-700 rounded-lg border border-emerald-300 hover:bg-emerald-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <DocumentArrowDownIcon className="h-5 w-5" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Account Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pilih Akun
            </label>
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Cari kode atau nama akun..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
            <select
              value={selectedAccountId || ''}
              onChange={(e) => setSelectedAccountId(Number(e.target.value))}
              className="mt-2 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              <option value="">-- Pilih Akun --</option>
              {filteredAccounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.account_code} - {account.account_name} ({account.account_type})
                </option>
              ))}
            </select>
          </div>

          {/* Date Range Filters */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Periode
            </label>
            <div className="flex gap-2 mb-2">
              {(['all', 'today', 'this-week', 'this-month', 'this-year', 'custom'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => applyQuickFilter(filter)}
                  className={`px-3 py-1 text-sm rounded-lg transition-all ${
                    quickFilter === filter
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {filter === 'all' && 'Semua'}
                  {filter === 'today' && 'Hari Ini'}
                  {filter === 'this-week' && 'Minggu Ini'}
                  {filter === 'this-month' && 'Bulan Ini'}
                  {filter === 'this-year' && 'Tahun Ini'}
                  {filter === 'custom' && 'Custom'}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Dari Tanggal</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setQuickFilter('custom');
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Sampai Tanggal</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setQuickFilter('custom');
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end mt-4">
          <button
            onClick={fetchGeneralLedger}
            disabled={!selectedAccountId || loading}
            className="flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <ArrowPathIcon className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Memuat...' : 'Tampilkan'}
          </button>
        </div>
      </div>

      {/* Ledger Data */}
      {ledgerData && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="text-sm text-gray-600 mb-1">Saldo Awal</div>
              <div className="text-2xl font-bold text-gray-900">
                {formatCurrency(ledgerData.opening_balance)}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-emerald-200 p-4">
              <div className="text-sm text-emerald-600 mb-1">Total Debit</div>
              <div className="text-2xl font-bold text-emerald-700">
                {formatCurrency(ledgerData.total_debit)}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-rose-200 p-4">
              <div className="text-sm text-rose-600 mb-1">Total Kredit</div>
              <div className="text-2xl font-bold text-rose-700">
                {formatCurrency(ledgerData.total_credit)}
              </div>
            </div>
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg shadow-md p-4">
              <div className="text-sm text-white/80 mb-1">Saldo Akhir</div>
              <div className="text-2xl font-bold text-white">
                {formatCurrency(ledgerData.closing_balance)}
              </div>
            </div>
          </div>

          {/* Transactions Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tanggal
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Deskripsi
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Referensi
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Debit
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Kredit
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Saldo
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {ledgerData.entries.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                        Tidak ada transaksi untuk periode yang dipilih
                      </td>
                    </tr>
                  ) : (
                    ledgerData.entries.map((entry, index) => (
                      <tr key={entry.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(entry.transaction_date)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {entry.description || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {entry.reference_type && entry.reference_id
                            ? `${entry.reference_type}-${entry.reference_id.substring(0, 8)}`
                            : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-emerald-700 font-medium">
                          {entry.debit > 0 ? formatCurrency(entry.debit) : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-rose-700 font-medium">
                          {entry.credit > 0 ? formatCurrency(entry.credit) : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-gray-900">
                          {formatCurrency(entry.balance)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {ledgerData.entries.length > 0 && (
                  <tfoot className="bg-gray-100 font-bold">
                    <tr>
                      <td colSpan={3} className="px-6 py-4 text-sm text-gray-900">
                        TOTAL
                      </td>
                      <td className="px-6 py-4 text-sm text-right text-emerald-700">
                        {formatCurrency(ledgerData.total_debit)}
                      </td>
                      <td className="px-6 py-4 text-sm text-right text-rose-700">
                        {formatCurrency(ledgerData.total_credit)}
                      </td>
                      <td className="px-6 py-4 text-sm text-right text-gray-900">
                        {formatCurrency(ledgerData.closing_balance)}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </>
      )}

      {/* Empty State */}
      {!ledgerData && !loading && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <FunnelIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            Pilih Akun untuk Melihat Buku Besar
          </h3>
          <p className="text-gray-500">
            Pilih akun dan periode untuk menampilkan detail transaksi dengan saldo berjalan
          </p>
        </div>
      )}
    </div>
  );
};

export default GeneralLedgerTab;

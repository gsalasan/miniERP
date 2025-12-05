import React, { useState, useEffect } from 'react';
import {
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  DocumentArrowDownIcon,
  CalendarIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';

interface TrialBalanceEntry {
  account_id: number;
  account_code: string;
  account_name: string;
  account_type: string;
  debit: number;
  credit: number;
  balance: number;
}

interface TrialBalanceData {
  as_of_date: string;
  entries: TrialBalanceEntry[];
  total_debit: number;
  total_credit: number;
  difference: number;
  is_balanced: boolean;
}

interface AccountTypeSummary {
  account_type: string;
  debit: number;
  credit: number;
  balance: number;
  count: number;
}

const TrialBalanceTab: React.FC = () => {
  const [trialBalanceData, setTrialBalanceData] = useState<TrialBalanceData | null>(null);
  const [loading, setLoading] = useState(false);
  const [asOfDate, setAsOfDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [groupByType, setGroupByType] = useState(false);
  const [filterAccountType, setFilterAccountType] = useState<string>('all');

  useEffect(() => {
    fetchTrialBalance();
  }, [asOfDate]);

  const fetchTrialBalance = async () => {
    setLoading(true);
    try {
      let url = '/api/reports/trial-balance'; // Use Vite proxy
      if (asOfDate) {
        url += `?asOfDate=${asOfDate}`;
      }

      console.log('📡 Fetching Trial Balance:', url);
      const response = await fetch(url);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Trial Balance data from DB:', data);
        console.log('📊 Entries count:', data.entries?.length || 0);
        console.log('⚖️ Is Balanced:', data.is_balanced);
        setTrialBalanceData(data);
      } else {
        console.error('❌ Failed to fetch trial balance:', response.status);
      }
    } catch (error) {
      console.error('❌ Error fetching trial balance:', error);
    } finally {
      setLoading(false);
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
      month: 'long',
      year: 'numeric',
    });
  };

  const exportToCSV = () => {
    if (!trialBalanceData) return;

    const headers = ['Kode Akun', 'Nama Akun', 'Tipe', 'Debit', 'Kredit', 'Saldo'];
    const rows = filteredEntries.map(entry => [
      entry.account_code,
      entry.account_name,
      entry.account_type,
      entry.debit.toString(),
      entry.credit.toString(),
      entry.balance.toString(),
    ]);

    const csv = [
      `Neraca Saldo per ${formatDate(trialBalanceData.as_of_date)}`,
      '',
      headers.join(','),
      ...rows.map(row => row.join(',')),
      '',
      `TOTAL,${trialBalanceData.total_debit},${trialBalanceData.total_credit}`,
      `Selisih,${trialBalanceData.difference}`,
      `Status,${trialBalanceData.is_balanced ? 'BALANCED' : 'NOT BALANCED'}`,
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `neraca-saldo-${asOfDate}.csv`;
    a.click();
  };

  const getAccountTypeSummary = (): AccountTypeSummary[] => {
    if (!trialBalanceData) return [];

    const summary = new Map<string, AccountTypeSummary>();

    trialBalanceData.entries.forEach(entry => {
      if (!summary.has(entry.account_type)) {
        summary.set(entry.account_type, {
          account_type: entry.account_type,
          debit: 0,
          credit: 0,
          balance: 0,
          count: 0,
        });
      }

      const item = summary.get(entry.account_type)!;
      item.debit += entry.debit;
      item.credit += entry.credit;
      item.balance += entry.balance;
      item.count += 1;
    });

    return Array.from(summary.values());
  };

  const filteredEntries = trialBalanceData?.entries.filter(entry => 
    filterAccountType === 'all' || entry.account_type === filterAccountType
  ) || [];

  const accountTypes = ['Asset', 'Liability', 'Equity', 'Revenue', 'Expense'];

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-xl shadow-sm border border-violet-200 p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-violet-900 mb-2">
              Neraca Saldo (Trial Balance)
            </h2>
            <p className="text-violet-700">
              Validasi otomatis bahwa Total Debit = Total Kredit dari semua akun
            </p>
          </div>
          <button
            onClick={exportToCSV}
            disabled={!trialBalanceData}
            className="flex items-center gap-2 px-4 py-2 bg-white text-violet-700 rounded-lg border border-violet-300 hover:bg-violet-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <DocumentArrowDownIcon className="h-5 w-5" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Date Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <CalendarIcon className="inline h-5 w-5 mr-1" />
              Per Tanggal
            </label>
            <input
              type="date"
              value={asOfDate}
              onChange={(e) => setAsOfDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            />
          </div>

          {/* Account Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter Tipe Akun
            </label>
            <select
              value={filterAccountType}
              onChange={(e) => setFilterAccountType(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            >
              <option value="all">Semua Tipe</option>
              {accountTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          {/* View Toggle */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tampilan
            </label>
            <button
              onClick={() => setGroupByType(!groupByType)}
              className={`w-full px-4 py-2 rounded-lg border transition-all ${
                groupByType
                  ? 'bg-violet-600 text-white border-violet-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              <ChartBarIcon className="inline h-5 w-5 mr-2" />
              {groupByType ? 'Ringkasan per Tipe' : 'Detail per Akun'}
            </button>
          </div>
        </div>

        <div className="flex justify-end mt-4">
          <button
            onClick={fetchTrialBalance}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <ArrowPathIcon className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Memuat...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Balance Status Card */}
      {trialBalanceData && (
        <div className={`rounded-xl shadow-sm border p-6 ${
          trialBalanceData.is_balanced
            ? 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-300'
            : 'bg-gradient-to-br from-rose-50 to-red-50 border-rose-300'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {trialBalanceData.is_balanced ? (
                <CheckCircleIcon className="h-12 w-12 text-emerald-600" />
              ) : (
                <XCircleIcon className="h-12 w-12 text-rose-600" />
              )}
              <div>
                <h3 className={`text-2xl font-bold ${
                  trialBalanceData.is_balanced ? 'text-emerald-900' : 'text-rose-900'
                }`}>
                  {trialBalanceData.is_balanced ? 'NERACA SEIMBANG ✓' : 'NERACA TIDAK SEIMBANG ✗'}
                </h3>
                <p className={`text-sm ${
                  trialBalanceData.is_balanced ? 'text-emerald-700' : 'text-rose-700'
                }`}>
                  Per {formatDate(trialBalanceData.as_of_date)}
                </p>
              </div>
            </div>
            {!trialBalanceData.is_balanced && (
              <div className="text-right">
                <div className="text-sm text-rose-700 mb-1">Selisih</div>
                <div className="text-2xl font-bold text-rose-900">
                  {formatCurrency(Math.abs(trialBalanceData.difference))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Summary Cards */}
      {trialBalanceData && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg shadow-sm border border-blue-200 p-5">
            <div className="text-sm font-medium text-blue-600 mb-2">Total Debit</div>
            <div className="text-2xl font-bold text-blue-700">
              {formatCurrency(trialBalanceData.total_debit)}
            </div>
            <div className="text-xs text-gray-600 mt-2">
              {trialBalanceData.entries.length} akun
            </div>
          </div>
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg shadow-sm border border-amber-200 p-5">
            <div className="text-sm font-medium text-amber-600 mb-2">Total Kredit</div>
            <div className="text-2xl font-bold text-amber-700">
              {formatCurrency(trialBalanceData.total_credit)}
            </div>
            <div className="text-xs text-gray-600 mt-2">
              {trialBalanceData.entries.length} akun
            </div>
          </div>
          <div className={`rounded-lg shadow-sm border-2 p-5 ${
            trialBalanceData.is_balanced
              ? 'bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-300'
              : 'bg-gradient-to-br from-rose-50 to-red-50 border-rose-300'
          }`}>
            <div className={`text-sm font-medium mb-2 ${
              trialBalanceData.is_balanced ? 'text-emerald-600' : 'text-rose-600'
            }`}>
              {trialBalanceData.is_balanced ? 'Status' : 'Selisih'}
            </div>
            <div className={`text-2xl font-bold ${
              trialBalanceData.is_balanced ? 'text-emerald-700' : 'text-rose-700'
            }`}>
              {trialBalanceData.is_balanced 
                ? '✓ BALANCED' 
                : formatCurrency(Math.abs(trialBalanceData.difference))
              }
            </div>
          </div>
        </div>
      )}

      {/* Summary by Account Type */}
      {trialBalanceData && groupByType && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Ringkasan per Tipe Akun
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Tipe Akun
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Jumlah Akun
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Total Debit
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Total Kredit
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Saldo
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {getAccountTypeSummary().map((summary) => (
                  <tr key={summary.account_type} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-3 py-1 text-sm font-medium rounded-full bg-violet-100 text-violet-800">
                        {summary.account_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-gray-900">
                      {summary.count}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-emerald-700 font-medium">
                      {formatCurrency(summary.debit)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-rose-700 font-medium">
                      {formatCurrency(summary.credit)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-gray-900">
                      {formatCurrency(summary.balance)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detailed Table */}
      {trialBalanceData && !groupByType && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Detail per Akun {filterAccountType !== 'all' && `(${filterAccountType})`}
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Kode
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Nama Akun
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Tipe
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Debit
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Kredit
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Saldo
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredEntries.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      Tidak ada data untuk filter yang dipilih
                    </td>
                  </tr>
                ) : (
                  filteredEntries.map((entry) => (
                    <tr key={entry.account_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {entry.account_code}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {entry.account_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className="px-2 py-1 text-xs rounded-full bg-violet-100 text-violet-800">
                          {entry.account_type}
                        </span>
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
              {filteredEntries.length > 0 && (
                <tfoot className="bg-gray-100 font-bold">
                  <tr>
                    <td colSpan={3} className="px-6 py-4 text-sm text-gray-900">
                      TOTAL
                    </td>
                    <td className="px-6 py-4 text-sm text-right text-emerald-700">
                      {formatCurrency(trialBalanceData.total_debit)}
                    </td>
                    <td className="px-6 py-4 text-sm text-right text-rose-700">
                      {formatCurrency(trialBalanceData.total_credit)}
                    </td>
                    <td className="px-6 py-4 text-sm text-right text-gray-900">
                      {trialBalanceData.is_balanced ? (
                        <span className="text-emerald-700">✓ BALANCED</span>
                      ) : (
                        <span className="text-rose-700">✗ {formatCurrency(Math.abs(trialBalanceData.difference))}</span>
                      )}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrialBalanceTab;

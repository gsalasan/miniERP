import React, { useState, useEffect } from 'react';
import {
  ArrowPathIcon,
  DocumentArrowDownIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
} from '@heroicons/react/24/outline';

interface AccountBalance {
  account_id: number;
  account_code: string;
  account_name: string;
  balance: number;
}

interface IncomeStatementData {
  period: {
    start_date: string;
    end_date: string;
  };
  revenue: {
    accounts: AccountBalance[];
    total: number;
  };
  cost_of_service: {
    accounts: AccountBalance[];
    total: number;
  };
  gross_profit: number;
  gross_profit_margin: number;
  expenses: {
    accounts: AccountBalance[];
    total: number;
  };
  net_profit: number;
  net_profit_margin: number;
}

const IncomeStatementTab: React.FC = () => {
  const [incomeStatementData, setIncomeStatementData] = useState<IncomeStatementData | null>(null);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [quickFilter, setQuickFilter] = useState<'this-month' | 'this-quarter' | 'this-year' | 'custom'>('this-month');
  const [showDetails, setShowDetails] = useState(true);

  useEffect(() => {
    // Set default to current month
    const today = new Date();
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    setStartDate(monthStart.toISOString().split('T')[0]);
    setEndDate(today.toISOString().split('T')[0]);
  }, []);

  useEffect(() => {
    if (startDate && endDate) {
      fetchIncomeStatement();
    }
  }, [startDate, endDate]);

  const applyQuickFilter = (filter: typeof quickFilter) => {
    setQuickFilter(filter);
    const today = new Date();
    
    switch (filter) {
      case 'this-month':
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        setStartDate(monthStart.toISOString().split('T')[0]);
        setEndDate(today.toISOString().split('T')[0]);
        break;
      case 'this-quarter':
        const quarter = Math.floor(today.getMonth() / 3);
        const quarterStart = new Date(today.getFullYear(), quarter * 3, 1);
        setStartDate(quarterStart.toISOString().split('T')[0]);
        setEndDate(today.toISOString().split('T')[0]);
        break;
      case 'this-year':
        const yearStart = new Date(today.getFullYear(), 0, 1);
        setStartDate(yearStart.toISOString().split('T')[0]);
        setEndDate(today.toISOString().split('T')[0]);
        break;
      case 'custom':
        // User will set dates manually
        break;
    }
  };

  const fetchIncomeStatement = async () => {
    setLoading(true);
    try {
      let url = '/api/reports/income-statement'; // Use Vite proxy
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (params.toString()) url += `?${params.toString()}`;

      console.log('📡 Fetching Income Statement:', url);
      const response = await fetch(url);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Income Statement data from DB:', data);
        console.log('📊 Total Revenue:', data.revenue?.total);
        console.log('📊 Total Expenses:', data.expenses?.total);
        console.log('💰 Net Income:', data.net_income);
        setIncomeStatementData(data);
      } else {
        console.error('❌ Failed to fetch income statement:', response.status);
      }
    } catch (error) {
      console.error('❌ Error fetching income statement:', error);
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

  const formatPercent = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  const exportToCSV = () => {
    if (!incomeStatementData) return;

    const csv = [
      `LAPORAN LABA RUGI (INCOME STATEMENT)`,
      `Periode: ${formatDate(incomeStatementData.period.start_date)} s/d ${formatDate(incomeStatementData.period.end_date)}`,
      '',
      'PENDAPATAN (REVENUE)',
      'Kode,Nama Akun,Jumlah',
      ...incomeStatementData.revenue.accounts.map(acc => 
        `${acc.account_code},${acc.account_name},${acc.balance}`
      ),
      `TOTAL PENDAPATAN,,${incomeStatementData.revenue.total}`,
      '',
      'HARGA POKOK PENJUALAN (COST OF SERVICE)',
      'Kode,Nama Akun,Jumlah',
      ...incomeStatementData.cost_of_service.accounts.map(acc => 
        `${acc.account_code},${acc.account_name},${acc.balance}`
      ),
      `TOTAL HPP,,${incomeStatementData.cost_of_service.total}`,
      '',
      `LABA KOTOR (GROSS PROFIT),,${incomeStatementData.gross_profit}`,
      `MARGIN LABA KOTOR,,${incomeStatementData.gross_profit_margin}%`,
      '',
      'BEBAN OPERASIONAL (EXPENSES)',
      'Kode,Nama Akun,Jumlah',
      ...incomeStatementData.expenses.accounts.map(acc => 
        `${acc.account_code},${acc.account_name},${acc.balance}`
      ),
      `TOTAL BEBAN,,${incomeStatementData.expenses.total}`,
      '',
      `LABA BERSIH (NET PROFIT),,${incomeStatementData.net_profit}`,
      `MARGIN LABA BERSIH,,${incomeStatementData.net_profit_margin}%`,
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `laba-rugi-${startDate}-${endDate}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="bg-gradient-to-br from-rose-50 to-pink-50 rounded-xl shadow-sm border border-rose-200 p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-rose-900 mb-2">
              Laporan Laba Rugi (Income Statement)
            </h2>
            <p className="text-rose-700">
              Laporan Kinerja: Pendapatan - HPP - Beban = Laba Bersih (dihitung otomatis)
            </p>
          </div>
          <button
            onClick={exportToCSV}
            disabled={!incomeStatementData}
            className="flex items-center gap-2 px-4 py-2 bg-white text-rose-700 rounded-lg border border-rose-300 hover:bg-rose-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <DocumentArrowDownIcon className="h-5 w-5" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Period Filter */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <CalendarIcon className="inline h-5 w-5 mr-1" />
              Periode
            </label>
            <div className="flex gap-2 mb-2">
              {(['this-month', 'this-quarter', 'this-year', 'custom'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => applyQuickFilter(filter)}
                  className={`px-3 py-1 text-sm rounded-lg transition-all ${
                    quickFilter === filter
                      ? 'bg-rose-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {filter === 'this-month' && 'Bulan Ini'}
                  {filter === 'this-quarter' && 'Kuartal Ini'}
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* View Toggle & Refresh */}
          <div className="space-y-2">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className={`w-full px-4 py-2 rounded-lg border transition-all ${
                showDetails
                  ? 'bg-rose-600 text-white border-rose-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              <CurrencyDollarIcon className="inline h-5 w-5 mr-2" />
              {showDetails ? 'Detail per Akun' : 'Ringkasan Total'}
            </button>
            <button
              onClick={fetchIncomeStatement}
              disabled={loading || !startDate || !endDate}
              className="w-full flex items-center justify-center gap-2 px-6 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <ArrowPathIcon className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Memuat...' : 'Refresh'}
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      {incomeStatementData && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-teal-50 to-emerald-50 rounded-lg shadow-sm border border-teal-200 p-5">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium text-teal-600">Pendapatan</div>
              <ArrowTrendingUpIcon className="h-5 w-5 text-teal-400" />
            </div>
            <div className="text-2xl font-bold text-teal-700">
              {formatCurrency(incomeStatementData.revenue.total)}
            </div>
            <div className="text-xs text-gray-600 mt-2">
              {incomeStatementData.revenue.accounts.length} akun
            </div>
          </div>
          <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-lg shadow-sm border border-orange-200 p-5">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium text-orange-600">HPP</div>
              <ArrowTrendingDownIcon className="h-5 w-5 text-orange-400" />
            </div>
            <div className="text-2xl font-bold text-orange-700">
              {formatCurrency(incomeStatementData.cost_of_service.total)}
            </div>
            <div className="text-xs text-gray-600 mt-2">
              {incomeStatementData.cost_of_service.accounts.length} akun
            </div>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-lg shadow-sm border border-purple-200 p-5">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium text-purple-600">Beban</div>
              <ArrowTrendingDownIcon className="h-5 w-5 text-purple-400" />
            </div>
            <div className="text-2xl font-bold text-purple-700">
              {formatCurrency(incomeStatementData.expenses.total)}
            </div>
            <div className="text-xs text-gray-600 mt-2">
              {incomeStatementData.expenses.accounts.length} akun
            </div>
          </div>
          <div className={`rounded-lg shadow-sm border-2 p-5 ${
            incomeStatementData.net_profit >= 0
              ? 'bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-300'
              : 'bg-gradient-to-br from-rose-50 to-red-50 border-rose-300'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <div className={`text-sm font-semibold ${
                incomeStatementData.net_profit >= 0 ? 'text-emerald-600' : 'text-rose-600'
              }`}>
                {incomeStatementData.net_profit >= 0 ? '💰 Laba Bersih' : '📉 Rugi Bersih'}
              </div>
              {incomeStatementData.net_profit >= 0 ? (
                <ArrowTrendingUpIcon className="h-6 w-6 text-emerald-400" />
              ) : (
                <ArrowTrendingDownIcon className="h-6 w-6 text-rose-400" />
              )}
            </div>
            <div className={`text-2xl font-bold mb-1 ${
              incomeStatementData.net_profit >= 0 ? 'text-emerald-700' : 'text-rose-700'
            }`}>
              {formatCurrency(incomeStatementData.net_profit)}
            </div>
            <div className={`text-xs font-medium ${
              incomeStatementData.net_profit >= 0 ? 'text-emerald-600' : 'text-rose-600'
            }`}>
              Margin: {formatPercent(incomeStatementData.net_profit_margin)}
            </div>
          </div>
        </div>
      )}

      {/* Income Statement Details */}
      {incomeStatementData && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Laporan Laba Rugi - {formatDate(incomeStatementData.period.start_date)} s/d {formatDate(incomeStatementData.period.end_date)}
            </h3>
          </div>

          <div className="p-6 space-y-6">
            {/* REVENUE */}
            <div>
              <div className="bg-emerald-50 px-4 py-2 rounded-t-lg border-l-4 border-emerald-600">
                <h4 className="font-bold text-emerald-900">PENDAPATAN (REVENUE)</h4>
              </div>
              {showDetails && (
                <table className="w-full">
                  <tbody>
                    {incomeStatementData.revenue.accounts.map((account) => (
                      <tr key={account.account_id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-2 text-sm text-gray-600">{account.account_code}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{account.account_name}</td>
                        <td className="px-4 py-2 text-sm text-right font-medium text-emerald-700">
                          {formatCurrency(account.balance)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              <div className="bg-emerald-100 px-4 py-3 flex justify-between items-center font-bold">
                <span className="text-emerald-900">Total Pendapatan</span>
                <span className="text-xl text-emerald-900">
                  {formatCurrency(incomeStatementData.revenue.total)}
                </span>
              </div>
            </div>

            {/* COST OF SERVICE */}
            <div>
              <div className="bg-orange-50 px-4 py-2 rounded-t-lg border-l-4 border-orange-600">
                <h4 className="font-bold text-orange-900">HARGA POKOK PENJUALAN (COST OF SERVICE)</h4>
              </div>
              {showDetails && (
                <table className="w-full">
                  <tbody>
                    {incomeStatementData.cost_of_service.accounts.map((account) => (
                      <tr key={account.account_id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-2 text-sm text-gray-600">{account.account_code}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{account.account_name}</td>
                        <td className="px-4 py-2 text-sm text-right font-medium text-orange-700">
                          {formatCurrency(account.balance)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              <div className="bg-orange-100 px-4 py-3 flex justify-between items-center font-bold">
                <span className="text-orange-900">Total HPP</span>
                <span className="text-xl text-orange-900">
                  ({formatCurrency(incomeStatementData.cost_of_service.total)})
                </span>
              </div>
            </div>

            {/* GROSS PROFIT */}
            <div className={`px-6 py-4 rounded-lg ${
              incomeStatementData.gross_profit >= 0
                ? 'bg-gradient-to-r from-sky-50 to-blue-50 border-2 border-sky-300'
                : 'bg-gradient-to-r from-rose-50 to-red-50 border-2 border-rose-300'
            }`}>
              <div className="flex justify-between items-center">
                <div>
                  <h4 className={`font-bold text-lg ${
                    incomeStatementData.gross_profit >= 0 ? 'text-sky-900' : 'text-rose-900'
                  }`}>
                    LABA KOTOR (GROSS PROFIT)
                  </h4>
                  <p className="text-sm text-gray-600">
                    Margin: {formatPercent(incomeStatementData.gross_profit_margin)}
                  </p>
                </div>
                <span className={`text-3xl font-bold ${
                  incomeStatementData.gross_profit >= 0 ? 'text-sky-900' : 'text-rose-900'
                }`}>
                  {formatCurrency(incomeStatementData.gross_profit)}
                </span>
              </div>
            </div>

            {/* EXPENSES */}
            <div>
              <div className="bg-violet-50 px-4 py-2 rounded-t-lg border-l-4 border-violet-600">
                <h4 className="font-bold text-violet-900">BEBAN OPERASIONAL (EXPENSES)</h4>
              </div>
              {showDetails && (
                <table className="w-full">
                  <tbody>
                    {incomeStatementData.expenses.accounts.map((account) => (
                      <tr key={account.account_id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-2 text-sm text-gray-600">{account.account_code}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{account.account_name}</td>
                        <td className="px-4 py-2 text-sm text-right font-medium text-violet-700">
                          {formatCurrency(account.balance)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              <div className="bg-violet-100 px-4 py-3 flex justify-between items-center font-bold">
                <span className="text-violet-900">Total Beban</span>
                <span className="text-xl text-violet-900">
                  ({formatCurrency(incomeStatementData.expenses.total)})
                </span>
              </div>
            </div>

            {/* NET PROFIT */}
            <div className={`px-8 py-6 rounded-lg shadow-lg ${
              incomeStatementData.net_profit >= 0
                ? 'bg-gradient-to-br from-emerald-500 to-teal-600'
                : 'bg-gradient-to-br from-rose-500 to-red-600'
            }`}>
              <div className="flex justify-between items-center text-white">
                <div>
                  <h4 className="font-bold text-2xl mb-2">
                    {incomeStatementData.net_profit >= 0 ? 'LABA BERSIH' : 'RUGI BERSIH'}
                  </h4>
                  <p className="text-sm text-white/80">
                    Net Profit Margin: {formatPercent(incomeStatementData.net_profit_margin)}
                  </p>
                </div>
                <span className="text-5xl font-bold">
                  {formatCurrency(incomeStatementData.net_profit)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!incomeStatementData && !loading && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <CurrencyDollarIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            Pilih Periode untuk Melihat Laporan Laba Rugi
          </h3>
          <p className="text-gray-500">
            Laporan akan dihitung otomatis dari Journal Entries dalam periode yang dipilih
          </p>
        </div>
      )}
    </div>
  );
};

export default IncomeStatementTab;

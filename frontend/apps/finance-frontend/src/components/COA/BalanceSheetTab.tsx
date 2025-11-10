import React, { useState, useEffect } from 'react';
import {
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  DocumentArrowDownIcon,
  CalendarIcon,
  ScaleIcon,
} from '@heroicons/react/24/outline';

interface AccountBalance {
  account_id: number;
  account_code: string;
  account_name: string;
  balance: number;
}

interface BalanceSheetData {
  as_of_date: string;
  assets: {
    accounts: AccountBalance[];
    total: number;
  };
  liabilities: {
    accounts: AccountBalance[];
    total: number;
  };
  equity: {
    accounts: AccountBalance[];
    total: number;
  };
  total_liabilities_and_equity: number;
  is_balanced: boolean;
  difference: number;
}

const BalanceSheetTab: React.FC = () => {
  const [balanceSheetData, setBalanceSheetData] = useState<BalanceSheetData | null>(null);
  const [loading, setLoading] = useState(false);
  const [asOfDate, setAsOfDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [showDetails, setShowDetails] = useState(true);

  useEffect(() => {
    fetchBalanceSheet();
  }, [asOfDate]);

  const fetchBalanceSheet = async () => {
    setLoading(true);
    try {
      let url = '/api/reports/balance-sheet'; // Use Vite proxy
      if (asOfDate) {
        url += `?asOfDate=${asOfDate}`;
      }

      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setBalanceSheetData(data);
      }
    } catch (error) {
      console.error('Error fetching balance sheet:', error);
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
    if (!balanceSheetData) return;

    const csv = [
      `NERACA (BALANCE SHEET)`,
      `Per ${formatDate(balanceSheetData.as_of_date)}`,
      '',
      'ASET (ASSETS)',
      'Kode,Nama Akun,Saldo',
      ...balanceSheetData.assets.accounts.map(acc => 
        `${acc.account_code},${acc.account_name},${acc.balance}`
      ),
      `TOTAL ASET,,${balanceSheetData.assets.total}`,
      '',
      'KEWAJIBAN (LIABILITIES)',
      'Kode,Nama Akun,Saldo',
      ...balanceSheetData.liabilities.accounts.map(acc => 
        `${acc.account_code},${acc.account_name},${acc.balance}`
      ),
      `TOTAL KEWAJIBAN,,${balanceSheetData.liabilities.total}`,
      '',
      'EKUITAS (EQUITY)',
      'Kode,Nama Akun,Saldo',
      ...balanceSheetData.equity.accounts.map(acc => 
        `${acc.account_code},${acc.account_name},${acc.balance}`
      ),
      `TOTAL EKUITAS,,${balanceSheetData.equity.total}`,
      '',
      `TOTAL KEWAJIBAN & EKUITAS,,${balanceSheetData.total_liabilities_and_equity}`,
      '',
      `STATUS,${balanceSheetData.is_balanced ? 'BALANCED' : 'NOT BALANCED'}`,
      `SELISIH,${balanceSheetData.difference}`,
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `neraca-${asOfDate}.csv`;
    a.click();
  };

  const quickDateOptions = [
    { label: 'Hari Ini', value: new Date().toISOString().split('T')[0] },
    { 
      label: 'Akhir Bulan Lalu', 
      value: new Date(new Date().getFullYear(), new Date().getMonth(), 0).toISOString().split('T')[0] 
    },
    { 
      label: 'Akhir Tahun Lalu', 
      value: new Date(new Date().getFullYear() - 1, 11, 31).toISOString().split('T')[0] 
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="bg-gradient-to-br from-sky-50 to-blue-50 rounded-xl shadow-sm border border-sky-200 p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-sky-900 mb-2">
              Neraca (Balance Sheet)
            </h2>
            <p className="text-sky-700">
              Laporan Posisi Keuangan: Aset = Kewajiban + Ekuitas (dihitung otomatis)
            </p>
          </div>
          <button
            onClick={exportToCSV}
            disabled={!balanceSheetData}
            className="flex items-center gap-2 px-4 py-2 bg-white text-sky-700 rounded-lg border border-sky-300 hover:bg-sky-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
            />
            <div className="flex gap-2 mt-2">
              {quickDateOptions.map(option => (
                <button
                  key={option.label}
                  onClick={() => setAsOfDate(option.value)}
                  className="px-3 py-1 text-xs bg-sky-50 text-sky-700 rounded hover:bg-sky-100 transition-all"
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* View Toggle */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tampilan
            </label>
            <button
              onClick={() => setShowDetails(!showDetails)}
              className={`w-full px-4 py-2 rounded-lg border transition-all ${
                showDetails
                  ? 'bg-sky-600 text-white border-sky-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              <ScaleIcon className="inline h-5 w-5 mr-2" />
              {showDetails ? 'Detail per Akun' : 'Ringkasan Total'}
            </button>
          </div>

          {/* Refresh Button */}
          <div className="flex items-end">
            <button
              onClick={fetchBalanceSheet}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-6 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <ArrowPathIcon className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Memuat...' : 'Refresh'}
            </button>
          </div>
        </div>
      </div>

      {/* Balance Status Card */}
      {balanceSheetData && (
        <div className={`rounded-xl shadow-sm border p-6 ${
          balanceSheetData.is_balanced
            ? 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-300'
            : 'bg-gradient-to-br from-rose-50 to-red-50 border-rose-300'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {balanceSheetData.is_balanced ? (
                <CheckCircleIcon className="h-12 w-12 text-emerald-600" />
              ) : (
                <XCircleIcon className="h-12 w-12 text-rose-600" />
              )}
              <div>
                <h3 className={`text-2xl font-bold ${
                  balanceSheetData.is_balanced ? 'text-emerald-900' : 'text-rose-900'
                }`}>
                  {balanceSheetData.is_balanced 
                    ? 'NERACA SEIMBANG ✓' 
                    : 'NERACA TIDAK SEIMBANG ✗'}
                </h3>
                <p className={`text-sm ${
                  balanceSheetData.is_balanced ? 'text-emerald-700' : 'text-rose-700'
                }`}>
                  Assets {balanceSheetData.is_balanced ? '=' : '≠'} Liabilities + Equity
                </p>
              </div>
            </div>
            {!balanceSheetData.is_balanced && (
              <div className="text-right">
                <div className="text-sm text-rose-700 mb-1">Selisih</div>
                <div className="text-2xl font-bold text-rose-900">
                  {formatCurrency(Math.abs(balanceSheetData.difference))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Summary Cards */}
      {balanceSheetData && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-cyan-50 to-teal-50 rounded-lg shadow-sm border border-cyan-200 p-5">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium text-cyan-600">Total Aset</div>
              <div className="text-xs bg-cyan-100 text-cyan-700 px-2 py-1 rounded font-medium">
                {balanceSheetData.assets.accounts.length} akun
              </div>
            </div>
            <div className="text-2xl font-bold text-cyan-700">
              {formatCurrency(balanceSheetData.assets.total)}
            </div>
          </div>
          <div className="bg-gradient-to-br from-rose-50 to-pink-50 rounded-lg shadow-sm border border-rose-200 p-5">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium text-rose-600">Total Kewajiban</div>
              <div className="text-xs bg-rose-100 text-rose-700 px-2 py-1 rounded font-medium">
                {balanceSheetData.liabilities.accounts.length} akun
              </div>
            </div>
            <div className="text-2xl font-bold text-rose-700">
              {formatCurrency(balanceSheetData.liabilities.total)}
            </div>
          </div>
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg shadow-sm border border-indigo-200 p-5">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium text-indigo-600">Total Ekuitas</div>
              <div className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded font-medium">
                {balanceSheetData.equity.accounts.length} akun
              </div>
            </div>
            <div className="text-2xl font-bold text-indigo-700">
              {formatCurrency(balanceSheetData.equity.total)}
            </div>
          </div>
        </div>
      )}

      {/* Balance Sheet Table */}
      {balanceSheetData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* LEFT SIDE - ASSETS */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white">
              <h3 className="text-lg font-bold">ASET (ASSETS)</h3>
              <p className="text-sm text-white/80">Sumber Daya Ekonomi</p>
            </div>
            {showDetails ? (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Kode
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Nama Akun
                      </th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                        Saldo
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {balanceSheetData.assets.accounts.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-4 py-8 text-center text-gray-500">
                          Tidak ada akun aset
                        </td>
                      </tr>
                    ) : (
                      balanceSheetData.assets.accounts.map((account) => (
                        <tr key={account.account_id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                            {account.account_code}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {account.account_name}
                          </td>
                          <td className="px-4 py-3 text-sm text-right font-medium text-emerald-700">
                            {formatCurrency(account.balance)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  <tfoot className="bg-emerald-50 font-bold">
                    <tr>
                      <td colSpan={2} className="px-4 py-3 text-sm text-emerald-900">
                        TOTAL ASET
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-emerald-900">
                        {formatCurrency(balanceSheetData.assets.total)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ) : (
              <div className="p-6">
                <div className="text-center">
                  <div className="text-sm text-gray-600 mb-2">Total Aset</div>
                  <div className="text-4xl font-bold text-emerald-700">
                    {formatCurrency(balanceSheetData.assets.total)}
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    {balanceSheetData.assets.accounts.length} akun
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT SIDE - LIABILITIES & EQUITY */}
          <div className="space-y-6">
            {/* LIABILITIES */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-rose-500 to-red-600 text-white">
                <h3 className="text-lg font-bold">KEWAJIBAN (LIABILITIES)</h3>
                <p className="text-sm text-white/80">Hutang & Kewajiban</p>
              </div>
              {showDetails ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Kode
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Nama Akun
                        </th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                          Saldo
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {balanceSheetData.liabilities.accounts.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="px-4 py-8 text-center text-gray-500">
                            Tidak ada akun kewajiban
                          </td>
                        </tr>
                      ) : (
                        balanceSheetData.liabilities.accounts.map((account) => (
                          <tr key={account.account_id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">
                              {account.account_code}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {account.account_name}
                            </td>
                            <td className="px-4 py-3 text-sm text-right font-medium text-rose-700">
                              {formatCurrency(account.balance)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                    <tfoot className="bg-rose-50 font-bold">
                      <tr>
                        <td colSpan={2} className="px-4 py-3 text-sm text-rose-900">
                          TOTAL KEWAJIBAN
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-rose-900">
                          {formatCurrency(balanceSheetData.liabilities.total)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              ) : (
                <div className="p-4">
                  <div className="text-center">
                    <div className="text-sm text-gray-600 mb-1">Total Kewajiban</div>
                    <div className="text-2xl font-bold text-rose-700">
                      {formatCurrency(balanceSheetData.liabilities.total)}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* EQUITY */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-violet-500 to-purple-600 text-white">
                <h3 className="text-lg font-bold">EKUITAS (EQUITY)</h3>
                <p className="text-sm text-white/80">Modal & Laba Ditahan</p>
              </div>
              {showDetails ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Kode
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Nama Akun
                        </th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                          Saldo
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {balanceSheetData.equity.accounts.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="px-4 py-8 text-center text-gray-500">
                            Tidak ada akun ekuitas
                          </td>
                        </tr>
                      ) : (
                        balanceSheetData.equity.accounts.map((account) => (
                          <tr key={account.account_id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">
                              {account.account_code}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {account.account_name}
                            </td>
                            <td className="px-4 py-3 text-sm text-right font-medium text-violet-700">
                              {formatCurrency(account.balance)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                    <tfoot className="bg-violet-50 font-bold">
                      <tr>
                        <td colSpan={2} className="px-4 py-3 text-sm text-violet-900">
                          TOTAL EKUITAS
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-violet-900">
                          {formatCurrency(balanceSheetData.equity.total)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              ) : (
                <div className="p-4">
                  <div className="text-center">
                    <div className="text-sm text-gray-600 mb-1">Total Ekuitas</div>
                    <div className="text-2xl font-bold text-violet-700">
                      {formatCurrency(balanceSheetData.equity.total)}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* TOTAL LIABILITIES & EQUITY */}
            <div className={`rounded-lg shadow-md p-4 ${
              balanceSheetData.is_balanced
                ? 'bg-gradient-to-br from-sky-500 to-blue-600'
                : 'bg-gradient-to-br from-rose-500 to-red-600'
            }`}>
              <div className="text-center text-white">
                <div className="text-sm text-white/80 mb-2">
                  TOTAL KEWAJIBAN & EKUITAS
                </div>
                <div className="text-3xl font-bold">
                  {formatCurrency(balanceSheetData.total_liabilities_and_equity)}
                </div>
                {balanceSheetData.is_balanced && (
                  <div className="text-xs text-white/80 mt-2">
                    ✓ Seimbang dengan Total Aset
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BalanceSheetTab;

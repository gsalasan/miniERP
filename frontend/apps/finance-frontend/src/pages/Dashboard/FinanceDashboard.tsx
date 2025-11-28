import React, { useState, useEffect } from 'react';
import {
  ChartBarIcon,
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  DocumentTextIcon,
  BanknotesIcon,
} from '@heroicons/react/24/outline';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface CashFlowData {
  period: string;
  inflow: number;
  outflow: number;
  net: number;
}

interface ProfitabilityData {
  period: string;
  revenue: number;
  expenses: number;
  net_income: number;
}

interface ARAPSummary {
  total_receivable: number;
  total_payable: number;
  net_position: number;
  overdue_receivable: number;
  overdue_payable: number;
}

interface QuickStat {
  label: string;
  value: number;
  change_percentage?: number;
  trend?: 'up' | 'down' | 'stable';
}

interface RecentTransaction {
  id: string;
  date: string;
  description: string;
  reference: string;
  amount: number;
  accounts: string;
}

interface DashboardData {
  cash_flow: CashFlowData[];
  profitability: ProfitabilityData[];
  ar_ap_summary: ARAPSummary;
  quick_stats: QuickStat[];
  recent_transactions: RecentTransaction[];
}

const API_BASE = import.meta.env.VITE_FINANCE_API || '/api';

const FinanceDashboard: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'month' | 'quarter' | 'year'>('month');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatCompact = (amount: number) => {
    if (amount >= 1000000000) return `${(amount / 1000000000).toFixed(1)}M`;
    if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}Jt`;
    if (amount >= 1000) return `${(amount / 1000).toFixed(0)}K`;
    return amount.toFixed(0);
  };

  useEffect(() => {
    fetchDashboardData();
  }, [period]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/dashboards/finance?period=${period}`);
      const result = await response.json();
      
      if (result.success) {
        setDashboardData(result.data);
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !dashboardData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#C8A870] mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Memuat Dashboard Keuangan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-primary-dark to-primary-light rounded-2xl shadow-lg p-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold mb-2 text-white">Dashboard Keuangan</h1>
            <p className="text-white/90 text-lg">
              Otak Finansial Perusahaan - Real-time Financial Intelligence
            </p>
            <p className="text-xs text-accent-gold mt-1">TSD FITUR 3.4.G - Analytics Dashboard</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setPeriod('month')}
              className={`px-4 py-2 rounded-lg font-semibold transition-all shadow-md ${
                period === 'month'
                  ? 'bg-white text-purple-600'
                  : 'bg-purple-300 text-gray-700 hover:bg-purple-400'
              }`}
            >
              6 Bulan
            </button>
            <button
              onClick={() => setPeriod('quarter')}
              className={`px-4 py-2 rounded-lg font-semibold transition-all shadow-md ${
                period === 'quarter'
                  ? 'bg-white text-purple-600'
                  : 'bg-purple-300 text-gray-700 hover:bg-purple-400'
              }`}
            >
              4 Kuartal
            </button>
            <button
              onClick={() => setPeriod('year')}
              className={`px-4 py-2 rounded-lg font-semibold transition-all shadow-md ${
                period === 'year'
                  ? 'bg-white text-purple-600'
                  : 'bg-purple-300 text-gray-700 hover:bg-purple-400'
              }`}
            >
              3 Tahun
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Quick Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {dashboardData.quick_stats.map((stat, index) => (
            <div
              key={index}
              className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-300 hover:shadow-xl transition-shadow"
            >
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-600">{stat.label}</p>
                  {stat.trend === 'up' && (
                    <ArrowTrendingUpIcon className="w-5 h-5 text-green-500" />
                  )}
                  {stat.trend === 'down' && (
                    <ArrowTrendingDownIcon className="w-5 h-5 text-red-500" />
                  )}
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(stat.value)}
                </p>
                {stat.change_percentage !== undefined && (
                  <p className="text-xs text-gray-500 mt-1">
                    {stat.change_percentage > 0 ? '+' : ''}
                    {stat.change_percentage.toFixed(1)}% vs bulan lalu
                  </p>
                )}
              </div>
            ))}
        </div>

        {/* AR/AP Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-emerald-100 p-3 rounded-lg">
                <BanknotesIcon className="w-6 h-6 text-emerald-400" />
              </div>
                <div>
                  <p className="text-sm text-gray-600">Total Piutang (AR)</p>
                  <p className="text-2xl font-bold text-emerald-500">
                    {formatCurrency(dashboardData.ar_ap_summary.total_receivable)}
                  </p>
                </div>
              </div>
              <div className="text-xs text-gray-500">
                Overdue: {formatCurrency(dashboardData.ar_ap_summary.overdue_receivable)}
              </div>
            </div>

          <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-rose-100 p-3 rounded-lg">
                <DocumentTextIcon className="w-6 h-6 text-rose-400" />
              </div>
                <div>
                  <p className="text-sm text-gray-600">Total Utang (AP)</p>
                  <p className="text-2xl font-bold text-rose-500">
                    {formatCurrency(dashboardData.ar_ap_summary.total_payable)}
                  </p>
                </div>
              </div>
              <div className="text-xs text-gray-500">
                Overdue: {formatCurrency(dashboardData.ar_ap_summary.overdue_payable)}
              </div>
            </div>

          <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-blue-100 p-3 rounded-lg">
                <ChartBarIcon className="w-6 h-6 text-blue-400" />
              </div>
                <div>
                  <p className="text-sm text-gray-600">Net Position</p>
                  <p
                    className={`text-2xl font-bold ${
                      dashboardData.ar_ap_summary.net_position >= 0
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}
                  >
                    {formatCurrency(dashboardData.ar_ap_summary.net_position)}
                  </p>
                </div>
              </div>
              <div className="text-xs text-gray-500">AR - AP</div>
            </div>
        </div>

        {/* Cash Flow Chart */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <CurrencyDollarIcon className="w-7 h-7 text-purple-400" />
            Arus Kas (Cash Flow)
          </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dashboardData.cash_flow}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis tickFormatter={(value) => formatCompact(value)} />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc' }}
                />
                <Legend />
                <Bar dataKey="inflow" name="Masuk (Inflow)" fill="#10b981" />
                <Bar dataKey="outflow" name="Keluar (Outflow)" fill="#ef4444" />
                <Bar dataKey="net" name="Net Cash Flow" fill="#C8A870" />
              </BarChart>
            </ResponsiveContainer>
        </div>

        {/* Profitability Chart */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <ArrowTrendingUpIcon className="w-7 h-7 text-purple-400" />
            Profitabilitas (Revenue vs Expenses)
          </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dashboardData.profitability}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis tickFormatter={(value) => formatCompact(value)} />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc' }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  name="Pendapatan"
                  stroke="#10b981"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="expenses"
                  name="Beban"
                  stroke="#ef4444"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="net_income"
                  name="Laba Bersih"
                  stroke="#C8A870"
                  strokeWidth={3}
                />
              </LineChart>
            </ResponsiveContainer>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="px-6 py-5 border-b border-purple-100 bg-purple-50/30">
            <h3 className="text-xl font-bold text-gray-800">Transaksi Terbaru</h3>
          </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Tanggal
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Deskripsi
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Akun
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Jumlah
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {dashboardData.recent_transactions.map((txn) => (
                    <tr key={txn.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(txn.date).toLocaleDateString('id-ID')}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div className="font-medium">{txn.description}</div>
                        {txn.reference && (
                          <div className="text-xs text-gray-500">{txn.reference}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {txn.accounts.substring(0, 50)}
                        {txn.accounts.length > 50 && '...'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-gray-900">
                        {formatCurrency(txn.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
        </div>
      </div>
    </div>
  );
};

export default FinanceDashboard;

import React, { useState, useEffect } from 'react';
import {
  ChartBarIcon,
  DocumentTextIcon,
  BookOpenIcon,
  ClipboardDocumentListIcon,
  BanknotesIcon,
  PresentationChartLineIcon,
  PlusIcon,
  ArrowDownTrayIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import {
  ChartBarIcon as ChartBarIconSolid,
} from '@heroicons/react/24/solid';

// Import tabs
import ChartOfAccountsTab from './COA/ChartOfAccountsTab';
import JournalEntriesTab from './COA/JournalEntriesTab';
import GeneralLedgerTab from '../components/COA/GeneralLedgerTab';
import BalanceSheetTab from '../components/COA/BalanceSheetTab';
import IncomeStatementTab from '../components/COA/IncomeStatementTab';
import TrialBalanceTab from '../components/COA/TrialBalanceTab';

type TabType = 'coa' | 'journal' | 'ledger' | 'balance' | 'income' | 'trial' | 'profit';

interface MetricCard {
  label: string;
  value: string | number;
  color: string;
  icon: React.ReactNode;
}

interface AccountSummary {
  total: number; // Total number of accounts
  asset: number; // Total Asset balance (IDR)
  liability: number; // Total Liability balance (IDR)
  equity: number; // Total Equity balance (IDR)
  revenue: number; // Total Revenue balance (IDR)
  expense: number; // Total Expense balance (IDR)
  costOfService: number; // Total Cost of Service balance (IDR)
}

const COA: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('coa');
  const [searchQuery, setSearchQuery] = useState('');
  const [accountSummary, setAccountSummary] = useState<AccountSummary>({
    total: 0,
    asset: 0,
    liability: 0,
    equity: 0,
    revenue: 0,
    expense: 0,
    costOfService: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Fetch account summary from API
  useEffect(() => {
    fetchAccountSummary();
  }, []);

  const fetchAccountSummary = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/chartofaccounts');
      const result = await response.json();

      if (result.success && result.summary) {
        // Use summary from backend (includes balances)
        const backendSummary = result.summary;
        console.log('📊 COA Summary from backend:', backendSummary);
        
        const summary = {
          total: backendSummary.total,
          asset: backendSummary.Asset,
          liability: backendSummary.Liability,
          equity: backendSummary.Equity,
          revenue: backendSummary.Revenue,
          expense: backendSummary.Expense,
          costOfService: backendSummary.CostOfService,
        };
        console.log('📊 Summary set to state:', summary);
        setAccountSummary(summary);
      }
    } catch (error) {
      console.error('Error fetching account summary:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000000) {
      return `Rp ${(amount / 1000000000).toFixed(1)}M`; // Milyar
    } else if (amount >= 1000000) {
      return `Rp ${(amount / 1000000).toFixed(0)}jt`; // Juta
    } else if (amount >= 1000) {
      return `Rp ${(amount / 1000).toFixed(0)}rb`; // Ribu
    }
    return `Rp ${amount.toLocaleString('id-ID')}`;
  };

  const metrics: MetricCard[] = [
    {
      label: 'Total Accounts',
      value: accountSummary.total,
      color: 'bg-primary-dark text-white',
      icon: <DocumentTextIcon className="w-6 h-6 text-accent-gold" />,
    },
    {
      label: 'Asset',
      value: formatCurrency(accountSummary.asset),
      color: 'bg-primary-light/20 text-primary-dark border-2 border-primary-light',
      icon: <ChartBarIconSolid className="w-6 h-6 text-primary-light" />,
    },
    {
      label: 'Liability',
      value: formatCurrency(accountSummary.liability),
      color: 'bg-accent-gold/20 text-primary-dark border-2 border-accent-gold',
      icon: <ChartBarIconSolid className="w-6 h-6 text-accent-gold" />,
    },
    {
      label: 'Equity',
      value: formatCurrency(accountSummary.equity),
      color: 'bg-primary-light/20 text-primary-dark border-2 border-primary-light',
      icon: <ChartBarIconSolid className="w-6 h-6 text-primary-light" />,
    },
    {
      label: 'Revenue',
      value: formatCurrency(accountSummary.revenue),
      color: 'bg-accent-gold/20 text-primary-dark border-2 border-accent-gold',
      icon: <ChartBarIconSolid className="w-6 h-6 text-accent-gold" />,
    },
    {
      label: 'Cost of Service',
      value: formatCurrency(accountSummary.costOfService),
      color: 'bg-primary-light/20 text-primary-dark border-2 border-primary-light',
      icon: <ChartBarIconSolid className="w-6 h-6 text-primary-light" />,
    },
    {
      label: 'Expense',
      value: formatCurrency(accountSummary.expense),
      color: 'bg-primary-dark/10 text-primary-dark border-2 border-primary-dark/30',
      icon: <ChartBarIconSolid className="w-6 h-6 text-primary-dark" />,
    },
  ];

  const tabs = [
    {
      id: 'coa' as TabType,
      label: 'Chart of Accounts',
      icon: ChartBarIcon,
    },
    {
      id: 'journal' as TabType,
      label: 'Journal Entries',
      icon: DocumentTextIcon,
    },
    {
      id: 'ledger' as TabType,
      label: 'Buku Besar',
      icon: BookOpenIcon,
    },
    {
      id: 'balance' as TabType,
      label: 'Neraca Saldo',
      icon: ClipboardDocumentListIcon,
    },
    {
      id: 'income' as TabType,
      label: 'Neraca',
      icon: BanknotesIcon,
    },
    {
      id: 'trial' as TabType,
      label: 'Laba Rugi',
      icon: PresentationChartLineIcon,
    },
  ];

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log('Export data');
  };

  const handleAddNew = () => {
    // TODO: Implement add new account
    console.log('Add new account');
  };

  return (
    <div className="space-y-6">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-primary-dark to-primary-light rounded-2xl shadow-lg p-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold text-white">Chart of Accounts</h1>
              <p className="text-white/90 text-lg mt-1">Kelola daftar akun keuangan dan journal entries perusahaan</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 w-64 rounded-lg border border-gray-300 bg-white focus:ring-2 focus:ring-accent-gold focus:border-transparent shadow-md"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {metrics.map((metric, index) => (
            <div
              key={index}
              className={`${metric.color} rounded-xl shadow-sm p-4 flex flex-col justify-between min-h-[120px]`}
            >
              <div className="flex items-start justify-between">
                <div className={`font-bold ${index === 0 ? 'text-3xl' : 'text-xl'}`}>
                  {isLoading ? '...' : metric.value}
                </div>
                <div>{metric.icon}</div>
              </div>
              <div className="mt-2 text-xs font-semibold">{metric.label}</div>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-300 rounded-lg shadow-md hover:bg-gray-50 font-medium text-gray-700 transition-colors"
          >
            <ArrowDownTrayIcon className="w-5 h-5" />
            Export
          </button>
          <button
            onClick={handleAddNew}
            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-primary-light to-accent-gold text-white rounded-lg shadow-md hover:shadow-lg hover:from-accent-gold hover:to-primary-dark font-semibold transition-all"
          >
            <PlusIcon className="w-5 h-5" />
            Tambah Akun Baru
          </button>
        </div>

        {/* Tabs Navigation */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-2 rounded-full font-medium transition-all shadow-sm whitespace-nowrap text-sm
                  ${isActive
                    ? 'bg-gradient-to-r from-accent-gold to-primary-light text-white shadow-md'
                    : 'bg-white text-gray-600 hover:bg-accent-gold/10 hover:text-primary-dark border border-gray-200'}
                `}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 min-h-[400px]">
          {/* Search and Filter Bar */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
            <div className="relative flex-1 max-w-md">
              <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Cari kode akun, nama akun, atau deskripsi..."
                className="pl-10 pr-4 py-2 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center gap-3">
              <select className="px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700">
                <option value="">Semua Tipe</option>
                <option value="ASSET">Asset</option>
                <option value="LIABILITY">Liability</option>
                <option value="EQUITY">Equity</option>
                <option value="REVENUE">Revenue</option>
                <option value="EXPENSE">Expense</option>
                <option value="COST_OF_SERVICE">Cost of Service</option>
              </select>
              <select className="px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700">
                <option value="10">10 per halaman</option>
                <option value="25">25 per halaman</option>
                <option value="50">50 per halaman</option>
                <option value="100">100 per halaman</option>
              </select>
            </div>
          </div>

          {/* Tab Content Area */}
          {activeTab === 'coa' && <ChartOfAccountsTab />}
          {activeTab === 'journal' && (
            <JournalEntriesTab 
              onSuccess={(message) => console.log('Success:', message)}
              onError={(message) => console.error('Error:', message)}
            />
          )}
          {activeTab === 'ledger' && <GeneralLedgerTab />}
          {activeTab === 'balance' && <BalanceSheetTab />}
          {activeTab === 'income' && <IncomeStatementTab />}
          {activeTab === 'trial' && <TrialBalanceTab />}
        </div>
      </div>
  );
};

export default COA;

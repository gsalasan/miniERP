import React, { useState } from 'react';
import TaxRatesTab from './FinancialCockpit/TaxRatesTab';
import ExchangeRatesTab from './FinancialCockpit/ExchangeRatesTab';
import PricingRulesTab from './FinancialCockpit/PricingRulesTab';
import DiscountPoliciesTab from './FinancialCockpit/DiscountPoliciesTab';
import OverheadAllocationsTab from './FinancialCockpit/OverheadAllocationsTab';
import PaymentTermsTab from './FinancialCockpit/PaymentTermsTab';
import ExpenseClaimPoliciesTab from './FinancialCockpit/ExpenseClaimPoliciesTab';
import { 
  BanknotesIcon, 
  CurrencyDollarIcon,
  ChartBarIcon,
  ReceiptPercentIcon,
  TagIcon,
  BuildingOffice2Icon,
  CalendarDaysIcon,
  ReceiptRefundIcon,
  CheckCircleIcon,
  ArrowTrendingUpIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';
import { 
  BanknotesIcon as BanknotesIconSolid,
  CurrencyDollarIcon as CurrencyDollarIconSolid,
  TagIcon as TagIconSolid,
  ReceiptPercentIcon as ReceiptPercentIconSolid,
  BuildingOffice2Icon as BuildingOffice2IconSolid,
  CalendarDaysIcon as CalendarDaysIconSolid,
  ReceiptRefundIcon as ReceiptRefundIconSolid,
} from '@heroicons/react/24/solid';

type TabType = 'overview' | 'tax-rates' | 'exchange-rates' | 'pricing-rules' | 'discount-policies' | 'overhead-allocations' | 'payment-terms' | 'expense-policies';

const FinancialCockpit: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  const policyCards = [
    {
      id: 'tax-rates' as TabType,
      name: 'Tarif Pajak',
      icon: BanknotesIcon,
      iconSolid: BanknotesIconSolid,
      description: 'Kelola tarif pajak (PPN, PPh, dll)',
      gradient: 'from-blue-500 to-cyan-600',
      bgLight: 'bg-blue-50',
      borderColor: 'border-blue-200',
      count: 5,
      status: 'Aktif',
    },
    {
      id: 'exchange-rates' as TabType,
      name: 'Kurs Mata Uang',
      icon: CurrencyDollarIcon,
      iconSolid: CurrencyDollarIconSolid,
      description: 'Kelola kurs mata uang asing',
      gradient: 'from-green-500 to-emerald-600',
      bgLight: 'bg-green-50',
      borderColor: 'border-green-200',
      count: 8,
      status: 'Update Harian',
    },
    {
      id: 'pricing-rules' as TabType,
      name: 'Aturan Harga',
      icon: TagIcon,
      iconSolid: TagIconSolid,
      description: 'Kelola aturan penetapan harga',
      gradient: 'from-purple-500 to-pink-600',
      bgLight: 'bg-purple-50',
      borderColor: 'border-purple-200',
      count: 12,
      status: 'Aktif',
    },
    {
      id: 'discount-policies' as TabType,
      name: 'Kebijakan Diskon',
      icon: ReceiptPercentIcon,
      iconSolid: ReceiptPercentIconSolid,
      description: 'Kelola kebijakan diskon',
      gradient: 'from-orange-500 to-red-600',
      bgLight: 'bg-orange-50',
      borderColor: 'border-orange-200',
      count: 7,
      status: 'Aktif',
    },
    {
      id: 'overhead-allocations' as TabType,
      name: 'Alokasi Overhead',
      icon: BuildingOffice2Icon,
      iconSolid: BuildingOffice2IconSolid,
      description: 'Kelola alokasi biaya overhead',
      gradient: 'from-indigo-500 to-blue-600',
      bgLight: 'bg-indigo-50',
      borderColor: 'border-indigo-200',
      count: 6,
      status: 'Aktif',
    },
    {
      id: 'payment-terms' as TabType,
      name: 'Termin Pembayaran',
      icon: CalendarDaysIcon,
      iconSolid: CalendarDaysIconSolid,
      description: 'Kelola TOP (Terms of Payment)',
      gradient: 'from-teal-500 to-cyan-600',
      bgLight: 'bg-teal-50',
      borderColor: 'border-teal-200',
      count: 4,
      status: 'Aktif',
    },
    {
      id: 'expense-policies' as TabType,
      name: 'Kebijakan Expense',
      icon: ReceiptRefundIcon,
      iconSolid: ReceiptRefundIconSolid,
      description: 'Kelola kebijakan klaim biaya karyawan',
      gradient: 'from-rose-500 to-pink-600',
      bgLight: 'bg-rose-50',
      borderColor: 'border-rose-200',
      count: 6,
      status: 'Aktif',
    },
  ];

  return (
    <div className="space-y-6">
        {/* Header Banner - REDESIGNED */}
        <div className="bg-gradient-to-br from-primary-dark via-accent-gold to-primary-light rounded-3xl shadow-2xl p-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-accent-gold/40 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-white/5 rounded-full blur-3xl"></div>
          
          <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-sm shadow-xl border border-white/30">
                <Cog6ToothIcon className="w-10 h-10 text-white animate-spin-slow" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white drop-shadow-2xl mb-2">
                  🎛️ Kokpit Kebijakan Finansial
                </h1>
                <p className="text-white/95 text-lg font-medium drop-shadow-lg">
                  Pusat kontrol & manajemen 7 kebijakan finansial perusahaan
                </p>
                <div className="flex items-center gap-2 mt-3">
                  <span className="text-xs bg-white/30 text-white px-3 py-1.5 rounded-full backdrop-blur-sm font-bold border border-white/40 shadow-lg">
                    TSD FITUR 3.4.F
                  </span>
                  <span className="text-xs bg-green-500/80 text-white px-3 py-1.5 rounded-full backdrop-blur-sm font-bold border border-green-300/40 shadow-lg flex items-center gap-1">
                    <CheckCircleIcon className="w-3 h-3" />
                    Policy Management
                  </span>
                </div>
              </div>
            </div>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/20 backdrop-blur-md rounded-xl p-4 border border-white/30 shadow-xl">
                <p className="text-xs text-white/80 font-semibold mb-1">Total Kebijakan</p>
                <p className="text-3xl font-bold text-white">{policyCards.length}</p>
              </div>
              <div className="bg-white/20 backdrop-blur-md rounded-xl p-4 border border-white/30 shadow-xl">
                <p className="text-xs text-white/80 font-semibold mb-1">Status Sistem</p>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse shadow-lg"></div>
                  <p className="text-sm font-bold text-white">Aktif</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Overview or Detailed Tab */}
        {activeTab === 'overview' ? (
          <>
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-primary-dark to-primary-light rounded-2xl shadow-xl p-6 text-white relative overflow-hidden group hover:shadow-2xl transition-all duration-300 hover:scale-105">
                <div className="absolute inset-0 bg-white/10 group-hover:bg-white/20 transition-all"></div>
                <div className="relative flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-white/90 mb-1">Kebijakan Aktif</p>
                    <p className="text-4xl font-bold">{policyCards.length}</p>
                    <p className="text-xs text-white/80 mt-2">Dari 7 total kebijakan</p>
                  </div>
                  <CheckCircleIcon className="w-16 h-16 text-white/30 group-hover:text-white/50 transition-all" />
                </div>
              </div>

              <div className="bg-gradient-to-br from-accent-gold to-primary-light rounded-2xl shadow-xl p-6 text-white relative overflow-hidden group hover:shadow-2xl transition-all duration-300 hover:scale-105">
                <div className="absolute inset-0 bg-white/10 group-hover:bg-white/20 transition-all"></div>
                <div className="relative flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-white/90 mb-1">Total Aturan</p>
                    <p className="text-4xl font-bold">{policyCards.reduce((sum, card) => sum + card.count, 0)}</p>
                    <p className="text-xs text-white/80 mt-2">Policies terkonf igurasi</p>
                  </div>
                  <ArrowTrendingUpIcon className="w-16 h-16 text-white/30 group-hover:text-white/50 transition-all" />
                </div>
              </div>

              <div className="bg-gradient-to-br from-primary-light to-accent-gold rounded-2xl shadow-xl p-6 text-white relative overflow-hidden group hover:shadow-2xl transition-all duration-300 hover:scale-105">
                <div className="absolute inset-0 bg-white/10 group-hover:bg-white/20 transition-all"></div>
                <div className="relative flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-white/90 mb-1">Update Terakhir</p>
                    <p className="text-2xl font-bold">Hari Ini</p>
                    <p className="text-xs text-white/80 mt-2">20 Nov 2025, 14:30</p>
                  </div>
                  <CalendarDaysIcon className="w-16 h-16 text-white/30 group-hover:text-white/50 transition-all" />
                </div>
              </div>
            </div>

            {/* Policy Cards Grid */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-800">📋 Daftar Kebijakan Finansial</h2>
                <p className="text-sm text-gray-600">Klik kartu untuk mengelola kebijakan</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {policyCards.map((card) => {
                  const IconOutline = card.icon;
                  const IconSolid = card.iconSolid;
                  
                  return (
                    <button
                      key={card.id}
                      onClick={() => setActiveTab(card.id)}
                      className={`${card.bgLight} border-2 ${card.borderColor} rounded-2xl p-6 text-left transition-all duration-300 hover:shadow-2xl hover:scale-105 hover:-translate-y-1 group relative overflow-hidden`}
                    >
                      {/* Gradient Overlay on Hover */}
                      <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}></div>
                      
                      <div className="relative">
                        {/* Icon + Badge */}
                        <div className="flex items-start justify-between mb-4">
                          <div className={`p-3 rounded-xl bg-gradient-to-br ${card.gradient} shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                            <IconOutline className="w-8 h-8 text-white group-hover:hidden" />
                            <IconSolid className="w-8 h-8 text-white hidden group-hover:block" />
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r ${card.gradient} text-white shadow-md`}>
                            {card.count} aturan
                          </span>
                        </div>

                        {/* Title */}
                        <h3 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-gray-800 group-hover:to-gray-600">
                          {card.name}
                        </h3>

                        {/* Description */}
                        <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                          {card.description}
                        </p>

                        {/* Status Badge */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${card.gradient} animate-pulse shadow-lg`}></div>
                            <span className="text-xs font-semibold text-gray-700">{card.status}</span>
                          </div>
                          <span className="text-xs text-gray-500 group-hover:text-gray-700 font-medium">
                            Kelola →
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 border-2 border-blue-200 rounded-2xl p-6 shadow-lg">
              <div className="flex items-start gap-4">
                <div className="bg-blue-500 p-3 rounded-xl shadow-lg">
                  <ChartBarIcon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-800 mb-2">💡 Tentang Kokpit Finansial</h3>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    Kokpit Finansial adalah pusat kontrol terpusat untuk mengelola 7 kebijakan finansial utama perusahaan. 
                    Setiap kebijakan memiliki CRUD lengkap untuk memudahkan konfigurasi: 
                    <strong> Tarif Pajak, Kurs Mata Uang, Aturan Harga, Kebijakan Diskon, Alokasi Overhead, Termin Pembayaran, dan Kebijakan Expense</strong>. 
                    Semua perubahan akan langsung diterapkan ke sistem ERP.
                  </p>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Back Button */}
            <button
              onClick={() => setActiveTab('overview')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-colors"
            >
              ← Kembali ke Overview
            </button>

            {/* Tab Content */}
            <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-200 p-8 min-h-[500px]">
              {activeTab === 'tax-rates' && <TaxRatesTab />}
              {activeTab === 'exchange-rates' && <ExchangeRatesTab />}
              {activeTab === 'pricing-rules' && <PricingRulesTab />}
              {activeTab === 'discount-policies' && <DiscountPoliciesTab />}
              {activeTab === 'overhead-allocations' && <OverheadAllocationsTab />}
              {activeTab === 'payment-terms' && <PaymentTermsTab />}
              {activeTab === 'expense-policies' && <ExpenseClaimPoliciesTab />}
            </div>
          </>
        )}
      </div>
  );
};

export default FinancialCockpit;

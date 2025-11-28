import React, { useState } from 'react';
import { Layout } from '../components';
import { 
  TagIcon,
  ChartBarIcon,
  ReceiptPercentIcon,
  BanknotesIcon,
  CurrencyDollarIcon,
  ClipboardDocumentListIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

// Import Tab Components
import PricingRulesTab from './PolicyCockpit/PricingRulesTab';
import OverheadAllocationsTab from './PolicyCockpit/OverheadAllocationsTab';
import DiscountPoliciesTab from './PolicyCockpit/DiscountPoliciesTab';
import TaxRatesTab from './FinancialCockpit/TaxRatesTab';
import ExchangeRatesTab from './FinancialCockpit/ExchangeRatesTab';

type TabType = 'pricing' | 'overhead' | 'discount' | 'tax' | 'exchange' | 'payment-terms' | 'expense-claims';

const PolicyCockpit: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('pricing');

  const tabs = [
    {
      id: 'overhead' as TabType,
      name: 'Overhead Cost Allocations',
      icon: ChartBarIcon,
      description: 'Overhead cost allocation to COGS',
      color: 'indigo',
    },
    {
      id: 'tax' as TabType,
      name: 'Tax Rates',
      icon: BanknotesIcon,
      description: 'Manage tax rates (VAT, Income Tax)',
      color: 'emerald',
    },
    {
      id: 'exchange' as TabType,
      name: 'Exchange Rates',
      icon: CurrencyDollarIcon,
      description: 'Foreign currency to IDR exchange rates',
      color: 'blue',
    },
    {
      id: 'payment-terms' as TabType,
      name: 'Payment Terms (TOP)',
      icon: ClipboardDocumentListIcon,
      description: 'Terms of Payment for customers',
      color: 'amber',
      disabled: true,
    },
    {
      id: 'expense-claims' as TabType,
      name: 'Expense Claim Policies',
      icon: DocumentTextIcon,
      description: 'Maximum claim limits per category',
      color: 'cyan',
      disabled: true,
    },
    {
      id: 'pricing' as TabType,
      name: 'Pricing Rules',
      icon: TagIcon,
      description: 'Markup percentage per product category',
      color: 'purple',
    },
    {
      id: 'discount' as TabType,
      name: 'Discount Policies',
      icon: ReceiptPercentIcon,
      description: 'Discount policies per user role',
      color: 'rose',
    },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overhead':
        return <OverheadAllocationsTab />;
      case 'tax':
        return <TaxRatesTab />;
      case 'exchange':
        return <ExchangeRatesTab />;
      case 'payment-terms':
        return <ComingSoonContent title="Payment Terms (TOP) Policies" />;
      case 'expense-claims':
        return <ComingSoonContent title="Expense Claim Policies" />;
      case 'pricing':
        return <PricingRulesTab />;
      case 'discount':
        return <DiscountPoliciesTab />;
      default:
        return <OverheadAllocationsTab />;
    }
  };

  const getColorClasses = (color: string, isActive: boolean) => {
    const colors: Record<string, { active: string; inactive: string; hover: string }> = {
      purple: {
        active: 'bg-violet-100 border-violet-500 text-violet-900',
        inactive: 'border-stone-200 text-stone-600 hover:bg-violet-50',
        hover: 'hover:border-violet-300',
      },
      indigo: {
        active: 'bg-blue-100 border-blue-600 text-blue-900',
        inactive: 'border-stone-200 text-stone-600 hover:bg-blue-50',
        hover: 'hover:border-blue-300',
      },
      rose: {
        active: 'bg-rose-100 border-rose-500 text-rose-900',
        inactive: 'border-stone-200 text-stone-600 hover:bg-rose-50',
        hover: 'hover:border-rose-300',
      },
      emerald: {
        active: 'bg-emerald-100 border-emerald-600 text-emerald-900',
        inactive: 'border-stone-200 text-stone-600 hover:bg-emerald-50',
        hover: 'hover:border-emerald-300',
      },
      blue: {
        active: 'bg-sky-100 border-sky-500 text-sky-900',
        inactive: 'border-stone-200 text-stone-600 hover:bg-sky-50',
        hover: 'hover:border-sky-300',
      },
      amber: {
        active: 'bg-amber-100 border-amber-600 text-amber-900',
        inactive: 'border-stone-200 text-stone-600 hover:bg-amber-50',
        hover: 'hover:border-amber-400',
      },
      cyan: {
        active: 'bg-cyan-100 border-cyan-600 text-cyan-900',
        inactive: 'border-stone-200 text-stone-600 hover:bg-cyan-50',
        hover: 'hover:border-cyan-400',
      },
    };

    const colorClass = colors[color] || colors.purple;
    return isActive ? colorClass.active : `${colorClass.inactive} ${colorClass.hover}`;
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg shadow-sm p-8 border border-amber-200">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-amber-100 rounded-lg">
              <ChartBarIcon className="h-8 w-8 text-amber-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Financial Policy Cockpit</h1>
              <p className="text-gray-600 mt-1">
                Centralized control panel to manage financial policies: Overhead, Tax Rates, Exchange Rates, Payment Terms, and Expense Claims
              </p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const isDisabled = tab.disabled;

            return (
              <button
                key={tab.id}
                onClick={() => !isDisabled && setActiveTab(tab.id)}
                disabled={isDisabled}
                className={`
                  relative p-4 rounded-lg border-2 transition-all duration-200
                  ${getColorClasses(tab.color, isActive)}
                  ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  ${!isActive && !isDisabled ? 'hover:shadow-md' : ''}
                  ${isActive ? 'shadow-lg ring-2 ring-offset-2 ring-' + tab.color + '-500' : ''}
                `}
              >
                <div className="flex items-start space-x-3">
                  <Icon className={`h-6 w-6 flex-shrink-0 ${isActive ? '' : 'text-gray-400'}`} />
                  <div className="flex-1 text-left">
                    <p className={`font-semibold text-sm ${isActive ? '' : 'text-gray-700'}`}>
                      {tab.name}
                    </p>
                    <p className={`text-xs mt-1 ${isActive ? 'opacity-90' : 'text-gray-500'}`}>
                      {tab.description}
                    </p>
                  </div>
                </div>
                {isActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-current to-transparent opacity-50" />
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {renderTabContent()}
        </div>
      </div>
    </Layout>
  );
};

// Coming Soon Component
const ComingSoonContent: React.FC<{ title: string }> = ({ title }) => (
  <div className="p-12 text-center">
    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
      <ClipboardDocumentListIcon className="h-8 w-8 text-gray-400" />
    </div>
    <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
    <p className="text-gray-500 max-w-md mx-auto">
      Fitur ini akan segera hadir. Saat ini dalam tahap pengembangan.
    </p>
    <div className="mt-6 inline-flex items-center px-4 py-2 bg-gray-50 rounded-full">
      <span className="text-sm text-gray-600">Status: Coming Soon 🚀</span>
    </div>
  </div>
);

export default PolicyCockpit;

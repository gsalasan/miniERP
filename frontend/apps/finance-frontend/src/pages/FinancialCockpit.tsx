import React, { useState } from 'react';
import { Layout } from '../components';
import TaxRatesTab from './FinancialCockpit/TaxRatesTab';
import ExchangeRatesTab from './FinancialCockpit/ExchangeRatesTab';
import { 
  BanknotesIcon, 
  CurrencyDollarIcon,
  ChartBarIcon 
} from '@heroicons/react/24/outline';

type TabType = 'tax-rates' | 'exchange-rates';

const FinancialCockpit: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('tax-rates');

  const tabs = [
    {
      id: 'tax-rates' as TabType,
      name: 'Tarif Pajak',
      icon: BanknotesIcon,
      description: 'Kelola tarif pajak (PPN, PPh, dll)',
    },
    {
      id: 'exchange-rates' as TabType,
      name: 'Kurs Mata Uang',
      icon: CurrencyDollarIcon,
      description: 'Kelola kurs mata uang asing',
    },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <ChartBarIcon className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Kokpit Finansial
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Kelola kebijakan finansial: Tarif Pajak dan Kurs Mata Uang
              </p>
            </div>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px" aria-label="Tabs">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      flex-1 group relative min-w-0 overflow-hidden py-4 px-6 text-center
                      font-medium text-sm hover:bg-gray-50 focus:z-10 transition-colors
                      ${isActive
                        ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                        : 'text-gray-500 hover:text-gray-700 border-b-2 border-transparent'
                      }
                    `}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                      <span className="font-semibold">{tab.name}</span>
                    </div>
                    <p className={`text-xs mt-1 ${isActive ? 'text-blue-500' : 'text-gray-400'}`}>
                      {tab.description}
                    </p>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'tax-rates' && <TaxRatesTab />}
            {activeTab === 'exchange-rates' && <ExchangeRatesTab />}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default FinancialCockpit;

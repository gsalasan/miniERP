import React from 'react';
import { Layout } from '../components';
import {
  BanknotesIcon,
  DocumentTextIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
} from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const stats = [
    {
      name: 'Chart of Accounts',
      value: '142',
      description: 'Total Accounts',
      icon: DocumentTextIcon,
      color: 'from-blue-500 to-blue-600',
      textColor: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      name: 'Kokpit Finansial',
      value: 'Rp 1.2M',
      description: 'Total Balance',
      icon: ChartBarIcon,
      color: 'from-green-500 to-green-600',
      textColor: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      name: 'Journal Entries',
      value: '6',
      description: 'Recent Entries',
      icon: BanknotesIcon,
      color: 'from-purple-500 to-purple-600',
      textColor: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      name: 'Reports',
      value: '24',
      description: 'Available Reports',
      icon: ArrowTrendingUpIcon,
      color: 'from-orange-500 to-orange-600',
      textColor: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
  ];

  const quickLinks = [
    {
      title: 'Chart of Accounts',
      description: 'Manage your financial accounts and ledger',
      path: '/coa',
      icon: DocumentTextIcon,
      gradient: 'from-blue-500 to-blue-600',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
    },
    {
      title: 'Kokpit Finansial',
      description: 'View financial dashboard and analytics',
      path: '/financial-cockpit',
      icon: ChartBarIcon,
      gradient: 'from-green-500 to-green-600',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
    },
  ];

  return (
    <Layout title="Dashboard">
      {/* Welcome Section */}
      <div className="mb-8">
        <div className="bg-gradient-to-r from-primary-dark via-primary to-accent-gold rounded-2xl shadow-xl p-8 text-white relative overflow-hidden">
          <div className="relative z-10">
            <h1 className="text-4xl font-bold mb-2">Welcome to Finance Module! 👋</h1>
            <p className="text-primary-light text-lg">Manage your financial data efficiently and effectively.</p>
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-32 -mt-32"></div>
          <div className="absolute bottom-0 right-0 w-48 h-48 bg-white opacity-5 rounded-full -mr-24 -mb-24"></div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-14 h-14 ${stat.bgColor} rounded-xl flex items-center justify-center`}>
                <stat.icon className={`h-7 w-7 ${stat.textColor}`} />
              </div>
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</h3>
            <p className="text-sm font-medium text-gray-600">{stat.description}</p>
            <p className="text-xs text-gray-400 mt-1">{stat.name}</p>
          </div>
        ))}
      </div>

      {/* Quick Links */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
          <span className="w-1 h-8 bg-accent-gold rounded-full mr-3"></span>
          Quick Access
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {quickLinks.map((link, index) => (
            <Link
              key={index}
              to={link.path}
              className="group bg-white rounded-xl shadow-sm border border-gray-100 p-8 hover:shadow-xl hover:border-accent-gold transition-all duration-300 hover:-translate-y-1"
            >
              <div className="flex items-start space-x-4">
                <div className={`w-16 h-16 ${link.iconBg} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                  <link.icon className={`h-8 w-8 ${link.iconColor}`} />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-accent-gold transition-colors">
                    {link.title}
                  </h3>
                  <p className="text-sm text-gray-600">{link.description}</p>
                </div>
                <svg 
                  className="w-6 h-6 text-gray-400 group-hover:text-accent-gold group-hover:translate-x-1 transition-all" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
          <span className="w-1 h-6 bg-accent-gold rounded-full mr-3"></span>
          Recent Activity
        </h2>
        <div className="space-y-3">
          {[
            { action: 'Chart of Accounts updated', time: '2 hours ago', icon: DocumentTextIcon, color: 'blue' },
            { action: 'New journal entry created', time: '5 hours ago', icon: BanknotesIcon, color: 'green' },
            { action: 'Financial report generated', time: '1 day ago', icon: ChartBarIcon, color: 'purple' },
          ].map((item, index) => (
            <div key={index} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
              <div className={`w-12 h-12 bg-${item.color}-100 rounded-xl flex items-center justify-center flex-shrink-0`}>
                <item.icon className={`h-6 w-6 text-${item.color}-600`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{item.action}</p>
                <p className="text-xs text-gray-500">{item.time}</p>
              </div>
              <div className="w-2 h-2 bg-accent-gold rounded-full"></div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;

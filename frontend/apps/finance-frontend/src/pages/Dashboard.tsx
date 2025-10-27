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
      name: 'Total Accounts',
      value: '142',
      change: '+12%',
      icon: DocumentTextIcon,
      color: 'from-blue-500 to-blue-600',
    },
    {
      name: 'Total Assets',
      value: 'Rp 1.2M',
      change: '+8%',
      icon: BanknotesIcon,
      color: 'from-green-500 to-green-600',
    },
    {
      name: 'Revenue',
      value: 'Rp 850K',
      change: '+15%',
      icon: ArrowTrendingUpIcon,
      color: 'from-purple-500 to-purple-600',
    },
    {
      name: 'Reports',
      value: '24',
      change: '+4%',
      icon: ChartBarIcon,
      color: 'from-orange-500 to-orange-600',
    },
  ];

  const quickLinks = [
    {
      title: 'Chart of Accounts',
      description: 'Manage your financial accounts',
      path: '/coa',
      icon: DocumentTextIcon,
      color: 'blue',
    },
    {
      title: 'Journal Entry',
      description: 'Record financial transactions',
      path: '/journal',
      icon: DocumentTextIcon,
      color: 'green',
    },
    {
      title: 'Financial Reports',
      description: 'View and generate reports',
      path: '/reports',
      icon: ChartBarIcon,
      color: 'purple',
    },
  ];

  return (
    <Layout title="Dashboard">
      {/* Welcome Section */}
      <div className="mb-8">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg p-8 text-white">
          <h1 className="text-3xl font-bold mb-2">Welcome back, Admin! 👋</h1>
          <p className="text-blue-100">Here's what's happening with your finance today.</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-lg flex items-center justify-center shadow-lg`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
              <span className="text-sm font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                {stat.change}
              </span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</h3>
            <p className="text-sm text-gray-600">{stat.name}</p>
          </div>
        ))}
      </div>

      {/* Quick Links */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Access</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {quickLinks.map((link, index) => (
            <Link
              key={index}
              to={link.path}
              className="group bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg hover:border-blue-300 transition-all"
            >
              <div className={`w-12 h-12 bg-${link.color}-100 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <link.icon className={`h-6 w-6 text-${link.color}-600`} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{link.title}</h3>
              <p className="text-sm text-gray-600">{link.description}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h2>
        <div className="space-y-4">
          {[1, 2, 3].map((item) => (
            <div key={item} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <DocumentTextIcon className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">New account created</p>
                <p className="text-xs text-gray-500">2 hours ago</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;

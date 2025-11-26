import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { Users, UserCheck, ShieldCheck } from 'lucide-react';
import { fetchAllUsers } from '../api/userApi';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    admins: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      setLoading(false);
      return;
    }
    
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const users = await fetchAllUsers();
      
      setStats({
        totalUsers: users.length,
        activeUsers: users.filter((u: any) => u.is_active !== false).length,
        admins: users.filter((u: any) => u.roles?.some((r: any) => r.includes('ADMIN'))).length,
      });
    } catch (err) {
      console.error('Failed to load stats:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-[#F4F4F4] flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mb-4"></div>
            <p className="text-blue-600 font-semibold">Loading Dashboard...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-[#F4F4F4] px-12 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-[#06103A] mb-2">
              Identity Dashboard
            </h1>
            <p className="text-[#6B6E70] text-base">
              User Management System
            </p>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {/* Total Users */}
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-[#E5E7EB] hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
              <div className="flex items-center gap-5">
                <div className="w-20 h-20 rounded-xl bg-[#E8F4FC] flex items-center justify-center">
                  <Users size={36} className="text-[#4E88BE]" />
                </div>
                <div>
                  <p className="text-[#6B6E70] text-sm font-medium mb-1">Total Users</p>
                  <h3 className="text-4xl font-bold text-[#06103A]">{stats.totalUsers}</h3>
                </div>
              </div>
            </div>

            {/* Active Users */}
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-[#E5E7EB] hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
              <div className="flex items-center gap-5">
                <div className="w-20 h-20 rounded-xl bg-[#D1FAE5] flex items-center justify-center">
                  <UserCheck size={36} className="text-[#10B981]" />
                </div>
                <div>
                  <p className="text-[#6B6E70] text-sm font-medium mb-1">Active Users</p>
                  <h3 className="text-4xl font-bold text-[#06103A]">{stats.activeUsers}</h3>
                </div>
              </div>
            </div>

            {/* Admins */}
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-[#E5E7EB] hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
              <div className="flex items-center gap-5">
                <div className="w-20 h-20 rounded-xl bg-[#FEF3C7] flex items-center justify-center">
                  <ShieldCheck size={36} className="text-[#F59E0B]" />
                </div>
                <div>
                  <p className="text-[#6B6E70] text-sm font-medium mb-1">System Admins</p>
                  <h3 className="text-4xl font-bold text-[#06103A]">{stats.admins}</h3>
                </div>
              </div>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-blue-900 mb-2">User Account Management</h3>
                <p className="text-blue-800 text-sm leading-relaxed">
                  User accounts are automatically created when adding new employees through the HR module. 
                  Use the <strong>User Management</strong> page to view, edit roles, or manage existing user permissions.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

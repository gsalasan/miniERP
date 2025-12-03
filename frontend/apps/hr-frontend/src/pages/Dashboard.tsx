import React, { useEffect, useState } from 'react';
 
import Layout from '../components/Layout';
import { Users, Clock, Calendar, TrendingUp } from 'lucide-react';
import DashboardMenu from '../components/DashboardMenu';
// Dummy data for attendance records (for demo)

interface HRStats {
  totalEmployees: number;
  presentToday: number;
  leaveRequests: number;
  overtimeRequests: number;
  activeEmployees: number;
  pendingPayroll: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<HRStats>({
    totalEmployees: 0,
    presentToday: 0,
    leaveRequests: 0,
    overtimeRequests: 0,
    activeEmployees: 0,
    pendingPayroll: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch HR statistics from backend
    fetch('http://localhost:4004/api/v1/hr/stats')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setStats(data.data);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch stats:', err);
        setLoading(false);
      });

    // Also fetch employee count as fallback
    fetch('http://localhost:4004/api/v1/employees')
      .then(res => res.json())
      .then(data => {
        if (data.data) {
          setStats(prev => ({
            ...prev,
            totalEmployees: data.data.length,
            activeEmployees: data.data.filter((e: any) => e.status === 'ACTIVE').length,
          }));
        }
      })
      .catch(err => console.error('Failed to fetch employees:', err));
  }, []);


  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-[#F4F4F4] flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mb-4"></div>
            <p className="text-blue-600 font-semibold">Loading HR Dashboard...</p>
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
              Management Dashboard
            </h1>
            <p className="text-[#6B6E70] text-base">
              Unais Creaasindo Multiverse
            </p>
          </div>


          {/* Statistics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Total Employees */}
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-[#E5E7EB] hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
              <div className="flex items-center gap-5">
                <div className="w-20 h-20 rounded-xl bg-[#E8F4FC] flex items-center justify-center">
                  <Users size={36} className="text-[#4E88BE]" />
                </div>
                <div>
                  <p className="text-[#6B6E70] text-sm font-medium mb-1">Total Employees</p>
                  <h3 className="text-4xl font-bold text-[#06103A]">{stats.totalEmployees}</h3>
                </div>
              </div>
            </div>

            {/* Present Today */}
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-[#E5E7EB] hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
              <div className="flex items-center gap-5">
                <div className="w-20 h-20 rounded-xl bg-[#D1FAE5] flex items-center justify-center">
                  <Clock size={36} className="text-[#10B981]" />
                </div>
                <div>
                  <p className="text-[#6B6E70] text-sm font-medium mb-1">Present Today</p>
                  <h3 className="text-4xl font-bold text-[#06103A]">{stats.presentToday}</h3>
                </div>
              </div>
            </div>

            {/* Leave Requests */}
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-[#E5E7EB] hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
              <div className="flex items-center gap-5">
                <div className="w-20 h-20 rounded-xl bg-[#FEF3C7] flex items-center justify-center">
                  <Calendar size={36} className="text-[#F59E0B]" />
                </div>
                <div>
                  <p className="text-[#6B6E70] text-sm font-medium mb-1">Leave Requests</p>
                  <h3 className="text-4xl font-bold text-[#06103A]">{stats.leaveRequests}</h3>
                </div>
              </div>
            </div>

            {/* Overtime Requests */}
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-[#E5E7EB] hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
              <div className="flex items-center gap-5">
                <div className="w-20 h-20 rounded-xl bg-[#EDE9FE] flex items-center justify-center">
                  <TrendingUp size={36} className="text-[#8B5CF6]" />
                </div>
                <div>
                  <p className="text-[#6B6E70] text-sm font-medium mb-1">Overtime Requests</p>
                  <h3 className="text-4xl font-bold text-[#06103A]">{stats.overtimeRequests}</h3>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}



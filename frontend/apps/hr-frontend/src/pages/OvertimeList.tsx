import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { MoreVertical, Clock, Calendar, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import hrClient from '../api/client';
import API_CONFIG from '../config';

interface OvertimeRequest {
  id: string;
  employee_id: string;
  employee_name?: string;
  overtime_code: string;
  overtime_date: string;
  start_time: string;
  end_time: string;
  duration_hours: number;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  created_at: string;
}

export default function OvertimeList() {
  const [overtimes, setOvertimes] = useState<OvertimeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');

  useEffect(() => {
    fetchOvertimes();
  }, []);

  const fetchOvertimes = async () => {
    setLoading(true);
    try {
      const response = await hrClient.get<{ success?: boolean; data?: OvertimeRequest[] }>('/overtimes/my');
      const list = response.data?.data ?? [];
      setOvertimes(list);
    } catch (error) {
      console.error('Failed to fetch overtimes:', error);
      setOvertimes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleMenuClick = (id: string, event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setOpenMenuId(openMenuId === id ? null : id);
  };

  const handleAction = async (id: string, action: 'view' | 'edit' | 'delete') => {
    setOpenMenuId(null);
    
    if (action === 'delete') {
      if (confirm('Are you sure you want to delete this overtime request?')) {
        try {
          await hrClient.delete(`/overtimes/${id}`);
          fetchOvertimes();
        } catch (error) {
          console.error('Failed to delete overtime:', error);
          const message = error instanceof Error ? error.message : API_CONFIG.OFFLINE_FALLBACK_MESSAGE;
          alert(message);
        }
      }
    } else if (action === 'view') {
      // Navigate to detail page (implement later)
      console.log('View overtime:', id);
    } else if (action === 'edit') {
      // Navigate to edit page (implement later)
      console.log('Edit overtime:', id);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      APPROVED: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800',
    };
    return styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <CheckCircle size={16} className="text-green-600" />;
      case 'REJECTED':
        return <XCircle size={16} className="text-red-600" />;
      default:
        return <AlertCircle size={16} className="text-yellow-600" />;
    }
  };

  const filteredOvertimes = filter === 'ALL' 
    ? overtimes 
    : overtimes.filter(ot => ot.status === filter);

  const formatDuration = (hours: number) => {
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''}${remainingHours > 0 ? ` ${remainingHours}h` : ''}`;
    }
    return `${hours} hour${hours !== 1 ? 's' : ''}`;
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mb-4"></div>
            <p className="text-blue-600 font-semibold">Loading overtime requests...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Overtime Requests</h1>
            <p className="text-gray-600">Manage your overtime requests</p>
          </div>

          {/* Filter Tabs */}
          <div className="bg-white rounded-lg shadow-sm mb-6 p-1 flex gap-1">
            {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
                  filter === status
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          {/* Overtime List */}
          <div className="space-y-3">
            {filteredOvertimes.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                <Clock size={48} className="mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500">No overtime requests found</p>
              </div>
            ) : (
              filteredOvertimes.map((overtime) => (
                <div
                  key={overtime.id}
                  className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow relative"
                >
                  {/* Header with Status */}
                  <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(overtime.status)}
                      <span className="font-semibold text-gray-900 uppercase text-sm">
                        {overtime.status}
                      </span>
                    </div>
                    
                    {/* Menu Button - HANYA INI YANG BISA DIKLIK */}
                    <div className="relative">
                      <button
                        onClick={(e) => handleMenuClick(overtime.id, e)}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                      >
                        <MoreVertical size={20} className="text-gray-600" />
                      </button>

                      {/* Dropdown Menu */}
                      {openMenuId === overtime.id && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setOpenMenuId(null)}
                          />
                          <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                            <button
                              onClick={() => handleAction(overtime.id, 'view')}
                              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                            >
                              View Details
                            </button>
                            {overtime.status === 'PENDING' && (
                              <>
                                <button
                                  onClick={() => handleAction(overtime.id, 'edit')}
                                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                                >
                                  Edit Request
                                </button>
                                <button
                                  onClick={() => handleAction(overtime.id, 'delete')}
                                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors"
                                >
                                  Delete Request
                                </button>
                              </>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Content - TIDAK BISA DIKLIK */}
                  <div className="px-4 py-4">
                    {/* Overtime Code */}
                    <div className="mb-3">
                      <div className="inline-block bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold">
                        {overtime.overtime_code}
                      </div>
                    </div>

                    {/* Duration - Yang Anda lihat sebagai "6 days", "4 days" */}
                    <div className="mb-3">
                      <div className="inline-block bg-green-100 text-green-800 px-4 py-2 rounded-lg font-medium">
                        {formatDuration(overtime.duration_hours)}
                      </div>
                    </div>

                    {/* Info Grid */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar size={16} />
                        <span>{new Date(overtime.overtime_date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Clock size={16} />
                        <span>{overtime.start_time} - {overtime.end_time}</span>
                      </div>
                    </div>

                    {/* Reason */}
                    {overtime.reason && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Reason:</span> {overtime.reason}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

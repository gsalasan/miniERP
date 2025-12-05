import React, { useEffect, useState } from 'react';
import { Eye, Calendar, Search, Download, MapPin, Clock, User } from 'lucide-react';
import Layout from '../components/Layout';

interface Employee {
  id: string;
  employee_id: string;
  full_name: string;
  position: string;
  department: string;
}

interface AttendanceRecord {
  id: string;
  employee_id: string;
  date: string;
  check_in_time: string | null;
  check_in_latitude: number | null;
  check_in_longitude: number | null;
  check_in_location: string | null;
  check_out_time: string | null;
  check_out_latitude: number | null;
  check_out_longitude: number | null;
  check_out_location: string | null;
  work_duration_minutes: number | null;
  total_hours: number | null;
  overtime_minutes: number | null;
  status: string;
  leave_type: string | null;
  employee?: Employee;
}

interface LeaveRequest {
  id: string;
  employee_id: string;
  leave_type: 'ANNUAL' | 'SICK' | 'MATERNITY' | 'PATERNITY' | 'EMERGENCY' | 'UNPAID';
  start_date: string;
  end_date: string;
  total_days: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  employee: {
    id: string;
    full_name: string;
    position: string;
    department: string;
  };
}

export default function AttendanceManagement() {
  const [attendances, setAttendances] = useState<AttendanceRecord[]>([]);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [filteredAttendances, setFilteredAttendances] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'summary' | 'detail'>('summary');
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
  const [showOvertimeModal, setShowOvertimeModal] = useState(false);
  const [showPresentMenu, setShowPresentMenu] = useState(false);
  
  // Detail modal
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedAttendance, setSelectedAttendance] = useState<AttendanceRecord | null>(null);
  
  // Helper to get Monday of current week
  const getMonday = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is Sunday
    return new Date(d.setDate(diff));
  };

  // Helper to get Sunday of current week
  const getSunday = (date: Date) => {
    const monday = getMonday(date);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return sunday;
  };

  // Format date to YYYY-MM-DD for input[type=date]
  const formatDateInput = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  // Fetch attendances
  useEffect(() => {
    fetchAttendances();
  }, []);

  const fetchAttendances = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      
      // Fetch both attendances and leaves in parallel
      const [attendanceRes, leaveRes] = await Promise.all([
        fetch('http://localhost:4004/api/v1/attendances', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }),
        fetch('http://localhost:4004/api/v1/leaves', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
      ]);
      
      if (!attendanceRes.ok) throw new Error('Failed to fetch attendances');
      
      const attendanceData = await attendanceRes.json();
      if (attendanceData.success) {
        setAttendances(attendanceData.data || []);
        setFilteredAttendances(attendanceData.data || []);
      } else {
        setError(attendanceData.error || 'Failed to load data');
      }
      
      // Fetch and set approved leaves
      if (leaveRes.ok) {
        const leaveData = await leaveRes.json();
        const approvedLeaves = leaveData.data?.filter((leave: LeaveRequest) => leave.status === 'APPROVED') || [];
        setLeaves(approvedLeaves);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch attendances');
    } finally {
      setLoading(false);
    }
  };

  // Apply filters
  useEffect(() => {
    let filtered = [...attendances];

    // Date range filter
    if (startDate && endDate) {
      filtered = filtered.filter(a => {
        const recordDate = a.date.split('T')[0];
        return recordDate >= startDate && recordDate <= endDate;
      });
    } else if (startDate) {
      filtered = filtered.filter(a => {
        const recordDate = a.date.split('T')[0];
        return recordDate >= startDate;
      });
    } else if (endDate) {
      filtered = filtered.filter(a => {
        const recordDate = a.date.split('T')[0];
        return recordDate <= endDate;
      });
    }

    // Search filter (employee name only)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(a => 
        a.employee?.full_name?.toLowerCase().includes(query)
      );
    }

    setFilteredAttendances(filtered);
  }, [attendances, startDate, endDate, searchQuery]);

  const formatTime = (datetime: string | null) => {
    if (!datetime) return '-';
    const date = new Date(datetime);
    return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID', { 
      weekday: 'short',
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return '-';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; class: string }> = {
      'PRESENT': { label: 'Present', class: 'bg-green-100 text-green-800' },
      'LATE': { label: 'Late', class: 'bg-yellow-100 text-yellow-800' },
      'ABSENT': { label: 'Absent', class: 'bg-red-100 text-red-800' },
      'HALF_DAY': { label: 'Half Day', class: 'bg-blue-100 text-blue-800' },
    };
    const statusInfo = statusMap[status] || { label: status, class: 'bg-gray-100 text-gray-800' };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.class}`}>
        {statusInfo.label}
      </span>
    );
  };

  const handleViewDetail = (attendance: AttendanceRecord) => {
    setSelectedAttendance(attendance);
    setShowDetailModal(true);
  };

  const resetFilters = () => {
    setStartDate('');
    setEndDate('');
    setSearchQuery('');
  };

  // Calculate attendance summary
  const getAttendanceSummary = () => {
    const summary: Record<string, { 
      employeeId: string;
      present: number; 
      overtime: number;
      izin: number; 
      cuti: number;
      sakit: number;
      alfa: number;
    }> = {};
    
    // Helper to check if date is in leave period
    const isOnLeave = (employeeId: string, date: string, leaveType: string) => {
      return leaves.some(leave => {
        if (leave.employee_id !== employeeId) return false;
        
        const leaveStart = new Date(leave.start_date).toISOString().split('T')[0];
        const leaveEnd = new Date(leave.end_date).toISOString().split('T')[0];
        const checkDate = new Date(date).toISOString().split('T')[0];
        
        // Map database leave types to display categories
        const typeMap: Record<string, string> = {
          'SICK': 'sakit',
          'ANNUAL': 'cuti',
          'MATERNITY': 'cuti',
          'PATERNITY': 'cuti',
          'EMERGENCY': 'izin',
          'UNPAID': 'izin'
        };
        
        return checkDate >= leaveStart && checkDate <= leaveEnd && typeMap[leave.leave_type] === leaveType;
      });
    };
    
    // First, process all attendances
    filteredAttendances.forEach(att => {
      const employeeName = att.employee?.full_name || 'Unknown';
      if (!summary[employeeName]) {
        summary[employeeName] = { 
          employeeId: att.employee_id,
          present: 0, 
          overtime: 0,
          izin: 0, 
          cuti: 0,
          sakit: 0,
          alfa: 0
        };
      }
      
      if (att.status === 'PRESENT' || att.status === 'LATE') {
        if (att.overtime_minutes && att.overtime_minutes > 0) {
          summary[employeeName].overtime++;
        } else {
          summary[employeeName].present++;
        }
      } else if (att.status === 'ABSENT') {
        // Check if there's an approved leave for this date
        const recordDate = att.date.split('T')[0];
        
        if (isOnLeave(att.employee_id, recordDate, 'izin')) {
          summary[employeeName].izin++;
        } else if (isOnLeave(att.employee_id, recordDate, 'cuti')) {
          summary[employeeName].cuti++;
        } else if (isOnLeave(att.employee_id, recordDate, 'sakit')) {
          summary[employeeName].sakit++;
        } else {
          // No leave request = Alfa
          summary[employeeName].alfa++;
        }
      }
    });
    
    // Add leave days from approved leave requests that might not have attendance records
    leaves.forEach(leave => {
      const employeeName = leave.employee.full_name;
      
      if (!summary[employeeName]) {
        summary[employeeName] = { 
          employeeId: leave.employee_id,
          present: 0, 
          overtime: 0,
          izin: 0, 
          cuti: 0,
          sakit: 0,
          alfa: 0
        };
      }
      
      // Count leave days within the filtered date range
      const leaveStart = new Date(leave.start_date);
      const leaveEnd = new Date(leave.end_date);
      
      let filterStart = startDate ? new Date(startDate) : leaveStart;
      let filterEnd = endDate ? new Date(endDate) : leaveEnd;
      
      const actualStart = leaveStart > filterStart ? leaveStart : filterStart;
      const actualEnd = leaveEnd < filterEnd ? leaveEnd : filterEnd;
      
      if (actualStart <= actualEnd) {
        // Count days in this period
        const dayCount = Math.ceil((actualEnd.getTime() - actualStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        
        // Check if we already counted these from attendance records
        const existingAttendance = filteredAttendances.filter(att => 
          att.employee_id === leave.employee_id &&
          att.date >= leave.start_date &&
          att.date <= leave.end_date
        ).length;
        
        const newLeaveDays = Math.max(0, dayCount - existingAttendance);
        
        // Add to appropriate category
        if (leave.leave_type === 'SICK') {
          summary[employeeName].sakit += newLeaveDays;
        } else if (['ANNUAL', 'MATERNITY', 'PATERNITY'].includes(leave.leave_type)) {
          summary[employeeName].cuti += newLeaveDays;
        } else {
          summary[employeeName].izin += newLeaveDays;
        }
      }
    });
    
    return summary;
  };

  const attendanceSummary = getAttendanceSummary();

  return (
    <Layout>
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Attendance Management</h1>
          <p className="text-gray-600 mt-1">Manage and monitor employee attendance data</p>
        </div>

        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <div className="flex items-start gap-3">
            <div className="text-blue-600 mt-1">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 text-sm">Data Period Information</h3>
              <p className="text-sm text-blue-800 mt-1">
                {startDate && endDate
                  ? `Showing attendance data from ${formatDate(startDate)} to ${formatDate(endDate)}`
                  : startDate
                  ? `Showing attendance data from ${formatDate(startDate)}`
                  : endDate
                  ? `Showing attendance data until ${formatDate(endDate)}`
                  : 'Showing all attendance data. Use date range filter to view specific period.'}
              </p>
              <p className="text-xs text-blue-700 mt-2">
                💡 <strong>Present:</strong> Click to see General vs Overtime breakdown | <strong>Izin/Cuti/Sakit:</strong> From approved leave requests | <strong>Alfa:</strong> Absent without approved leave
              </p>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-blue-500">
            <div className="text-sm text-gray-600">Total Employees</div>
            <div className="text-2xl font-bold text-gray-900">{Object.keys(attendanceSummary).length}</div>
            <div className="text-xs text-gray-500 mt-1">with attendance records</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-green-500">
            <div className="text-sm text-gray-600">Total Present</div>
            <div className="text-2xl font-bold text-green-600">
              {Object.values(attendanceSummary).reduce((sum, emp) => sum + emp.present + emp.overtime, 0)}
            </div>
            <div className="text-xs text-gray-500 mt-1">present records</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-yellow-500">
            <div className="text-sm text-gray-600">Leave (Izin/Cuti/Sakit)</div>
            <div className="text-2xl font-bold text-yellow-600">
              {Object.values(attendanceSummary).reduce((sum, emp) => sum + emp.izin + emp.cuti + emp.sakit, 0)}
            </div>
            <div className="text-xs text-gray-500 mt-1">leave records</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-red-500">
            <div className="text-sm text-gray-600">Alfa (Absent)</div>
            <div className="text-2xl font-bold text-red-600">
              {Object.values(attendanceSummary).reduce((sum, emp) => sum + emp.alfa, 0)}
            </div>
            <div className="text-xs text-gray-500 mt-1">absent without reason</div>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Search className="inline w-4 h-4 mr-1" />
                Search Employee
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Employee name"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Start Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Calendar className="inline w-4 h-4 mr-1" />
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base cursor-pointer"
                style={{
                  colorScheme: 'light',
                  WebkitAppearance: 'none',
                  MozAppearance: 'none'
                }}
              />
            </div>

            {/* End Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Calendar className="inline w-4 h-4 mr-1" />
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base cursor-pointer"
                style={{
                  colorScheme: 'light',
                  WebkitAppearance: 'none',
                  MozAppearance: 'none'
                }}
              />
            </div>
          </div>

          <div className="flex justify-between items-center mt-4">
            <button
              onClick={resetFilters}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Reset Filter
            </button>
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-600">
                Showing {filteredAttendances.length} of {attendances.length} data
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setViewMode('summary')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    viewMode === 'summary'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  title="View by employee with total attendance/late/absent"
                >
                  Summary
                </button>
                <button
                  onClick={() => setViewMode('detail')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    viewMode === 'detail'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  title="View all check-in/check-out records"
                >
                  Detail
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              Loading data...
            </div>
          ) : filteredAttendances.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No attendance data found
            </div>
          ) : viewMode === 'summary' ? (
            /* Summary View - Grouped by Employee */
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Employee
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="flex items-center gap-2">
                        <span>Present</span>
                        <div className="relative">
                          <button 
                            onClick={() => setShowPresentMenu(!showPresentMenu)}
                            className="text-gray-400 hover:text-gray-600 p-1"
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                            </svg>
                          </button>
                          {showPresentMenu && (
                            <div className="absolute right-0 mt-1 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                              <div className="py-1">
                                <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                                  General - Regular attendance
                                </button>
                                <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                                  Overtime - With OT hours
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Izin
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cuti
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sakit
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Alfa
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {Object.entries(attendanceSummary).map(([employeeName, stats]) => {
                    const totalPresent = stats.present + stats.overtime;
                    
                    return (
                      <tr key={employeeName} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <User className="h-6 w-6 text-blue-600" />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{employeeName}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {totalPresent > 0 ? (
                            <button
                              onClick={() => {
                                setSelectedEmployee(stats.employeeId);
                                setShowOvertimeModal(true);
                              }}
                              className="px-3 py-1.5 rounded-lg text-sm font-medium bg-green-100 text-green-800 hover:bg-green-200 transition-colors cursor-pointer"
                            >
                              {totalPresent} days
                            </button>
                          ) : (
                            <span className="px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-100 text-gray-600">
                              0 days
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1.5 rounded-lg text-sm font-medium ${stats.izin > 0 ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'}`}>
                            {stats.izin}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1.5 rounded-lg text-sm font-medium ${stats.cuti > 0 ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-600'}`}>
                            {stats.cuti}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1.5 rounded-lg text-sm font-medium ${stats.sakit > 0 ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-600'}`}>
                            {stats.sakit}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1.5 rounded-lg text-sm font-medium ${stats.alfa > 0 ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-600'}`}>
                            {stats.alfa}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            /* Detail View - All Records */
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Employee
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Check In
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Check Out
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Hours
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAttendances.map((attendance) => (
                    <tr key={attendance.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="h-6 w-6 text-blue-600" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {attendance.employee?.full_name || 'Unknown'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(attendance.date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{formatTime(attendance.check_in_time)}</div>
                        {attendance.check_in_location && (
                          <div className="text-xs text-gray-500 flex items-center mt-1">
                            <MapPin className="w-3 h-3 mr-1" />
                            {attendance.check_in_location.substring(0, 30)}...
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{formatTime(attendance.check_out_time)}</div>
                        {attendance.check_out_location && (
                          <div className="text-xs text-gray-500 flex items-center mt-1">
                            <MapPin className="w-3 h-3 mr-1" />
                            {attendance.check_out_location.substring(0, 30)}...
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDuration(attendance.work_duration_minutes)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(attendance.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => handleViewDetail(attendance)}
                          className="text-blue-600 hover:text-blue-800 transition-colors"
                          title="Lihat Detail"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedAttendance && (
        <AttendanceDetailModal
          attendance={selectedAttendance}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedAttendance(null);
          }}
        />
      )}

      {/* Overtime Breakdown Modal */}
      {showOvertimeModal && selectedEmployee && (
        <OvertimeBreakdownModal
          employeeId={selectedEmployee}
          attendances={filteredAttendances.filter(a => a.employee_id === selectedEmployee)}
          onClose={() => {
            setShowOvertimeModal(false);
            setSelectedEmployee(null);
          }}
        />
      )}
    </div>
    </Layout>
  );
}

// Detail Modal Component
interface AttendanceDetailModalProps {
  attendance: AttendanceRecord;
  onClose: () => void;
}

function AttendanceDetailModal({ attendance, onClose }: AttendanceDetailModalProps) {
  // Get initials from name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDateTime = (datetime: string | null) => {
    if (!datetime) return '-';
    const date = new Date(datetime);
    return date.toLocaleString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatTime = (datetime: string | null) => {
    if (!datetime) return '-';
    const date = new Date(datetime);
    return date.toLocaleTimeString('id-ID', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return '-';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours} jam ${mins} menit`;
  };

  const formatDateForModal = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* Header with Avatar */}
        <div className="bg-blue-600 px-5 py-4 rounded-t-2xl relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/90 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          <div className="flex items-center gap-3">
            {/* Avatar Circle */}
            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white font-bold text-sm border-2 border-white/30">
              {getInitials(attendance.employee?.full_name || 'N/A')}
            </div>
            
            <div>
              <h2 className="text-lg font-bold text-white">{attendance.employee?.full_name || 'Karyawan'}</h2>
              <p className="text-xs text-white/80 mt-0.5">
                {formatDateForModal(attendance.date)}
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 bg-gray-50">
          {/* Status Cards - Corporate Style */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            {/* Clock In Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-0.5">Masuk</p>
                  <p className="text-xs font-bold text-gray-900 truncate">{formatTime(attendance.check_in_time)}</p>
                </div>
              </div>
            </div>

            {/* Clock Out Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-0.5">Keluar</p>
                  <p className="text-xs font-bold text-gray-900 truncate">{formatTime(attendance.check_out_time)}</p>
                </div>
              </div>
            </div>

            {/* Total Hours Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-0.5">Total Jam</p>
                  <p className="text-xs font-bold text-gray-900 truncate">{formatDuration(attendance.work_duration_minutes)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Location Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Location Header */}
            <div className="px-4 py-2.5 border-b border-gray-100 bg-linear-to-r from-gray-50 to-white">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <h3 className="font-bold text-gray-900 text-xs">Lokasi Absen</h3>
              </div>
            </div>
            
            <div className="p-3">
              {/* Address */}
              <div className="mb-3">
                <p className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">Alamat</p>
                <p className="text-xs text-gray-600 leading-relaxed">{attendance.check_in_location || 'Alamat tidak tersedia'}</p>
              </div>

              {/* Map Area */}
              {attendance.check_in_latitude && attendance.check_in_longitude ? (
                <div className="relative rounded-xl overflow-hidden border-2 border-gray-200 bg-gray-100" style={{ height: '200px' }}>
                  {/* Embedded Google Maps */}
                  <iframe
                    width="100%"
                    height="200"
                    style={{ border: 0, display: 'block' }}
                    loading="lazy"
                    allowFullScreen
                    referrerPolicy="no-referrer-when-downgrade"
                    src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${attendance.check_in_latitude},${attendance.check_in_longitude}&zoom=16`}
                  />
                  
                  {/* Coordinates Badge */}
                  <div className="absolute bottom-2 left-2 bg-white/95 backdrop-blur-sm px-2 py-1 rounded-lg shadow-lg border border-gray-200">
                    <p className="text-xs font-mono text-gray-700">
                      {typeof attendance.check_in_latitude === 'number' ? attendance.check_in_latitude.toFixed(6) : '0.000000'}, {typeof attendance.check_in_longitude === 'number' ? attendance.check_in_longitude.toFixed(6) : '0.000000'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 flex flex-col items-center justify-center gap-2 py-8">
                  <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <p className="text-sm font-semibold text-gray-500">Koordinat lokasi tidak tersedia</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Overtime Breakdown Modal Component
interface OvertimeBreakdownModalProps {
  employeeId: string;
  attendances: AttendanceRecord[];
  onClose: () => void;
}

function OvertimeBreakdownModal({ employeeId, attendances, onClose }: OvertimeBreakdownModalProps) {
  const generalAttendances = attendances.filter(a => 
    (a.status === 'PRESENT' || a.status === 'LATE') && (!a.overtime_minutes || a.overtime_minutes === 0)
  );
  
  const overtimeAttendances = attendances.filter(a => 
    (a.status === 'PRESENT' || a.status === 'LATE') && a.overtime_minutes && a.overtime_minutes > 0
  );

  const employeeName = attendances[0]?.employee?.full_name || 'Employee';

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-blue-600 px-5 py-4 rounded-t-2xl relative">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 text-white/90 hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          <h2 className="text-lg font-bold text-white">Attendance Breakdown</h2>
          <p className="text-xs text-white/80 mt-0.5">{employeeName}</p>
        </div>

        <div className="p-5">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-4 mb-5">
            <div className="bg-linear-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-green-700 uppercase">General</p>
                  <p className="text-2xl font-bold text-green-900">{generalAttendances.length}</p>
                  <p className="text-xs text-green-600">Regular attendance</p>
                </div>
              </div>
            </div>

            <div className="bg-linear-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-purple-700 uppercase">Overtime</p>
                  <p className="text-2xl font-bold text-purple-900">{overtimeAttendances.length}</p>
                  <p className="text-xs text-purple-600">With overtime hours</p>
                </div>
              </div>
            </div>
          </div>

          {/* Lists */}
          <div className="space-y-4">
            {/* General List */}
            {generalAttendances.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-gray-700 uppercase mb-2 flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  General Attendance
                </h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {generalAttendances.map((att) => (
                    <div key={att.id} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {new Date(att.date).toLocaleDateString('id-ID', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {att.check_in_time ? new Date(att.check_in_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'} - {att.check_out_time ? new Date(att.check_out_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}
                          </p>
                        </div>
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {att.work_duration_minutes ? `${Math.floor(att.work_duration_minutes / 60)}h ${att.work_duration_minutes % 60}m` : '-'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Overtime List */}
            {overtimeAttendances.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-gray-700 uppercase mb-2 flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  Overtime Attendance
                </h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {overtimeAttendances.map((att) => (
                    <div key={att.id} className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                      <div className="flex justify-between items-center">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            {new Date(att.date).toLocaleDateString('id-ID', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {att.check_in_time ? new Date(att.check_in_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'} - {att.check_out_time ? new Date(att.check_out_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}
                          </p>
                          <p className="text-xs text-purple-600 font-medium mt-1">
                            OT: {att.overtime_minutes ? `${Math.floor(att.overtime_minutes / 60)}h ${att.overtime_minutes % 60}m` : '-'}
                          </p>
                        </div>
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          {att.work_duration_minutes ? `${Math.floor(att.work_duration_minutes / 60)}h ${att.work_duration_minutes % 60}m` : '-'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {generalAttendances.length === 0 && overtimeAttendances.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p>No attendance records found</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

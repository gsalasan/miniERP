import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { Pencil, Trash2, Plus, Search, Eye } from 'lucide-react';
import EmployeeEdit from './EmployeeEdit';
import EmployeeDetailModal from './EmployeeDetailModal';
import EmployeeNew from './EmployeeNew';

import type { Employee } from './EmployeeDetailModal';
import {
  GenderLabels,
  MaritalStatusLabels,
  EmploymentTypeLabels,
  EmployeeStatusLabels
} from '../enums/employeeEnums';




export default function EmployeesList() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  // const [department, setDepartment] = useState('');
  // const [status, setStatus] = useState('');
  // const [position, setPosition] = useState('');
  // const navigate = useNavigate();
  const [editId, setEditId] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    fetch('http://localhost:3002/api/v1/employees')
      .then(res => res.json())
      .then(data => {
        console.log('Employee data received:', data.data?.length || 0, 'employees');
        setEmployees(data.data || []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching employees:', err);
        setLoading(false);
      });
  }, []);

  // Get unique departments and positions for filter dropdowns
  // const departmentOptions = Array.from(new Set(employees.map(e => e.department).filter(Boolean)));
  // const positionOptions = Array.from(new Set(employees.map(e => e.position).filter(Boolean)));

  const filtered = employees.filter(emp => {
    const userEmail = Array.isArray(emp.users) && emp.users[0]?.email 
      ? emp.users[0].email.toLowerCase() 
      : '';
    const matchesSearch =
      emp.full_name.toLowerCase().includes(search.toLowerCase()) ||
      emp.position.toLowerCase().includes(search.toLowerCase()) ||
      userEmail.includes(search.toLowerCase());
    return matchesSearch;
  });

  console.log('Employees:', employees.length, 'Filtered:', filtered.length, 'Loading:', loading);

  // Delete handler
  async function handleDelete(id: string) {
    setDeleteId(id);
    setShowDeleteModal(true);
  }

  async function confirmDelete() {
    if (!deleteId) return;
    setDeletingId(deleteId);
    try {
      const res = await fetch(`http://localhost:3002/api/v1/employees/${deleteId}`, { method: 'DELETE' });
      if (res.ok) {
        setEmployees(prev => prev.filter(e => e.id !== deleteId));
        setShowDeleteModal(false);
        setDeleteSuccess(true);
        setTimeout(() => setDeleteSuccess(false), 3000);
      } else {
        alert('Failed to delete employee');
      }
    } catch (e) {
      alert('Failed to delete employee');
    }
    setDeletingId(null);
    setDeleteId(null);
  }

  return (
    <Layout>
      <div className="bg-[#F4F4F4] p-8">
        {/* New Employee Modal */}
        {showNewModal && (
          <EmployeeNew onClose={() => {
            setShowNewModal(false);
            // Refresh list after creating
            fetch('http://localhost:3002/api/v1/employees')
              .then(res => res.json())
              .then(data => setEmployees(data.data || []));
          }} />
        )}

        {/* Edit Modal */}
        {editId && (
          <EmployeeEdit 
            id={editId} 
            onClose={() => {
              setEditId(null);
              // Refresh list after editing
              fetch('http://localhost:3002/api/v1/employees')
                .then(res => res.json())
                .then(data => setEmployees(data.data || []));
            }} 
          />
        )}

        {/* Detail Modal */}
        {detailId && (
          <EmployeeDetailModal id={detailId} onClose={() => setDetailId(null)} />
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black/20 z-50 flex items-center justify-center" onClick={() => { setShowDeleteModal(false); setDeleteId(null); }}>
            <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-md w-full mx-4 border-2 border-gray-200" onClick={(e) => e.stopPropagation()}>
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Delete Employee?</h2>
                <p className="text-gray-600 text-center mb-6">Are you sure you want to delete this employee? This action cannot be undone.</p>
                <div className="flex gap-3 w-full">
                  <button
                    onClick={() => { setShowDeleteModal(false); setDeleteId(null); }}
                    className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDelete}
                    className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors shadow-lg"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Success Toast */}
        {deleteSuccess && (
          <div className="fixed top-8 left-1/2 -translate-x-1/2 bg-white border-l-4 border-green-500 shadow-2xl rounded-xl p-5 z-[60] animate-fade-in flex items-center gap-4 min-w-[350px]">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="font-bold text-lg text-gray-900">Success!</p>
              <p className="text-sm text-gray-600">Employee has been deleted successfully</p>
            </div>
          </div>
        )}

        <div className="max-w-7xl mx-auto">
          {loading ? (
            <div className="text-center py-10 text-blue-600 text-xl font-semibold">Loading employee data...</div>
          ) : (
            <>
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-blue-900 whitespace-nowrap mb-1">Employee Database</h1>
                <span className="text-blue-400 font-medium text-sm">Manage all company employee data</span>
              </div>
            </div>
            <div className="flex gap-2 items-center mt-2 md:mt-0 justify-end w-full">
              <button
                onClick={() => setShowNewModal(true)}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full shadow font-semibold text-base transition-all"
              >
                <Plus size={18} /> Add New Employee
              </button>
            </div>
          </div>

          {/* Filter/Search Bar */}
          <div className="flex flex-col md:flex-row md:items-center gap-3 mb-6">
            <div className="flex-1 flex gap-2">
              <div className="relative w-full max-w-xs">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-300">
                  <Search size={18} />
                </span>
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search name, position, email..."
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white text-blue-900 placeholder:text-blue-300 transition"
                />
              </div>
            </div>
          </div>

          {/* Table */}
    <div className="bg-white rounded-2xl shadow-lg p-6 border border-[#E5E7EB] animate-fade-in">
            <div className="flex justify-between items-center mb-2">
              <div className="font-bold text-lg text-[#06103A]">Employee List</div>
              <div className="text-sm text-[#6B6E70]">Total: {employees.length} employees</div>
            </div>
            {filtered.length === 0 ? (
              <div className="text-center py-8 text-blue-400 font-semibold text-lg bg-white rounded-2xl shadow border border-blue-100">No employee data found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="bg-[#F4F4F4] text-[#06103A]">
                      <th className="py-3 px-4 text-left font-semibold">Full Name</th>
                      <th className="py-3 px-4 text-left font-semibold">Position</th>
                      <th className="py-3 px-4 text-left font-semibold">Department</th>
                      <th className="py-3 px-4 text-left font-semibold">Hire Date</th>
                      <th className="py-3 px-4 text-left font-semibold">Basic Salary</th>
                      <th className="py-3 px-4 text-left font-semibold">Allowances</th>
                      <th className="py-3 px-4 text-left font-semibold">Gender</th>
                      <th className="py-3 px-4 text-left font-semibold">Marital Status</th>
                      <th className="py-3 px-4 text-left font-semibold">Employment Type</th>
                      <th className="py-3 px-4 text-left font-semibold">Status</th>
                      <th className="py-3 px-4 text-center font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(emp => (
                      <tr key={emp.id} className="border-b last:border-b-0 hover:bg-blue-50 transition">
                        <td className="py-3 px-4 min-w-[180px]">
                          <div className="flex items-center gap-3">
                            <span className="inline-flex items-center justify-center w-10 h-10 rounded-full font-bold text-white text-sm shadow border-2 border-white" style={{background: stringToColor(emp.full_name)}}>
                              {emp.full_name.split(' ').map((n: string) => n[0]).join('').slice(0,2)}
                            </span>
                            <div className="font-semibold text-[#333333]">{emp.full_name}</div>
                          </div>
                        </td>
                        <td className="py-3 px-4">{emp.position}</td>
                        <td className="py-3 px-4">{emp.department || '-'}</td>
                        <td className="py-3 px-4">{emp.hire_date ? new Date(emp.hire_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}</td>
                        <td className="py-3 px-4 text-[#06103A] font-semibold">
                          {emp.basic_salary !== undefined && emp.basic_salary !== null && !isNaN(Number(emp.basic_salary))
                            ? `Rp ${Number(emp.basic_salary).toLocaleString('id-ID')}`
                            : '-'}
                        </td>
                        <td className="py-3 px-4 text-[#4E88BE] font-semibold">
                          {(() => {
                            if (!emp.allowances) return '-';
                            // allowances can be stored as object map {name: amount} or array [{name, amount}]
                            let sum = 0;
                            try {
                              if (Array.isArray(emp.allowances)) {
                                sum = emp.allowances.reduce((s: number, it: any) => {
                                  const v = it && (typeof it.amount === 'number' ? it.amount : Number(it.amount));
                                  return s + (isNaN(v) ? 0 : v);
                                }, 0);
                              } else if (typeof emp.allowances === 'object') {
                                sum = Object.values(emp.allowances).reduce((s: number, v: any) => {
                                  const n = typeof v === 'number' ? v : Number(v);
                                  return s + (isNaN(n) ? 0 : n);
                                }, 0);
                              } else {
                                return '-';
                              }
                            } catch (e) {
                              return '-';
                            }

                            return sum > 0
                              ? sum.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).replace('IDR', 'Rp')
                              : '-';
                          })()}
                        </td>
                        <td className="py-3 px-4">{emp.gender ? GenderLabels[emp.gender] || emp.gender : '-'}</td>
                        <td className="py-3 px-4">{emp.marital_status ? MaritalStatusLabels[emp.marital_status] || emp.marital_status : '-'}</td>
                        <td className="py-3 px-4">{emp.employment_type ? EmploymentTypeLabels[emp.employment_type] || emp.employment_type : '-'}</td>
                        <td className="py-3 px-4">{emp.status ? EmployeeStatusLabels[emp.status] || emp.status : '-'}</td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex gap-2 justify-center">
                            <button
                              type="button"
                              className="p-2 bg-white border border-[#E5E7EB] rounded-full hover:bg-[#F4F4F4] text-[#4E88BE] hover:text-[#06103A] transition"
                              title="View Employee Detail"
                              onClick={() => setDetailId(emp.id)}
                            >
                              <Eye size={18} />
                            </button>
                            <button
                              className="p-2 bg-white border border-[#E5E7EB] rounded-full hover:bg-[#F4F4F4] text-[#4E88BE] hover:text-[#06103A] transition"
                              title="Edit"
                              onClick={() => setEditId(emp.id)}
                            >
                              <Pencil size={18} />
                            </button>
                            <button
                              className="p-2 bg-white border border-[#E5E7EB] rounded-full hover:bg-[#D9534F] text-[#D9534F] hover:text-white transition"
                              title="Delete"
                              onClick={() => handleDelete(emp.id)}
                              disabled={deletingId === emp.id}
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          </>
          )}
        </div>
      </div>
    </Layout>
  );
}

// Helper: generate color from string (for avatar background)
function stringToColor(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const color = `hsl(${hash % 360}, 70%, 60%)`;
  return color;
}

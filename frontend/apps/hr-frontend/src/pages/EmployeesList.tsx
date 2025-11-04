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
        setEmployees(data.data || []);
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
        setDeleteSuccess(true);
        setTimeout(() => setDeleteSuccess(false), 1500);
      } else {
        alert('Failed to delete employee');
      }
    } catch (e) {
      alert('Failed to delete employee');
    }
    setDeletingId(null);
    setShowDeleteModal(false);
    setDeleteId(null);
  }

  return (
    <Layout>
      <div className="min-h-screen bg-[#F4F4F4] px-2 py-8">
        <div className="max-w-6xl mx-auto">
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
            {loading ? (
              <div className="text-center py-10 text-blue-600">Loading data...</div>
            ) : filtered.length === 0 ? (
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
                        <td className="py-3 px-4 flex items-center gap-3 min-w-[180px]">
                          <span className="inline-flex items-center justify-center w-12 h-12 rounded-full font-bold text-white text-base shadow border-2 border-white aspect-square" style={{background: stringToColor(emp.full_name)}}>
                            {emp.full_name.split(' ').map((n: string) => n[0]).join('').slice(0,2)}
                          </span>
                          <div>
                            <div className="font-semibold text-[#333333] leading-tight">{emp.full_name}</div>
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
        </div>
      </div>
    {/* Delete Confirmation Modal */}
    {/* Delete Confirmation Modal - improved design, overlay does not block table */}
    <div className={showDeleteModal || deleteSuccess ? "" : "hidden"}>
      <div className="fixed inset-0 z-40 bg-black/30 pointer-events-none"></div>
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm border border-red-200 animate-fade-in flex flex-col items-center relative">
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white rounded-full shadow-lg p-2 border-4 border-red-100">
              <svg width="48" height="48" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#FDECEA"/><path d="M15.5355 8.46447L8.46447 15.5355M8.46447 8.46447L15.5355 15.5355" stroke="#D9534F" strokeWidth="2" strokeLinecap="round"/></svg>
            </div>
            <div className="mt-8 text-lg font-bold text-[#D9534F] mb-2">Konfirmasi Hapus</div>
            <div className="text-gray-700 mb-6 text-center">Yakin ingin menghapus karyawan ini? Data yang dihapus tidak dapat dikembalikan.</div>
            <div className="flex gap-4 w-full">
              <button onClick={confirmDelete} className="flex-1 bg-[#D9534F] hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold transition">Hapus</button>
              <button onClick={() => setShowDeleteModal(false)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-semibold transition">Batal</button>
            </div>
          </div>
        </div>
      )}
      {/* Delete Success Modal - improved design */}
      {deleteSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm border border-green-200 animate-fade-in flex flex-col items-center relative">
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white rounded-full shadow-lg p-2 border-4 border-green-100">
              <svg width="48" height="48" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#E6F4EA"/><path d="M7 13l3 3 7-7" stroke="#5CB85C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <div className="mt-8 text-lg font-bold text-[#5CB85C] mb-2">Berhasil Dihapus</div>
            <div className="text-gray-700 mb-2 text-center">Data karyawan berhasil dihapus.</div>
          </div>
        </div>
      )}
    </div>
    {/* Edit Modal Popup */}
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
    {/* Detail Modal Popup */}
    {detailId && (
      <EmployeeDetailModal id={detailId} onClose={() => setDetailId(null)} />
    )}
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

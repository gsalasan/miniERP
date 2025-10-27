import React, { useEffect, useState } from 'react';

import Layout from '../components/Layout';
import { Link } from 'react-router-dom';
import { Pencil, Trash2, Plus, Search, Eye } from 'lucide-react';
import EmployeeEdit from './EmployeeEdit';



interface UserInfo {
  id: string;
  email: string;
  roles: string[];
  is_active: boolean;
}

interface Employee {
  id: string;
  full_name: string;
  position: string;
  department?: string;
  hire_date: string;
  basic_salary: number;
  allowances?: any;
  users?: UserInfo[];
}


export default function EmployeesList() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [status, setStatus] = useState('');
  const [position, setPosition] = useState('');
  // const navigate = useNavigate();
  const [editId, setEditId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    fetch('http://localhost:3002/api/v1/employees/list/all')
      .then(res => res.json())
      .then(data => {
        setEmployees(data.data || []);
        setLoading(false);
      });
  }, []);

  // Get unique departments and positions for filter dropdowns
  const departmentOptions = Array.from(new Set(employees.map(e => e.department).filter(Boolean)));
  const positionOptions = Array.from(new Set(employees.map(e => e.position).filter(Boolean)));

  const filtered = employees.filter(emp => {
    const matchesSearch =
      emp.full_name.toLowerCase().includes(search.toLowerCase()) ||
      emp.position.toLowerCase().includes(search.toLowerCase()) ||
      (emp.department && emp.department.toLowerCase().includes(search.toLowerCase())) ||
      (emp.users && emp.users[0]?.email?.toLowerCase().includes(search.toLowerCase()));
    const matchesDept = !department || emp.department === department;
    const matchesStatus = !status || (status === 'Aktif' ? emp.users && emp.users[0]?.is_active : emp.users && !emp.users[0]?.is_active);
    const matchesPosition = !position || emp.position === position;
    return matchesSearch && matchesDept && matchesStatus && matchesPosition;
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
        alert('Gagal menghapus karyawan');
      }
    } catch (e) {
      alert('Gagal menghapus karyawan');
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
                <h1 className="text-2xl md:text-3xl font-bold text-blue-900 mb-1">Data Karyawan</h1>
                <div className="text-blue-400 font-medium text-sm">Kelola data seluruh karyawan perusahaan</div>
              </div>
            </div>
            <div className="flex gap-2 items-center mt-2 md:mt-0">
              <Link to="/hr/employees/new" className="flex items-center gap-2 bg-gradient-to-r from-blue-700 to-blue-500 hover:from-blue-800 hover:to-blue-600 text-white px-5 py-2 rounded-full shadow font-semibold text-base transition-all">
                <Plus size={18} /> Tambah Karyawan
              </Link>
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
                  placeholder="Cari nama, jabatan, email, dept..."
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-blue-50 text-blue-900 placeholder:text-blue-300 transition"
                />
              </div>
              <select value={department} onChange={e => setDepartment(e.target.value)} className="rounded-lg border border-blue-200 bg-white px-3 py-2 text-blue-900 text-sm">
                <option value="">Semua Departemen</option>
                {departmentOptions.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
              <select value={status} onChange={e => setStatus(e.target.value)} className="rounded-lg border border-blue-200 bg-white px-3 py-2 text-blue-900 text-sm">
                <option value="">Semua Status</option>
                <option value="Aktif">Aktif</option>
                <option value="Nonaktif">Non-Aktif</option>
              </select>
              <select value={position} onChange={e => setPosition(e.target.value)} className="rounded-lg border border-blue-200 bg-white px-3 py-2 text-blue-900 text-sm">
                <option value="">Semua Jabatan</option>
                {positionOptions.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
            <button className="px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg font-medium text-sm border border-blue-200 transition">Terapkan Filter</button>
          </div>

          {/* Table */}
    <div className="bg-white rounded-2xl shadow-lg p-6 border border-[#E5E7EB] animate-fade-in">
            <div className="flex justify-between items-center mb-2">
              <div className="font-bold text-lg text-[#06103A]">Daftar Karyawan</div>
              <div className="text-sm text-[#6B6E70]">Total: {employees.length} karyawan</div>
            </div>
            {loading ? (
              <div className="text-center py-10 text-blue-600">Memuat data...</div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-8 text-blue-400 font-semibold text-lg bg-white rounded-2xl shadow border border-blue-100">Tidak ada data karyawan ditemukan.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="bg-[#F4F4F4] text-[#06103A]">
                      <th className="py-3 px-4 text-left font-semibold">Nama Lengkap</th>
                      <th className="py-3 px-4 text-left font-semibold">Posisi</th>
                      <th className="py-3 px-4 text-left font-semibold">Tanggal Bergabung</th>
                      <th className="py-3 px-4 text-left font-semibold">Gaji Pokok</th>
                      <th className="py-3 px-4 text-left font-semibold">Tunjangan</th>
                      <th className="py-3 px-4 text-left font-semibold">Departemen</th>
                      <th className="py-3 px-4 text-left font-semibold">Status</th>
                      <th className="py-3 px-4 text-center font-semibold">Aksi</th>
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
                            <div className="text-xs text-[#6B6E70]">{emp.id}</div>
                          </div>
                        </td>
                        <td className="py-3 px-4">{emp.position}</td>
                        <td className="py-3 px-4">{emp.hire_date ? new Date(emp.hire_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}</td>
                        <td className="py-3 px-4 text-[#06103A] font-semibold">Rp {emp.basic_salary?.toLocaleString('id-ID')}</td>
                        <td className="py-3 px-4 text-[#4E88BE] font-semibold">
                          {emp.allowances ?
                            Object.values(emp.allowances).reduce((a: number, b: any) => a + (typeof b === 'number' ? b : 0), 0).toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).replace('IDR', 'Rp')
                            : '-'}
                        </td>
                        <td className="py-3 px-4">{emp.department || '-'}</td>
                        <td className="py-3 px-4">
                          {emp.users && emp.users[0]?.is_active ? (
                            <span className="px-3 py-1 rounded-full bg-[#E6F4EA] text-[#5CB85C] text-xs font-semibold">Aktif</span>
                          ) : (
                            <span className="px-3 py-1 rounded-full bg-[#F4F4F4] text-[#6B6E70] border border-[#E5E7EB] text-xs font-semibold">Non-Aktif</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex gap-2 justify-center">
                            <button
                              className="p-2 bg-white border border-[#E5E7EB] rounded-full hover:bg-[#F4F4F4] text-[#4E88BE] hover:text-[#06103A] transition"
                              title="Lihat Detail Karyawan"
                              onClick={() => window.open(`/hr/employees/${emp.id}`, '_blank')}
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
                              title="Hapus"
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
      <div>
        <div className="fixed inset-0 z-40 bg-black/30"></div>
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <EmployeeEdit id={editId} onClose={() => setEditId(null)} />
        </div>
      </div>
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

import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import { Edit2, Trash2, Eye, AlertCircle, ArrowLeft } from 'lucide-react';
import { fetchAllUsers, updateUser, deleteUser } from '../../api/userApi';
import { useNavigate } from 'react-router-dom';

interface User {
  id: string;
  email: string;
  roles?: string[];
  is_active?: boolean;
  created_at?: string;
}

interface FormData {
  email: string;
  password?: string;
  roles: string[];
}

const ROLE_OPTIONS = [
  'CEO',
  'FINANCE_ADMIN',
  'SALES',
  'SALES_MANAGER',
  'PROJECT_MANAGER',
  'PROJECT_ENGINEER',
  'HR_ADMIN',
  'EMPLOYEE',
  'PROCUREMENT_ADMIN',
  'ASSET_ADMIN',
  'SYSTEM_ADMIN',
  'OPERATIONAL_MANAGER',
  'SUPPORT_MANAGER',
  'ENGINEERING_MANAGER',
  'ADMIN_SALES',
  'ADMIN_PROJECT',
  'SUPERVISOR',
  'TECHNICIAN'
];

export default function UserManagement() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'view' | 'edit' | 'delete'>('view');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<FormData>({ email: '', roles: [] });
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Load users on mount
  useEffect(() => {
    // Don't show error, just try to load
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      console.log('📤 Calling API to fetch users...');
      const data = await fetchAllUsers();
      console.log('✅ Users loaded successfully:', data);
      setUsers(data);
      setError('');
    } catch (err: any) {
      console.error('❌ Load users error:', err);
      const errorMsg = err.response?.data?.message || err.message || 'Failed to load users';
      console.log('Error details:', errorMsg);
      // Don't set error UI, just log it
    } finally {
      setLoading(false);
    }
  };

  const handleViewClick = (user: User) => {
    setModalType('view');
    setSelectedUser(user);
    setShowModal(true);
  };

  const handleEditClick = (user: User) => {
    setModalType('edit');
    setSelectedUser(user);
    setFormData({ email: user.email, roles: user.roles || [] });
    setShowModal(true);
  };

  const handleDeleteClick = (user: User) => {
    setModalType('delete');
    setSelectedUser(user);
    setShowModal(true);
  };

  const handleFormChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleRoleToggle = (role: string) => {
    setFormData(prev => ({
      ...prev,
      roles: prev.roles.includes(role)
        ? prev.roles.filter(r => r !== role)
        : [...prev.roles, role],
    }));
  };

  const handleSave = async () => {
    if (!formData.email) {
      setError('Email is required');
      return;
    }

    try {
      if (modalType === 'edit' && selectedUser) {
        await updateUser(selectedUser.id, {
          email: formData.email,
          roles: formData.roles,
        });
        setSuccess('User updated successfully!');
      }
      setShowModal(false);
      loadUsers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to save user');
    }
  };

  const handleDelete = async () => {
    if (!selectedUser) return;

    try {
      await deleteUser(selectedUser.id);
      setSuccess('User deleted successfully!');
      setShowModal(false);
      loadUsers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to delete user');
    }
  };

  const paginatedUsers = users.slice((page - 1) * rowsPerPage, page * rowsPerPage);
  const totalPages = Math.ceil(users.length / rowsPerPage);

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-[#F4F4F4] flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mb-4"></div>
            <p className="text-blue-600 font-semibold">Loading Users...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-[#F4F4F4] px-8 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header with Back Button */}
          <div className="mb-6 flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-white rounded-lg transition-all border border-[#E5E7EB] flex items-center justify-center"
              title="Go Back"
            >
              <ArrowLeft size={20} className="text-[#06103A]" />
            </button>
            <div>
              <h1 className="text-4xl font-bold text-[#06103A] mb-2">User Management</h1>
              <p className="text-[#6B6E70]">Manage system users and permissions</p>
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-lg flex gap-3">
              <AlertCircle size={20} className="text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-red-800">Error</h3>
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            </div>
          )}

          {/* Success Alert */}
          {success && (
            <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-4 rounded-lg">
              <p className="text-green-700 font-medium">{success}</p>
            </div>
          )}

          {/* Table Section */}
          <div className="bg-white rounded-2xl shadow-lg border border-[#E5E7EB] overflow-hidden">
            {/* Table Header */}
            <div className="px-8 py-6 border-b border-[#E5E7EB]">
              <h2 className="text-xl font-bold text-[#06103A]">Users List</h2>
              <p className="text-sm text-[#6B6E70] mt-1">Manage existing user roles and permissions</p>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
                  <tr>
                    <th className="px-8 py-4 text-left text-sm font-semibold text-[#6B6E70]">Email</th>
                    <th className="px-8 py-4 text-left text-sm font-semibold text-[#6B6E70]">Roles</th>
                    <th className="px-8 py-4 text-left text-sm font-semibold text-[#6B6E70]">Status</th>
                    <th className="px-8 py-4 text-left text-sm font-semibold text-[#6B6E70]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  {paginatedUsers.length > 0 ? (
                    paginatedUsers.map(user => (
                      <tr key={user.id} className="hover:bg-[#F9FAFB] transition-colors">
                        <td className="px-8 py-4 text-[#06103A] font-medium">{user.email}</td>
                        <td className="px-8 py-4">
                          <div className="flex flex-wrap gap-2">
                            {user.roles && user.roles.length > 0 ? (
                              user.roles.map(role => (
                                <span key={role} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  {role}
                                </span>
                              ))
                            ) : (
                              <span className="text-[#9CA3AF]">-</span>
                            )}
                          </div>
                        </td>
                        <td className="px-8 py-4">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                            user.is_active !== false
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {user.is_active !== false ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-8 py-4">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => handleViewClick(user)}
                              className="p-2 hover:bg-blue-100 text-blue-600 rounded-lg transition-all"
                              title="View"
                            >
                              <Eye size={18} />
                            </button>
                            <button
                              onClick={() => handleEditClick(user)}
                              className="p-2 hover:bg-yellow-100 text-yellow-600 rounded-lg transition-all"
                              title="Edit"
                            >
                              <Edit2 size={18} />
                            </button>
                            <button
                              onClick={() => handleDeleteClick(user)}
                              className="p-2 hover:bg-red-100 text-red-600 rounded-lg transition-all"
                              title="Delete"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-8 py-12 text-center text-[#6B6E70]">
                        No users found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {users.length > 0 && (
              <div className="px-8 py-6 border-t border-[#E5E7EB] flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <label className="text-sm font-medium text-[#6B6E70]">Rows per page:</label>
                  <select
                    value={rowsPerPage}
                    onChange={(e) => {
                      setRowsPerPage(Number(e.target.value));
                      setPage(1);
                    }}
                    className="px-3 py-1.5 border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                    className="px-4 py-2 border border-[#E5E7EB] rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#F9FAFB]"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-[#6B6E70]">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    disabled={page === totalPages}
                    onClick={() => setPage(page + 1)}
                    className="px-4 py-2 border border-[#E5E7EB] rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#F9FAFB]"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Backdrop */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 max-h-[90vh] overflow-y-auto">
              {/* Modal Content */}
              {modalType === 'view' && selectedUser && (
                <>
                  <div className="flex items-center gap-3 mb-4">
                    <button
                      onClick={() => setShowModal(false)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-all"
                      title="Back"
                    >
                      <ArrowLeft size={20} className="text-[#06103A]" />
                    </button>
                    <h2 className="text-2xl font-bold text-[#06103A]">View User</h2>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-[#6B6E70] mb-1">Email</label>
                      <p className="text-[#06103A] font-medium">{selectedUser.email}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#6B6E70] mb-2">Roles</label>
                      <div className="flex flex-wrap gap-2">
                        {selectedUser.roles && selectedUser.roles.length > 0 ? (
                          selectedUser.roles.map(role => (
                            <span key={role} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {role}
                            </span>
                          ))
                        ) : (
                          <span className="text-[#9CA3AF]">No roles assigned</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#6B6E70] mb-1">Status</label>
                      <p className="text-[#06103A] font-medium">
                        {selectedUser.is_active !== false ? 'Active' : 'Inactive'}
                      </p>
                    </div>
                  </div>
                </>
              )}

              {modalType === 'edit' && selectedUser && (
                <>
                  <div className="flex items-center gap-3 mb-4">
                    <button
                      onClick={() => setShowModal(false)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-all"
                      title="Back"
                    >
                      <ArrowLeft size={20} className="text-[#06103A]" />
                    </button>
                    <h2 className="text-2xl font-bold text-[#06103A]">Edit User</h2>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-[#6B6E70] mb-2">Email</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleFormChange}
                        className="w-full px-4 py-2.5 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-[#06103A]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#6B6E70] mb-3">Roles</label>
                      <div className="space-y-2">
                        {ROLE_OPTIONS.map(role => (
                          <label key={role} className="flex items-center gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.roles.includes(role)}
                              onChange={() => handleRoleToggle(role)}
                              className="w-4 h-4 text-blue-600 border-[#E5E7EB] rounded focus:ring-2 focus:ring-blue-500"
                            />
                            <span className="text-sm text-[#06103A]">{role}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="mt-8 flex gap-3">
                    <button
                      onClick={() => setShowModal(false)}
                      className="flex-1 px-4 py-2.5 border border-[#E5E7EB] rounded-lg font-medium text-[#06103A] hover:bg-[#F9FAFB] transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all"
                    >
                      Update User
                    </button>
                  </div>
                </>
              )}

              {modalType === 'delete' && selectedUser && (
                <>
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mx-auto mb-4">
                    <AlertCircle size={24} className="text-red-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-[#06103A] mb-2 text-center">Delete User</h2>
                  <p className="text-[#6B6E70] text-center mb-6">
                    Are you sure you want to delete <strong>{selectedUser.email}</strong>? This action cannot be undone.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowModal(false)}
                      className="flex-1 px-4 py-2.5 border border-[#E5E7EB] rounded-lg font-medium text-[#06103A] hover:bg-[#F9FAFB] transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDelete}
                      className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-all"
                    >
                      Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

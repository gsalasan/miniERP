import React, { useState, useEffect, useMemo } from 'react';
import { 
  chartOfAccountsAPI, 
  ChartOfAccount, 
  CreateChartOfAccountDto, 
  UpdateChartOfAccountDto 
} from '../api';
import { ACCOUNT_TYPES } from '../config';
import { Layout, Modal, ConfirmDialog, Toast } from '../components';
import { useToast } from '../hooks/useToast';
import { exportToCSV, exportToJSON } from '../utils/exportUtils';
import {
  MagnifyingGlassIcon,
  PlusIcon,
  ArrowDownTrayIcon,
  PencilIcon,
  TrashIcon,
  FunnelIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

const COA: React.FC = () => {
  const [accounts, setAccounts] = useState<ChartOfAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<ChartOfAccount | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; accountId: number | null }>({
    isOpen: false,
    accountId: null,
  });

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Toast notifications
  const { toasts, hideToast, success, error } = useToast();
  
  const [formData, setFormData] = useState<CreateChartOfAccountDto>({
    account_code: '',
    account_name: '',
    account_type: 'Asset',
    description: '',
  });

  // Validation errors
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Fetch all accounts
  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const response = await chartOfAccountsAPI.getAll();
      if (response.success && response.data) {
        setAccounts(response.data);
      }
    } catch (err: any) {
      error(err.message || 'Gagal mengambil data');
      console.error('Error fetching accounts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  // Filter & Search logic
  const filteredAccounts = useMemo(() => {
    let filtered = [...accounts];

    // Apply search
    if (searchQuery) {
      filtered = filtered.filter(
        (acc) =>
          acc.account_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
          acc.account_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (acc.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
      );
    }

    // Apply filter
    if (filterType !== 'all') {
      filtered = filtered.filter((acc) => acc.account_type === filterType);
    }

    return filtered;
  }, [accounts, searchQuery, filterType]);

  // Pagination logic
  const totalPages = Math.ceil(filteredAccounts.length / itemsPerPage);
  const paginatedAccounts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAccounts.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAccounts, currentPage, itemsPerPage]);

  // Validation
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.account_code.trim()) {
      errors.account_code = 'Kode akun wajib diisi';
    } else if (formData.account_code.length < 3) {
      errors.account_code = 'Kode akun minimal 3 karakter';
    }

    if (!formData.account_name.trim()) {
      errors.account_name = 'Nama akun wajib diisi';
    } else if (formData.account_name.length < 3) {
      errors.account_name = 'Nama akun minimal 3 karakter';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Handle create or update
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      error('Mohon perbaiki kesalahan pada form');
      return;
    }

    setLoading(true);

    try {
      if (editingAccount) {
        // Update existing account
        const updateData: UpdateChartOfAccountDto = {
          account_code: formData.account_code,
          account_name: formData.account_name,
          account_type: formData.account_type,
          description: formData.description || undefined,
        };
        await chartOfAccountsAPI.update(editingAccount.id, updateData);
        success('Akun berhasil diperbarui');
      } else {
        // Create new account
        await chartOfAccountsAPI.create(formData);
        success('Akun berhasil ditambahkan');
      }
      
      // Reset form and refresh list
      resetForm();
      fetchAccounts();
      setIsModalOpen(false);
    } catch (err: any) {
      error(err.message || 'Gagal menyimpan data');
      console.error('Error saving account:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle delete
  const handleDeleteClick = (id: number) => {
    setDeleteConfirm({ isOpen: true, accountId: id });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm.accountId) return;

    setLoading(true);
    try {
      await chartOfAccountsAPI.delete(deleteConfirm.accountId);
      success('Akun berhasil dihapus');
      fetchAccounts();
    } catch (err: any) {
      error(err.message || 'Gagal menghapus data');
      console.error('Error deleting account:', err);
    } finally {
      setLoading(false);
      setDeleteConfirm({ isOpen: false, accountId: null });
    }
  };

  // Handle edit
  const handleEdit = (account: ChartOfAccount) => {
    setEditingAccount(account);
    setFormData({
      account_code: account.account_code,
      account_name: account.account_name,
      account_type: account.account_type,
      description: account.description || '',
    });
    setIsModalOpen(true);
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      account_code: '',
      account_name: '',
      account_type: 'Asset',
      description: '',
    });
    setEditingAccount(null);
    setValidationErrors({});
  };

  // Open modal for new account
  const openCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  // Handle export
  const handleExport = (format: 'csv' | 'json') => {
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `coa_${timestamp}`;
    
    if (format === 'csv') {
      exportToCSV(filteredAccounts, `${filename}.csv`);
      success('Data berhasil di-export ke CSV');
    } else {
      exportToJSON(filteredAccounts, `${filename}.json`);
      success('Data berhasil di-export ke JSON');
    }
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Get account type badge color
  const getAccountTypeBadge = (type: string) => {
    const badges = {
      Asset: 'bg-primary-light/10 text-primary-dark border-primary-light/30',
      Liability: 'bg-danger/10 text-danger border-danger/30',
      Equity: 'bg-success/10 text-success border-success/30',
      Revenue: 'bg-accent-gold/20 text-primary-dark border-accent-gold/40',
      Expense: 'bg-warning/10 text-primary-dark border-warning/30',
    };
    return badges[type as keyof typeof badges] || 'bg-surface-bg text-text-secondary border-gray-300';
  };

  return (
    <Layout title="Chart of Accounts">
      {/* Toast Notifications */}
      {toasts.map((toast) => (
        <Toast key={toast.id} message={toast.message} type={toast.type} onClose={() => hideToast(toast.id)} />
      ))}

      {/* Page Header */}
      <div className="mb-6">
        <div className="bg-surface-card rounded-xl shadow-md border border-gray-100 p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-primary-dark">Chart of Accounts</h2>
              <p className="text-text-secondary mt-1">Kelola daftar akun keuangan perusahaan Anda</p>
              <div className="mt-4 flex items-center gap-4 text-sm text-text-primary">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-accent-gold rounded-full animate-pulse"></div>
                  <span>{accounts.length} Total Accounts</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary-light rounded-full"></div>
                  <span>{filteredAccounts.length} Filtered</span>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="relative">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2 px-4 py-2 bg-surface-card text-primary-dark border border-gray-300 rounded-lg hover:bg-surface-bg transition-colors shadow-sm"
                >
                  <ArrowDownTrayIcon className="h-5 w-5" />
                  Export
                </button>
                {showFilters && (
                  <div className="absolute right-0 mt-2 w-40 bg-surface-card rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                    <button
                      onClick={() => {
                        handleExport('csv');
                        setShowFilters(false);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-surface-bg text-sm text-text-primary"
                    >
                      Export CSV
                    </button>
                    <button
                      onClick={() => {
                        handleExport('json');
                        setShowFilters(false);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-surface-bg text-sm text-text-primary"
                    >
                      Export JSON
                    </button>
                  </div>
                )}
              </div>
              <button
                onClick={openCreateModal}
                className="flex items-center gap-2 px-6 py-3 bg-accent-gold text-primary-dark rounded-lg hover:bg-accent-gold-alt transition-colors shadow-md font-semibold"
              >
                <PlusIcon className="h-5 w-5" />
                Tambah Akun Baru
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="mb-6">
        <div className="bg-surface-card rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-text-secondary" />
              <input
                type="text"
                placeholder="Cari kode akun, nama akun, atau deskripsi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-light focus:border-transparent text-text-primary"
              />
            </div>

            {/* Filter by Account Type */}
            <div className="flex items-center gap-2">
              <FunnelIcon className="h-5 w-5 text-text-secondary" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-light focus:border-transparent text-text-primary"
              >
                <option value="all">Semua Tipe</option>
                {ACCOUNT_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Items per page */}
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-light focus:border-transparent text-text-primary"
            >
              <option value={10}>10 per halaman</option>
              <option value={25}>25 per halaman</option>
              <option value={50}>50 per halaman</option>
              <option value={100}>100 per halaman</option>
            </select>
          </div>

          {/* Active Filters Display */}
          {(searchQuery || filterType !== 'all') && (
            <div className="mt-4 flex items-center gap-2 flex-wrap">
              <span className="text-sm text-text-secondary">Filter aktif:</span>
              {searchQuery && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary-light/10 text-primary-dark rounded-full text-sm border border-primary-light/20">
                  Pencarian: "{searchQuery}"
                  <button onClick={() => setSearchQuery('')} className="hover:text-primary-light">
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </span>
              )}
              {filterType !== 'all' && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-accent-gold/20 text-primary-dark rounded-full text-sm border border-accent-gold/30">
                  Tipe: {filterType}
                  <button onClick={() => setFilterType('all')} className="hover:text-accent-gold-alt">
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div>
        <div className="bg-surface-card rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Stats */}
          <div className="px-6 py-4 bg-surface-bg border-b border-gray-200">
            <div className="flex items-center justify-between">
              <p className="text-sm text-text-primary">
                Menampilkan <span className="font-semibold">{paginatedAccounts.length}</span> dari{' '}
                <span className="font-semibold">{filteredAccounts.length}</span> akun
              </p>
              {loading && (
                <div className="flex items-center gap-2 text-sm text-text-secondary">
                  <svg className="animate-spin h-4 w-4 text-primary-light" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Loading...
                </div>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-surface-bg">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                    Kode Akun
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                    Nama Akun
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                    Tipe
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                    Deskripsi
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-text-secondary uppercase tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="bg-surface-card divide-y divide-gray-200">
                {loading && paginatedAccounts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <svg className="animate-spin h-8 w-8 text-primary-light mb-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <p className="text-text-secondary">Memuat data...</p>
                      </div>
                    </td>
                  </tr>
                ) : paginatedAccounts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <svg className="h-12 w-12 text-text-secondary mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                        </svg>
                        <p className="text-text-primary text-lg font-medium">Tidak ada data</p>
                        <p className="text-text-secondary text-sm mt-1">Mulai dengan menambahkan akun baru</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedAccounts.map((account) => (
                    <tr key={account.id} className="hover:bg-surface-bg transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-mono font-medium text-text-primary">{account.account_code}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-text-primary font-medium">{account.account_name}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getAccountTypeBadge(account.account_type)}`}>
                          {account.account_type}
                        </span>
                      </td>
                      <td className="px-6 py-4 max-w-xs">
                        <span className="text-sm text-text-secondary line-clamp-2">
                          {account.description || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(account)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-primary-dark bg-primary-light/10 rounded-lg hover:bg-primary-light/20 transition-colors border border-primary-light/20"
                            title="Edit"
                          >
                            <PencilIcon className="h-4 w-4" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteClick(account.id)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-white bg-danger rounded-lg hover:bg-danger/90 transition-colors"
                            title="Hapus"
                          >
                            <TrashIcon className="h-4 w-4" />
                            Hapus
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 bg-surface-bg border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-text-primary">
                  Halaman <span className="font-semibold">{currentPage}</span> dari{' '}
                  <span className="font-semibold">{totalPages}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1 text-sm text-text-primary border border-gray-300 rounded-lg hover:bg-surface-card disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Sebelumnya
                  </button>
                  
                  {/* Page numbers */}
                  <div className="flex gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                            currentPage === pageNum
                              ? 'bg-accent-gold text-primary-dark font-semibold'
                              : 'border border-gray-300 text-text-primary hover:bg-surface-bg'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 text-sm text-text-primary border border-gray-300 rounded-lg hover:bg-surface-card disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Selanjutnya
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal Form */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          resetForm();
        }}
        title={editingAccount ? 'Edit Akun' : 'Tambah Akun Baru'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Account Code */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">
              Kode Akun <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              name="account_code"
              value={formData.account_code}
              onChange={handleInputChange}
              placeholder="Contoh: 1000, 2000, dll"
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-light focus:border-transparent text-text-primary ${
                validationErrors.account_code ? 'border-danger' : 'border-gray-300'
              }`}
            />
            {validationErrors.account_code && (
              <p className="mt-1 text-sm text-danger">{validationErrors.account_code}</p>
            )}
          </div>

          {/* Account Name */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">
              Nama Akun <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              name="account_name"
              value={formData.account_name}
              onChange={handleInputChange}
              placeholder="Contoh: Kas, Bank, Piutang, dll"
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-light focus:border-transparent text-text-primary ${
                validationErrors.account_name ? 'border-danger' : 'border-gray-300'
              }`}
            />
            {validationErrors.account_name && (
              <p className="mt-1 text-sm text-danger">{validationErrors.account_name}</p>
            )}
          </div>

          {/* Account Type */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">
              Tipe Akun <span className="text-danger">*</span>
            </label>
            <select
              name="account_type"
              value={formData.account_type}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-light focus:border-transparent text-text-primary"
            >
              {ACCOUNT_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">
              Deskripsi
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              placeholder="Deskripsi tambahan untuk akun ini (opsional)"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-light focus:border-transparent resize-none text-text-primary"
            />
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => {
                setIsModalOpen(false);
                resetForm();
              }}
              className="px-4 py-2 text-sm font-medium text-text-primary bg-white border border-gray-300 rounded-lg hover:bg-surface-bg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-light"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-primary-dark bg-accent-gold rounded-lg hover:bg-accent-gold-alt focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-gold disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Menyimpan...
                </span>
              ) : (
                editingAccount ? 'Perbarui' : 'Simpan'
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        title="Konfirmasi Hapus"
        message="Apakah Anda yakin ingin menghapus akun ini? Tindakan ini tidak dapat dibatalkan."
        confirmText="Hapus"
        cancelText="Batal"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteConfirm({ isOpen: false, accountId: null })}
        type="danger"
      />
    </Layout>
  );
};

export default COA;
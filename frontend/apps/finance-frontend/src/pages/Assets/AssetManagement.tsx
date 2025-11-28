import React, { useState, useEffect } from "react";
import {
  BuildingOffice2Icon,
  ComputerDesktopIcon,
  TruckIcon,
  PlusIcon,
  ChartBarIcon,
  CalendarDaysIcon,
  XCircleIcon,
  BanknotesIcon,
} from "@heroicons/react/24/outline";
import { Toast, ConfirmDialog } from "../../components";
import { useToast } from "../../hooks/useToast";

/**
 * FITUR 3.4.E - Asset Management & Depreciation
 * TSD: Fixed Assets Register dengan auto-depreciation
 * Location: /finance/assets
 */

const API_BASE = import.meta.env.VITE_FINANCE_API || 'http://localhost:3001/api';

type AssetCategory = "BUILDING" | "EQUIPMENT" | "VEHICLE" | "FURNITURE" | "COMPUTER";
type AssetStatus = "ACTIVE" | "DISPOSED" | "FULLY_DEPRECIATED";

interface Asset {
  id: number;
  asset_name: string;
  asset_code: string;
  category: AssetCategory;
  acquisition_date: string;
  acquisition_cost: number;
  residual_value: number;
  useful_life_years: number;
  depreciation_method: string;
  current_book_value: number;
  accumulated_depreciation: number;
  status: AssetStatus;
  location?: string;
  notes?: string;
}

interface DepreciationHistory {
  id: number;
  period: string;
  depreciation_expense: number;
  accumulated_depreciation: number;
  book_value: number;
  created_at: string;
}

export default function AssetManagement() {
  const { toasts, hideToast, success: toastSuccess, error: toastError } = useToast();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [depreciationHistory, setDepreciationHistory] = useState<DepreciationHistory[]>([]);
  const [depConfirm, setDepConfirm] = useState<{ open: boolean; assetId: number | null }>({ open: false, assetId: null });

  useEffect(() => {
    fetchAssets();
    fetchSummary();
  }, []);

  const fetchAssets = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/assets`);
      
      if (!response.ok) {
        console.error('API Error:', response.status, response.statusText);
        toastError(`Gagal mengambil data aset: ${response.statusText}`);
        setAssets([]);
        return;
      }
      
      const result = await response.json();
      if (result.success) {
        setAssets(result.data);
      } else {
        toastError(result.message || "Gagal mengambil data aset");
        setAssets([]);
      }
    } catch (error) {
      console.error("Error fetching assets:", error);
      toastError("Gagal mengambil data aset");
      setAssets([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const response = await fetch(`${API_BASE}/assets/summary`);
      
      if (!response.ok) {
        console.error('API Error:', response.status, response.statusText);
        return;
      }
      
      const result = await response.json();
      if (result.success) {
        setSummary(result.data);
      }
    } catch (error) {
      console.error("Error fetching summary:", error);
    }
  };

  const fetchDepreciationHistory = async (assetId: number) => {
    try {
      const response = await fetch(`${API_BASE}/assets/${assetId}`);
      
      if (!response.ok) {
        console.error('API Error:', response.status, response.statusText);
        setDepreciationHistory([]);
        return;
      }
      
      const result = await response.json();
      if (result.success && result.data.depreciation_history) {
        setDepreciationHistory(result.data.depreciation_history);
      } else {
        setDepreciationHistory([]);
      }
    } catch (error) {
      console.error("Error fetching depreciation history:", error);
      setDepreciationHistory([]);
    }
  };

  const handleCreateAsset = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    try {
      const response = await fetch(`${API_BASE}/assets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          asset_name: formData.get("asset_name"),
          asset_code: formData.get("asset_code"),
          category: formData.get("category"),
          acquisition_date: formData.get("acquisition_date"),
          acquisition_cost: parseFloat(formData.get("acquisition_cost") as string),
          residual_value: parseFloat(formData.get("residual_value") as string) || 0,
          useful_life_years: parseInt(formData.get("useful_life_years") as string),
          depreciation_method: formData.get("depreciation_method") || "STRAIGHT_LINE",
          location: formData.get("location"),
          notes: formData.get("notes"),
        }),
      });

      if (!response.ok) {
        toastError(`Gagal menambahkan asset: ${response.statusText}`);
        return;
      }

      const result = await response.json();
      if (result.success) {
        toastSuccess("Asset berhasil ditambahkan!");
        setShowCreateModal(false);
        fetchAssets();
      } else {
        toastError(result.message || "Gagal menambahkan asset");
      }
    } catch (error) {
      console.error("Error creating asset:", error);
      toastError("Gagal menambahkan asset");
    }
  };

  const handleRunDepreciation = async () => {
    try {
      const response = await fetch(`${API_BASE}/assets/depreciation/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          period: new Date().toISOString().substring(0, 7),
        }),
      });

      if (!response.ok) {
        toastError(`Gagal mencatat depresiasi: ${response.statusText}`);
        return;
      }

      const result = await response.json();
      if (result.success) {
        toastSuccess(`Depresiasi berhasil dicatat untuk ${result.data.assetsProcessed} aset!`);
        fetchAssets();
        fetchSummary();
      } else {
        toastError(result.message || "Gagal mencatat depresiasi");
      }
    } catch (error) {
      console.error("Error running depreciation:", error);
      toastError("Gagal mencatat depresiasi");
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("id-ID");
  };

  const getCategoryIcon = (category: AssetCategory) => {
    switch (category) {
      case "BUILDING":
        return <BuildingOffice2Icon className="w-5 h-5" />;
      case "COMPUTER":
        return <ComputerDesktopIcon className="w-5 h-5" />;
      case "VEHICLE":
        return <TruckIcon className="w-5 h-5" />;
      default:
        return <ChartBarIcon className="w-5 h-5" />;
    }
  };

  const getStatusColor = (status: AssetStatus) => {
    switch (status) {
      case "ACTIVE":
        return "bg-primary-dark/10 text-primary-dark border border-primary-dark";
      case "FULLY_DEPRECIATED":
        return "bg-gray-100 text-gray-800";
      case "DISPOSED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Toasts */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((t) => (
          <Toast key={t.id} message={t.message} type={t.type as any} onClose={() => hideToast(t.id)} />
        ))}
      </div>
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-primary-dark to-primary-light rounded-3xl shadow-2xl p-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-accent-gold/30 rounded-full blur-3xl"></div>

        <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
                <BuildingOffice2Icon className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-white drop-shadow-lg">Manajemen Aset Tetap</h1>
            </div>
            <p className="text-white/90 text-lg font-medium drop-shadow">
              🏢 Register aset, perhitungan depresiasi otomatis bulanan
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs bg-white/25 text-white px-3 py-1 rounded-full backdrop-blur-sm font-medium">
                TSD FITUR 3.4.E - Asset Management & Depreciation
              </span>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setDepConfirm({ open: true, assetId: null })}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-accent-gold text-white font-bold shadow-lg hover:shadow-xl hover:bg-primary-dark transition-all duration-200 group"
            >
              <CalendarDaysIcon className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
              Jalankan Depresiasi Bulanan
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-primary-dark font-bold shadow-lg hover:shadow-xl hover:bg-accent-gold hover:text-white transition-all duration-200 group"
            >
              <PlusIcon className="w-5 h-5 group-hover:rotate-90 transition-transform duration-200" />
              Tambah Aset
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Total Assets */}
          <div className="bg-gradient-to-br from-white to-primary-light/10 rounded-2xl shadow-lg p-6 border border-primary-light hover:shadow-2xl hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-primary-dark mb-2">Total Aset</p>
                <p className="text-3xl font-bold text-gray-900">{summary.totalAssets}</p>
                <p className="text-xs text-gray-500 mt-1">Unit</p>
              </div>
              <div className="bg-gradient-to-br from-primary-light to-accent-gold p-4 rounded-2xl shadow-lg">
                <BuildingOffice2Icon className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>

          {/* Acquisition Cost */}
          <div className="bg-gradient-to-br from-white to-accent-gold/10 rounded-2xl shadow-lg p-6 border border-accent-gold hover:shadow-2xl hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-primary-dark mb-2">Nilai Perolehan</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(summary.totalAcquisitionCost).substring(0, 10)}...
                </p>
                <p className="text-xs text-gray-500 mt-1">Total Cost</p>
              </div>
              <div className="bg-gradient-to-br from-accent-gold to-primary-light p-4 rounded-2xl shadow-lg">
                <BanknotesIcon className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>

          {/* Book Value */}
          <div className="bg-gradient-to-br from-white to-primary-dark/10 rounded-2xl shadow-lg p-6 border border-primary-dark hover:shadow-2xl hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-primary-dark mb-2">Nilai Buku</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(summary.totalBookValue).substring(0, 10)}...
                </p>
                <p className="text-xs text-gray-500 mt-1">Current Value</p>
              </div>
              <div className="bg-gradient-to-br from-primary-dark to-primary-light p-4 rounded-2xl shadow-lg">
                <ChartBarIcon className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>

          {/* Accumulated Depreciation */}
          <div className="bg-gradient-to-br from-white to-accent-gold/10 rounded-2xl shadow-lg p-6 border border-accent-gold hover:shadow-2xl hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-primary-dark mb-2">Akumulasi Depresiasi</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(summary.totalAccumulatedDepreciation).substring(0, 10)}...
                </p>
                <p className="text-xs text-gray-500 mt-1">Total Depreciation</p>
              </div>
              <div className="bg-gradient-to-br from-accent-gold to-primary-light p-4 rounded-2xl shadow-lg">
                <CalendarDaysIcon className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assets Table */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-primary-dark to-primary-light px-6 py-4 border-b border-primary-light/20">
          <h2 className="text-lg font-bold text-white">📋 Daftar Aset Tetap</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-primary-dark to-primary-light">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase whitespace-nowrap">🏢 Nama Aset</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase whitespace-nowrap">📦 Kategori</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase whitespace-nowrap">📅 Tgl Perolehan</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-white uppercase whitespace-nowrap">💰 Nilai Buku</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-white uppercase whitespace-nowrap">📉 Akm. Depresiasi</th>
                <th className="px-6 py-4 text-center text-xs font-bold text-white uppercase whitespace-nowrap">🏷️ Status</th>
                <th className="px-6 py-4 text-center text-xs font-bold text-white uppercase whitespace-nowrap">⚡ Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Memuat data aset...</p>
                  </td>
                </tr>
              ) : assets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <BuildingOffice2Icon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-gray-600 font-medium">Belum ada aset terdaftar</p>
                  </td>
                </tr>
              ) : (
                assets.map((asset) => (
                  <tr key={asset.id} className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200 group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {getCategoryIcon(asset.category)}
                        <div>
                          <div className="text-sm font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                            {asset.asset_name}
                          </div>
                          <div className="text-xs text-gray-500">{asset.asset_code}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{asset.category}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(asset.acquisition_date)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-primary-dark">
                      {formatCurrency(asset.current_book_value)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-accent-gold">
                      {formatCurrency(asset.accumulated_depreciation)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(asset.status)}`}>
                        {asset.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedAsset(asset);
                            fetchDepreciationHistory(asset.id);
                            setShowHistoryModal(true);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-primary-light to-accent-gold text-white text-xs font-semibold shadow-md hover:shadow-lg hover:from-accent-gold hover:to-primary-dark transition-all duration-200"
                          title="Lihat Riwayat Depresiasi"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                          Riwayat
                        </button>

                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Depreciation Confirm Dialog */}
      <ConfirmDialog
        isOpen={depConfirm.open}
        onCancel={() => setDepConfirm({ open: false, assetId: null })}
        onConfirm={() => {
          handleRunDepreciation();
          setDepConfirm({ open: false, assetId: null });
        }}
        title="Konfirmasi Depresiasi Bulanan"
        message="Jalankan perhitungan depresiasi untuk SEMUA aset aktif? Tindakan ini akan mencatat histori depresiasi dan jurnal otomatis untuk bulan ini."
        confirmText="Jalankan"
        cancelText="Batal"
        type="warning"
      />

      {/* Create Asset Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-primary-dark to-primary-light p-6 border-b border-primary-light/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-to-br from-accent-gold to-primary-light p-3 rounded-2xl shadow-lg">
                    <PlusIcon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white">Tambah Aset Baru</h3>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-red-500 hover:scale-110 transition-all"
                >
                  <XCircleIcon className="w-7 h-7" />
                </button>
              </div>
            </div>

            <form onSubmit={handleCreateAsset} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Nama Aset *</label>
                  <input
                    type="text"
                    name="asset_name"
                    required
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                    placeholder="Contoh: Gedung Kantor"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Kode Aset</label>
                  <input
                    type="text"
                    name="asset_code"
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                    placeholder="Contoh: BLDG-001"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Kategori *</label>
                  <select
                    name="category"
                    required
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                  >
                    <option value="BUILDING">Building</option>
                    <option value="EQUIPMENT">Equipment</option>
                    <option value="VEHICLE">Vehicle</option>
                    <option value="FURNITURE">Furniture</option>
                    <option value="COMPUTER">Computer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Tanggal Perolehan *</label>
                  <input
                    type="date"
                    name="acquisition_date"
                    required
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Harga Perolehan (Rp) *</label>
                  <input
                    type="number"
                    name="acquisition_cost"
                    required
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                    placeholder="5000000000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Nilai Sisa (Rp)</label>
                  <input
                    type="number"
                    name="residual_value"
                    defaultValue={0}
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                    placeholder="500000000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Masa Manfaat (Tahun) *</label>
                  <input
                    type="number"
                    name="useful_life_years"
                    required
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                    placeholder="20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Metode Depresiasi</label>
                  <select
                    name="depreciation_method"
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                  >
                    <option value="STRAIGHT_LINE">Straight Line</option>
                    <option value="DECLINING_BALANCE">Declining Balance</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Lokasi</label>
                <input
                  type="text"
                  name="location"
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                  placeholder="Jakarta Selatan"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Catatan</label>
                <textarea
                  name="notes"
                  rows={3}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                  placeholder="Catatan tambahan..."
                ></textarea>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-5 py-2.5 border-2 border-gray-300 rounded-xl text-gray-700 font-semibold hover:bg-gray-50 transition-all duration-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary-light to-accent-gold text-white font-bold shadow-md hover:shadow-lg hover:from-accent-gold hover:to-primary-dark transition-all duration-200"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Simpan Aset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Depreciation History Modal */}
      {showHistoryModal && selectedAsset && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-primary-dark to-primary-light p-6 border-b border-primary-light/20">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-white">{selectedAsset.asset_name}</h3>
                  <p className="text-sm text-accent-gold mt-1">Histori Depresiasi</p>
                </div>
                <button
                  onClick={() => setShowHistoryModal(false)}
                  className="text-gray-400 hover:text-red-500 hover:scale-110 transition-all"
                >
                  <XCircleIcon className="w-7 h-7" />
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* Asset Info */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-primary-light/10 rounded-xl p-4 border border-primary-light">
                  <p className="text-xs font-semibold text-primary-dark mb-1">Harga Perolehan</p>
                  <p className="text-lg font-bold text-gray-900">{formatCurrency(selectedAsset.acquisition_cost)}</p>
                </div>
                <div className="bg-primary-dark/10 rounded-xl p-4 border border-primary-dark">
                  <p className="text-xs font-semibold text-primary-dark mb-1">Nilai Buku Saat Ini</p>
                  <p className="text-lg font-bold text-gray-900">{formatCurrency(selectedAsset.current_book_value)}</p>
                </div>
                <div className="bg-accent-gold/10 rounded-xl p-4 border border-accent-gold">
                  <p className="text-xs font-semibold text-primary-dark mb-1">Akumulasi Depresiasi</p>
                  <p className="text-lg font-bold text-gray-900">{formatCurrency(selectedAsset.accumulated_depreciation)}</p>
                </div>
              </div>

              {/* History Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-800 uppercase">Periode</th>
                      <th className="px-4 py-3 text-right text-xs font-bold text-gray-800 uppercase">Beban Depresiasi</th>
                      <th className="px-4 py-3 text-right text-xs font-bold text-gray-800 uppercase">Akm. Depresiasi</th>
                      <th className="px-4 py-3 text-right text-xs font-bold text-gray-800 uppercase">Nilai Buku</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {depreciationHistory.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                          Belum ada histori depresiasi
                        </td>
                      </tr>
                    ) : (
                      depreciationHistory.map((history) => (
                        <tr key={history.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-semibold text-gray-900">{history.period}</td>
                          <td className="px-4 py-3 text-sm font-semibold text-accent-gold text-right">
                            {formatCurrency(history.depreciation_expense)}
                          </td>
                          <td className="px-4 py-3 text-sm font-semibold text-red-600 text-right">
                            {formatCurrency(history.accumulated_depreciation)}
                          </td>
                          <td className="px-4 py-3 text-sm font-semibold text-primary-dark text-right">
                            {formatCurrency(history.book_value)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

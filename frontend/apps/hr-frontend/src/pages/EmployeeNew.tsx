
import React, { useState } from 'react';
import Layout from '../components/Layout';
import { ChevronRight, ChevronLeft, User, DollarSign, Shield, Plus, X } from 'lucide-react';

interface Allowance {
  name: string;
  amount: number;
}

export default function EmployeeNew() {
  const [currentStep, setCurrentStep] = useState(1);
  const [form, setForm] = useState({
    full_name: '',
    position: '',
    hire_date: '',
    basic_salary: '',
    email: '',
    password: '',
    roles: ['EMPLOYEE'] as string[],
  });
  const [allowances, setAllowances] = useState<Allowance[]>([]);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const steps = [
    { id: 1, title: 'Data Karyawan', icon: User },
    { id: 2, title: 'Tunjangan', icon: DollarSign },
    { id: 3, title: 'Akun Karyawan', icon: Shield },
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'roles') {
      setForm({ ...form, roles: [value] });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const addAllowance = () => {
    setAllowances([...allowances, { name: '', amount: 0 }]);
  };

  const updateAllowance = (index: number, field: 'name' | 'amount', value: string | number) => {
    const updated = [...allowances];
    updated[index] = { ...updated[index], [field]: value };
    setAllowances(updated);
  };

  const removeAllowance = (index: number) => {
    setAllowances(allowances.filter((_, i) => i !== index));
  };

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    setError(null);
    try {
      // Convert allowances array to object
      const allowancesObj = allowances.reduce((acc, curr) => {
        if (curr.name && curr.amount > 0) {
          acc[curr.name] = curr.amount;
        }
        return acc;
      }, {} as Record<string, number>);

      const payload = {
        employee: {
          full_name: form.full_name,
          position: form.position,
          hire_date: form.hire_date,
          basic_salary: parseFloat(form.basic_salary),
          allowances: allowancesObj,
        },
        user: {
          email: form.email,
          password: form.password,
          roles: form.roles,
        },
        email: form.email,
      };

      const res = await fetch('http://localhost:3002/api/v1/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      setSaving(false);
      if (res.ok) {
        setSuccess(true);
        setForm({
          full_name: '', position: '', hire_date: '', basic_salary: '', email: '', password: '', roles: ['EMPLOYEE']
        });
        setAllowances([]);
        setCurrentStep(1);
      } else {
        const err = await res.json();
        setError(err.message || 'Gagal menambah karyawan');
      }
    } catch (e: any) {
      setSaving(false);
      setError(e.message || 'Gagal menambah karyawan');
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <label className="block mb-2 text-blue-900 font-semibold">Nama Lengkap *</label>
              <input
                name="full_name"
                value={form.full_name}
                onChange={handleChange}
                required
                className="w-full border border-blue-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-blue-900 bg-blue-50 placeholder:text-blue-400 transition-all duration-200"
                placeholder="Masukkan nama lengkap"
              />
            </div>
            <div>
              <label className="block mb-2 text-blue-900 font-semibold">Jabatan *</label>
              <input
                name="position"
                value={form.position}
                onChange={handleChange}
                required
                className="w-full border border-blue-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-blue-900 bg-blue-50 placeholder:text-blue-400 transition-all duration-200"
                placeholder="Contoh: Software Engineer, Manager HR"
              />
            </div>
            <div>
              <label className="block mb-2 text-blue-900 font-semibold">Tanggal Masuk Kerja *</label>
              <input
                name="hire_date"
                type="date"
                value={form.hire_date}
                onChange={handleChange}
                required
                className="w-full border border-blue-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-blue-900 bg-blue-50 transition-all duration-200"
              />
            </div>
            <div>
              <label className="block mb-2 text-blue-900 font-semibold">Gaji Pokok *</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-blue-500 font-medium">Rp</span>
                <input
                  name="basic_salary"
                  type="number"
                  value={form.basic_salary}
                  onChange={handleChange}
                  required
                  className="w-full border border-blue-200 rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-blue-900 bg-blue-50 placeholder:text-blue-400 transition-all duration-200"
                  placeholder="0"
                />
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">Tunjangan Karyawan</h3>
              <p className="text-blue-600 text-sm">Tambahkan tunjangan yang diberikan kepada karyawan</p>
            </div>

            {allowances.length === 0 ? (
              <div className="text-center py-8">
                <DollarSign className="w-12 h-12 text-blue-300 mx-auto mb-4" />
                <p className="text-blue-600 mb-4">Belum ada tunjangan yang ditambahkan</p>
                <button
                  type="button"
                  onClick={addAllowance}
                  className="inline-flex items-center px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors duration-200"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Tambah Tunjangan
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {allowances.map((allowance, index) => (
                  <div key={index} className="flex items-center space-x-3 p-4 bg-blue-50 rounded-xl">
                    <div className="flex-1">
                      <input
                        type="text"
                        placeholder="Nama tunjangan (contoh: Transport)"
                        value={allowance.name}
                        onChange={(e) => updateAllowance(index, 'name', e.target.value)}
                        className="w-full border border-blue-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-blue-900 bg-white"
                      />
                    </div>
                    <div className="flex-1">
                      <input
                        type="number"
                        placeholder="Jumlah"
                        value={allowance.amount || ''}
                        onChange={(e) => updateAllowance(index, 'amount', parseFloat(e.target.value) || 0)}
                        className="w-full border border-blue-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-blue-900 bg-white"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeAllowance(index)}
                      className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors duration-200"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addAllowance}
                  className="w-full py-3 border-2 border-dashed border-blue-300 text-blue-600 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-colors duration-200 flex items-center justify-center"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Tambah Tunjangan Lain
                </button>
              </div>
            )}
          </div>
        );
      case 3:
        return (
          <div className="space-y-6">
            <div>
              <label className="block mb-2 text-blue-900 font-semibold">Email Akun *</label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                required
                className="w-full border border-blue-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-blue-900 bg-blue-50 placeholder:text-blue-400 transition-all duration-200"
                placeholder="email@company.com"
              />
            </div>
            <div>
              <label className="block mb-2 text-blue-900 font-semibold">Password *</label>
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                required
                className="w-full border border-blue-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-blue-900 bg-blue-50 placeholder:text-blue-400 transition-all duration-200"
                placeholder="Minimal 8 karakter"
              />
            </div>
            <div>
              <label className="block mb-2 text-blue-900 font-semibold">Role Sistem *</label>
              <select
                name="roles"
                value={form.roles[0]}
                onChange={handleChange}
                className="w-full border border-blue-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-blue-900 bg-blue-50 transition-all duration-200"
              >
                <option value="EMPLOYEE">Employee</option>
                <option value="HR_ADMIN">HR Admin</option>
                <option value="FINANCE_ADMIN">Finance Admin</option>
                <option value="PROJECT_MANAGER">Project Manager</option>
                <option value="PROJECT_ENGINEER">Project Engineer</option>
                <option value="SALES">Sales</option>
                <option value="SALES_MANAGER">Sales Manager</option>
                <option value="PROCUREMENT_ADMIN">Procurement Admin</option>
                <option value="ASSET_ADMIN">Asset Admin</option>
                <option value="SYSTEM_ADMIN">System Admin</option>
                <option value="CEO">CEO</option>
              </select>
              <p className="text-xs text-blue-600 mt-1">Role menentukan akses sistem untuk karyawan</p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <img src="/logo-unais.png" alt="Logo Unais" className="w-16 h-16 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-blue-900 mb-2">Tambah Karyawan Baru</h1>
            <p className="text-blue-600">Lengkapi data karyawan dengan informasi yang akurat</p>
          </div>

          {/* Stepper */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => {
                const Icon = step.icon;
                const isActive = currentStep === step.id;
                const isCompleted = currentStep > step.id;

                return (
                  <div key={step.id} className="flex items-center">
                    <div className={`flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300 ${
                      isCompleted
                        ? 'bg-green-500 text-white'
                        : isActive
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 text-gray-500'
                    }`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="ml-3">
                      <p className={`text-sm font-medium ${isActive ? 'text-blue-900' : 'text-gray-500'}`}>
                        {step.title}
                      </p>
                    </div>
                    {index < steps.length - 1 && (
                      <ChevronRight className={`w-5 h-5 mx-4 ${isCompleted ? 'text-green-500' : 'text-gray-300'}`} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-blue-100">
            <form onSubmit={handleSubmit}>
              {renderStepContent()}

              {/* Navigation Buttons */}
              <div className="flex justify-between mt-8 pt-6 border-t border-blue-100">
                <button
                  type="button"
                  onClick={prevStep}
                  disabled={currentStep === 1}
                  className="flex items-center px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Sebelumnya
                </button>

                {currentStep < steps.length ? (
                  <button
                    type="button"
                    onClick={nextStep}
                    className="flex items-center px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-colors duration-200"
                  >
                    Selanjutnya
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center px-8 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                        Menyimpan...
                      </>
                    ) : (
                      <>
                        <Shield className="w-4 h-4 mr-2" />
                        Simpan Karyawan
                      </>
                    )}
                  </button>
                )}
              </div>
            </form>

            {/* Success/Error Messages */}
            {success && (
              <div className="mt-6 bg-green-50 border border-green-200 text-green-800 px-6 py-4 rounded-xl text-center font-semibold animate-fade-in">
                ✓ Data karyawan berhasil ditambahkan!
              </div>
            )}
            {error && (
              <div className="mt-6 bg-red-50 border border-red-200 text-red-800 px-6 py-4 rounded-xl text-center font-semibold animate-fade-in">
                ✗ {error}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

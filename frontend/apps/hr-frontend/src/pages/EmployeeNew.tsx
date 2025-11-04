import React, { useMemo, useState } from 'react';
import Layout from '../components/Layout';
import { ChevronRight, ChevronLeft, User, DollarSign, Shield, Plus, X } from 'lucide-react';
import { PTKP_OPTIONS, isValidNpwp, normalizeNpwp, sumAllowancesFromArray, estimatePPh21Monthly, formatCurrencyID } from '../utils/tax';
import { AllowanceCategoryLabels } from '../enums/employeeEnums';

interface Allowance {
  name: string;
  amount: number;
}

type Props = { onClose?: () => void };

export default function EmployeeNew({ onClose }: Props) {
  const [currentStep, setCurrentStep] = useState(1);
  const [allowances, setAllowances] = useState<Allowance[]>([]);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [npwpError, setNpwpError] = useState<string | null>(null);

  const [form, setForm] = useState({
    // Tab 1: Personal Information
    full_name: '',
    ktp_number: '',
    address: '',
    phone: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    gender: '',
    marital_status: '',
    blood_type: '',
    education_level: '',
    // Tab 2: Employment Information
    position: '',
    department: '',
    hire_date: '',
    employment_type: 'FULL_TIME',
    status: 'ACTIVE',
    contract_end_date: '',
    // Tab 3: Compensation
    basic_salary: '',
    // Tab 4: Account & Tax
    bank_name: '',
    bank_account_number: '',
  npwp: '',
  ptkp: 'TK/0',
    // Tab 5: System Account
    email: '',
    password: '',
    roles: ['EMPLOYEE'] as string[],
  });

  const steps = [
    { id: 1, title: 'Personal Information', icon: User },
    { id: 2, title: 'Employment Information', icon: User },
    { id: 3, title: 'Compensation & Allowances', icon: DollarSign },
    { id: 4, title: 'Account & Tax Information', icon: Shield },
    { id: 5, title: 'System Account', icon: Shield },
  ];

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    if (name === 'roles') {
      setForm((prev) => ({ ...prev, roles: [value] }));
    } else if (name === 'npwp') {
      const next = value;
      setForm((prev) => ({ ...prev, npwp: next }));
      setNpwpError(isValidNpwp(next) ? null : 'Invalid NPWP format. Example: 00.000.000.0-000.000');
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const addAllowance = () => setAllowances((prev) => [...prev, { name: '', amount: 0 }]);
  const updateAllowance = (index: number, field: 'name' | 'amount', value: string | number) => {
    setAllowances((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value } as Allowance;
      return updated;
    });
  };
  const removeAllowance = (index: number) => setAllowances((prev) => prev.filter((_, i) => i !== index));

  const nextStep = () => setCurrentStep((s) => Math.min(s + 1, steps.length));
  const prevStep = () => setCurrentStep((s) => Math.max(s - 1, 1));

  // Derived values for tax estimator
  const totalAllowances = useMemo(() => sumAllowancesFromArray(allowances), [allowances]);
  const basicSalaryNumber = useMemo(() => {
    const raw = String(form.basic_salary || '');
    const normalized = raw.replace(/\./g, '').replace(/,/g, '.');
    const n = parseFloat(normalized);
    return isNaN(n) ? 0 : n;
  }, [form.basic_salary]);
  const monthlyTaxEstimate = useMemo(
    () => estimatePPh21Monthly(basicSalaryNumber, totalAllowances, form.ptkp || 'TK/0', !!form.npwp && isValidNpwp(form.npwp)),
    [basicSalaryNumber, totalAllowances, form.ptkp, form.npwp]
  );
  const brutoMonthly = useMemo(() => basicSalaryNumber + totalAllowances, [basicSalaryNumber, totalAllowances]);
  const takeHomeMonthly = useMemo(() => Math.max(0, brutoMonthly - monthlyTaxEstimate), [brutoMonthly, monthlyTaxEstimate]);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    setError(null);
    if (npwpError) {
      setSaving(false);
      setError('Please check NPWP format');
      return;
    }
    try {
      const allowancesObj = allowances.reduce((acc, curr) => {
        if (curr.name && curr.amount > 0) acc[curr.name] = curr.amount;
        return acc;
      }, {} as Record<string, number>);

      const basicSalary = parseFloat(form.basic_salary);
      if (isNaN(basicSalary) || basicSalary < 0) {
        setSaving(false);
        setError('Basic salary must be filled and must be a number');
        return;
      }

      // Build employee object, only include non-empty optional fields
      const employeeData: any = {
        full_name: form.full_name,
        position: form.position,
        hire_date: form.hire_date,
        basic_salary: basicSalary,
        allowances: allowancesObj,
      };

  // Add optional fields only if they have values
      if (form.department && form.department.trim()) employeeData.department = form.department;
      if (form.gender && form.gender.trim()) employeeData.gender = form.gender;
      if (form.marital_status && form.marital_status.trim()) employeeData.marital_status = form.marital_status;
      if (form.blood_type && form.blood_type.trim()) employeeData.blood_type = form.blood_type;
      if (form.employment_type && form.employment_type.trim()) employeeData.employment_type = form.employment_type;
      if (form.status && form.status.trim()) employeeData.status = form.status;
      if (form.education_level && form.education_level.trim()) employeeData.education_level = form.education_level;
      if (form.bank_name && form.bank_name.trim()) employeeData.bank_name = form.bank_name;
      if (form.bank_account_number && form.bank_account_number.trim()) employeeData.bank_account_number = form.bank_account_number;
  if (form.npwp && form.npwp.trim()) employeeData.npwp = normalizeNpwp(form.npwp);
  // Always send PTKP; default to TK/0 for persistence so detail view doesn't show '-'
  employeeData.ptkp = (form.ptkp && form.ptkp.trim()) ? form.ptkp : 'TK/0';

      const payload = {
        employee: employeeData,
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
          full_name: '', ktp_number: '', address: '', phone: '', emergency_contact_name: '', emergency_contact_phone: '',
          gender: '', marital_status: '', blood_type: '', education_level: '',
          position: '', department: '', hire_date: '', employment_type: 'FULL_TIME', status: 'ACTIVE', contract_end_date: '',
          basic_salary: '', bank_name: '', bank_account_number: '', npwp: '', ptkp: 'TK/0', email: '', password: '', roles: ['EMPLOYEE']
        });
        setAllowances([]);
        setCurrentStep(1);
        setTimeout(() => { if (onClose) onClose(); }, 1500);
      } else {
        const err = await res.json().catch(() => null);
        const msg = err?.message || 'Failed to add employee';
        const joined = err?.errors && Array.isArray(err.errors) ? `${msg}: ${err.errors.join(', ')}` : msg;
        setError(joined);
      }
    } catch (e: any) {
      setSaving(false);
      setError(e?.message || 'Failed to add employee');
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <label className="block mb-2 text-blue-900 font-semibold">Full Name <span className="text-red-500">*</span></label>
              <input name="full_name" value={form.full_name} onChange={handleChange} required className="w-full border border-blue-200 rounded-xl px-4 py-3 bg-blue-50" placeholder="Full name" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-2 text-blue-900 font-semibold">ID Card Number</label>
                <input name="ktp_number" value={form.ktp_number} onChange={handleChange} className="w-full border border-blue-200 rounded-xl px-4 py-3 bg-blue-50" />
              </div>
              <div>
                <label className="block mb-2 text-blue-900 font-semibold">Phone Number</label>
                <input name="phone" value={form.phone} onChange={handleChange} className="w-full border border-blue-200 rounded-xl px-4 py-3 bg-blue-50" />
              </div>
            </div>
            <div>
              <label className="block mb-2 text-blue-900 font-semibold">Address</label>
              <textarea name="address" value={form.address} onChange={handleChange} className="w-full border border-blue-200 rounded-xl px-4 py-3 bg-blue-50" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-2 text-blue-900 font-semibold">Emergency Contact - Name</label>
                <input name="emergency_contact_name" value={form.emergency_contact_name} onChange={handleChange} className="w-full border border-blue-200 rounded-xl px-4 py-3 bg-blue-50" />
              </div>
              <div>
                <label className="block mb-2 text-blue-900 font-semibold">Emergency Contact - Phone</label>
                <input name="emergency_contact_phone" value={form.emergency_contact_phone} onChange={handleChange} className="w-full border border-blue-200 rounded-xl px-4 py-3 bg-blue-50" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block mb-2 text-blue-900 font-semibold">Gender</label>
                <select name="gender" value={form.gender} onChange={handleChange} className="w-full border border-blue-200 rounded-xl px-4 py-3 bg-blue-50">
                  <option value="">(select)</option>
                  <option value="MALE">MALE</option>
                  <option value="FEMALE">FEMALE</option>
                  <option value="OTHER">OTHER</option>
                </select>
              </div>
              <div>
                <label className="block mb-2 text-blue-900 font-semibold">Marital Status</label>
                <select name="marital_status" value={form.marital_status} onChange={handleChange} className="w-full border border-blue-200 rounded-xl px-4 py-3 bg-blue-50">
                  <option value="">(select)</option>
                  <option value="SINGLE">SINGLE</option>
                  <option value="MARRIED">MARRIED</option>
                  <option value="DIVORCED">DIVORCED</option>
                  <option value="WIDOWED">WIDOWED</option>
                </select>
              </div>
              <div>
                <label className="block mb-2 text-blue-900 font-semibold">Blood Type</label>
                <select name="blood_type" value={form.blood_type} onChange={handleChange} className="w-full border border-blue-200 rounded-xl px-4 py-3 bg-blue-50">
                  <option value="">Select Blood Type</option>
                  <option value="A_POSITIVE">A+</option>
                  <option value="A_NEGATIVE">A-</option>
                  <option value="B_POSITIVE">B+</option>
                  <option value="B_NEGATIVE">B-</option>
                  <option value="AB_POSITIVE">AB+</option>
                  <option value="AB_NEGATIVE">AB-</option>
                  <option value="O_POSITIVE">O+</option>
                  <option value="O_NEGATIVE">O-</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block mb-2 text-blue-900 font-semibold">Education Level</label>
              <select name="education_level" value={form.education_level} onChange={handleChange} className="w-full border border-blue-200 rounded-xl px-4 py-3 bg-blue-50">
                <option value="">(select)</option>
                <option value="HIGH_SCHOOL">HIGH_SCHOOL</option>
                <option value="DIPLOMA">DIPLOMA</option>
                <option value="BACHELOR">BACHELOR</option>
                <option value="MASTER">MASTER</option>
                <option value="DOCTORATE">DOCTORATE</option>
              </select>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-2 text-blue-900 font-semibold">Job Title/Position <span className="text-red-500">*</span></label>
                <input name="position" value={form.position} onChange={handleChange} required className="w-full border border-blue-200 rounded-xl px-4 py-3 bg-blue-50" placeholder="Example: HR Officer" />
              </div>
              <div>
                <label className="block mb-2 text-blue-900 font-semibold">Department</label>
                <input name="department" value={form.department} onChange={handleChange} className="w-full border border-blue-200 rounded-xl px-4 py-3 bg-blue-50" placeholder="Example: HR" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block mb-2 text-blue-900 font-semibold">Hire Date <span className="text-red-500">*</span></label>
                <input type="date" name="hire_date" value={form.hire_date} onChange={handleChange} required className="w-full border border-blue-200 rounded-xl px-4 py-3 bg-blue-50" />
              </div>
              <div>
                <label className="block mb-2 text-blue-900 font-semibold">Employment Type</label>
                <select name="employment_type" value={form.employment_type} onChange={handleChange} className="w-full border border-blue-200 rounded-xl px-4 py-3 bg-blue-50">
                  <option value="FULL_TIME">PKWTT (FULL_TIME)</option>
                  <option value="CONTRACT">PKWT (CONTRACT)</option>
                  <option value="FREELANCE">FREELANCE</option>
                  <option value="PART_TIME">PART_TIME</option>
                  <option value="INTERN">INTERN</option>
                </select>
              </div>
              <div>
                <label className="block mb-2 text-blue-900 font-semibold">Status</label>
                <select name="status" value={form.status} onChange={handleChange} className="w-full border border-blue-200 rounded-xl px-4 py-3 bg-blue-50">
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                  <option value="TERMINATED">TERMINATED</option>
                  <option value="ON_LEAVE">ON_LEAVE</option>
                  <option value="PROBATION">PROBATION</option>
                </select>
              </div>
            </div>
            {form.employment_type === 'CONTRACT' && (
              <div>
                <label className="block mb-2 text-blue-900 font-semibold">Contract End Date</label>
                <input type="date" name="contract_end_date" value={form.contract_end_date} onChange={handleChange} className="w-full border border-blue-200 rounded-xl px-4 py-3 bg-blue-50" />
              </div>
            )}
          </div>
        );
      case 3:
        return (
          <div className="space-y-6">
            <div>
              <label className="block mb-2 text-blue-900 font-semibold">Basic Salary <span className="text-red-500">*</span></label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500 font-medium">Rp</span>
                <input name="basic_salary" type="number" value={form.basic_salary} onChange={handleChange} required className="w-full border border-blue-200 rounded-xl pl-12 pr-4 py-3 bg-blue-50" placeholder="0" />
              </div>
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">Employee Allowances</h3>
              <p className="text-blue-600 text-sm">Add allowances given to the employee</p>
            </div>
            <div className="space-y-4">
              {allowances.length === 0 && (
                <div className="text-center py-8">
                  <DollarSign className="w-12 h-12 text-blue-300 mx-auto mb-4" />
                  <p className="text-blue-600 mb-4">No allowances added yet</p>
                </div>
              )}
              {allowances.map((allowance, index) => (
                <div key={index} className="flex items-center space-x-3 p-4 bg-blue-50 rounded-xl">
                  <div className="flex-1">
                    <select 
                      value={allowance.name} 
                      onChange={(e) => updateAllowance(index, 'name', e.target.value)} 
                      className="w-full border border-blue-200 rounded-lg px-3 py-2 bg-white"
                    >
                      <option value="">Select allowance type</option>
                      {Object.entries(AllowanceCategoryLabels).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-1">
                    <input type="number" placeholder="Amount" value={allowance.amount || ''} onChange={(e) => updateAllowance(index, 'amount', parseFloat(e.target.value) || 0)} className="w-full border border-blue-200 rounded-lg px-3 py-2 bg-white" />
                  </div>
                  <button type="button" onClick={() => removeAllowance(index)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ))}
              <button type="button" onClick={addAllowance} className="w-full py-3 border-2 border-dashed border-blue-300 text-blue-600 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-colors duration-200 flex items-center justify-center">
                <Plus className="w-5 h-5 mr-2" />
                Add Another Allowance
              </button>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <Shield className="w-12 h-12 text-blue-500 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-blue-900">Account & Tax Information</h3>
              <p className="text-sm text-gray-600 mt-1">Employee bank account and tax data</p>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 space-y-4">
              <h4 className="font-semibold text-blue-900 mb-3">Bank Account Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-2 text-blue-900 font-medium">Bank Name</label>
                  <input 
                    name="bank_name" 
                    value={form.bank_name} 
                    onChange={handleChange} 
                    className="w-full border border-blue-200 rounded-lg px-4 py-2.5 bg-white focus:ring-2 focus:ring-blue-400 focus:border-transparent" 
                    placeholder="Example: BCA, Mandiri"
                  />
                </div>
                <div>
                  <label className="block mb-2 text-blue-900 font-medium">Account Number</label>
                  <input 
                    name="bank_account_number" 
                    value={form.bank_account_number} 
                    onChange={handleChange} 
                    className="w-full border border-blue-200 rounded-lg px-4 py-2.5 bg-white focus:ring-2 focus:ring-blue-400 focus:border-transparent" 
                    placeholder="Bank account number"
                  />
                </div>
              </div>
            </div>
            
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 space-y-4">
              <h4 className="font-semibold text-amber-900 mb-3">Tax Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-2 text-amber-900 font-medium">NPWP</label>
                  <input 
                    name="npwp" 
                    value={form.npwp} 
                    onChange={handleChange} 
                    className={`w-full border rounded-lg px-4 py-2.5 bg-white focus:ring-2 focus:ring-amber-400 focus:border-transparent ${npwpError ? 'border-red-400' : 'border-amber-200'}`} 
                    placeholder="00.000.000.0-000.000"
                  />
                  {npwpError ? (
                    <p className="text-xs text-red-600 mt-1">{npwpError}</p>
                  ) : (
                    <p className="text-xs text-amber-700 mt-1">Optional. Without NPWP, PPh21 estimate increases by 20%.</p>
                  )}
                </div>
                <div>
                  <label className="block mb-2 text-amber-900 font-medium">PTKP Status</label>
                  <select
                    name="ptkp"
                    value={form.ptkp}
                    onChange={handleChange}
                    className="w-full border border-amber-200 rounded-lg px-4 py-2.5 bg-white focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                  >
                    <option value="">Select PTKP status</option>
                    {PTKP_OPTIONS.map((opt) => (
                      <option key={opt.code} value={opt.code}>{opt.label}</option>
                    ))}
                  </select>
                  <p className="text-xs text-amber-700 mt-1">PTKP reduces tax base. If empty, TK/0 is assumed for estimation.</p>
                </div>
              </div>
              {/* Estimator */}
              <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="rounded-lg bg-white border border-amber-200 p-3">
                  <p className="text-xs text-amber-700">Gross / month</p>
                  <p className="text-base font-semibold text-amber-900">{formatCurrencyID(brutoMonthly)}</p>
                </div>
                <div className="rounded-lg bg-white border border-amber-200 p-3">
                  <p className="text-xs text-amber-700">PPh21 estimate / month</p>
                  <p className="text-base font-semibold text-amber-900">{formatCurrencyID(monthlyTaxEstimate)}</p>
                </div>
                <div className="rounded-lg bg-white border border-amber-200 p-3">
                  <p className="text-xs text-amber-700">Take Home Pay (estimate)</p>
                  <p className="text-base font-semibold text-amber-900">{formatCurrencyID(takeHomeMonthly)}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-xs text-gray-600">
                <strong>Info:</strong> This data will be stored in the database and can be used for payroll and tax calculations.
              </p>
            </div>
          </div>
        );
      case 5:
        return (
          <div className="space-y-6">
            <div>
              <label className="block mb-2 text-blue-900 font-semibold">Account Email <span className="text-red-500">*</span></label>
              <input name="email" type="email" value={form.email} onChange={handleChange} required className="w-full border border-blue-200 rounded-xl px-4 py-3 bg-blue-50" placeholder="email@company.com" />
            </div>
            <div>
              <label className="block mb-2 text-blue-900 font-semibold">Password <span className="text-red-500">*</span></label>
              <input name="password" type="password" value={form.password} onChange={handleChange} required className="w-full border border-blue-200 rounded-xl px-4 py-3 bg-blue-50" placeholder="Minimum 8 characters" />
            </div>
            <div>
              <label className="block mb-2 text-blue-900 font-semibold">System Role <span className="text-red-500">*</span></label>
              <select name="roles" value={form.roles[0]} onChange={handleChange} className="w-full border border-blue-200 rounded-xl px-4 py-3 bg-blue-50">
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
              <p className="text-xs text-blue-600 mt-1">Role determines system access for the employee</p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
              <p className="text-sm text-blue-900 font-medium mb-2">ℹ️ Account Information</p>
              <p className="text-xs text-blue-700">
                After the employee is saved, the account will be automatically created and the employee can log in using the email and password provided.
              </p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  // Wrapper: modal overlay if onClose provided; otherwise full page
  const content = (
    <div className="relative w-full max-w-4xl mx-auto bg-white rounded-xl shadow-2xl border border-blue-100 overflow-hidden" style={{ height: '90vh', display: 'flex', flexDirection: 'column' }}>
      {/* Back button - always visible at top left */}
      <button 
        onClick={onClose || (() => window.history.back())} 
        className="absolute top-4 left-4 z-20 bg-white hover:bg-gray-50 text-gray-600 hover:text-blue-600 rounded-full p-2 shadow border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all" 
        title="Back"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      
      {/* Header - Fixed */}
      <div className="flex-shrink-0 text-center pt-8 pb-3 px-6 bg-white border-b border-gray-100">
        <h1 className="text-xl font-bold text-blue-900 mb-1">Add New Employee</h1>
        <p className="text-blue-600 text-sm">Complete employee data with accurate information</p>
      </div>
      
      {/* Step indicator - Fixed */}
      <div className="flex-shrink-0 px-6 py-3 bg-gray-50 border-b border-gray-200">
        <div className="max-w-2xl mx-auto">
          {/* Active step with icon */}
          <div className="flex items-center justify-center gap-2 mb-2">
            {(() => {
              const ActiveIcon = steps[currentStep - 1].icon;
              return (
                <>
                  <div className="flex items-center justify-center w-9 h-9 rounded-full bg-blue-600 text-white shadow">
                    <ActiveIcon className="w-5 h-5" />
                  </div>
                  <h2 className="text-base font-bold text-blue-900">{steps[currentStep - 1].title}</h2>
                </>
              );
            })()}
          </div>
          
          {/* Progress dots */}
          <div className="flex items-center justify-center gap-2">
            {steps.map((step) => {
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              return (
                <div
                  key={step.id}
                  className={`transition-all duration-300 rounded-full ${
                    isCompleted
                      ? 'w-3 h-3 bg-green-500'
                      : isActive
                      ? 'w-10 h-3 bg-blue-600'
                      : 'w-3 h-3 bg-gray-300'
                  }`}
                />
              );
            })}
          </div>
        </div>
      </div>
      {/* Form content - Scrollable middle section */}
      <div className="flex-1 overflow-y-auto bg-white">
        <form onSubmit={handleSubmit} className="h-full flex flex-col">
          {/* Scrollable form content */}
          <div className="flex-1 px-6 py-4">
            {renderStepContent()}
          </div>
          
          {/* Fixed bottom navigation */}
          <div className="flex-shrink-0 bg-white border-t border-gray-200 px-6 py-3 shadow-lg sticky bottom-0">
            <div className="flex justify-between items-center">
              <button 
                type="button" 
                onClick={prevStep} 
                disabled={currentStep === 1} 
                className="flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Previous
              </button>
              
              {currentStep < steps.length ? (
                <button 
                  type="button" 
                  onClick={nextStep} 
                  className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-sm transition-colors shadow"
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </button>
              ) : (
                <button 
                  type="submit" 
                  disabled={saving} 
                  className="flex items-center px-6 py-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Shield className="w-4 h-4 mr-2" />
                      Save Employee
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </form>
        
        {/* Success/Error messages */}
        {success && (
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2 bg-green-50 border border-green-300 text-green-800 px-4 py-2 rounded-lg text-center text-sm font-semibold shadow-xl z-30 animate-fade-in">
            ✓ Employee data successfully added!
          </div>
        )}
        {error && (
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2 bg-red-50 border border-red-300 text-red-800 px-4 py-2 rounded-lg text-center text-sm font-semibold shadow-xl z-30 animate-fade-in max-w-md">
            {error}
          </div>
        )}
      </div>
    </div>
  );

  if (onClose) {
    return (
      <>
        <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose}></div>
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-auto">
          {content}
        </div>
      </>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-[#F4F4F4] px-2 py-8">{content}</div>
    </Layout>
  );
}
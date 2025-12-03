import React, { useEffect, useState } from 'react';
import { Trash2, ArrowLeft } from 'lucide-react';
import Select from 'react-select';
import {
  GenderLabels,
  MaritalStatusLabels,
  BloodTypeLabels,
  EducationLevelLabels,
  EmploymentTypeLabels,
  EmployeeStatusLabels,
  AllowanceCategoryLabels
} from '../enums/employeeEnums';
import { PTKP_OPTIONS, normalizeNpwp, isValidNpwp } from '../utils/tax';

interface EmployeeEditProps {
  id: string;
  onClose: () => void;
}

function EmployeeEdit({ id, onClose }: EmployeeEditProps) {
  const [form, setForm] = useState({
    full_name: '',
    position: '',
    department: '',
    hire_date: '',
    basic_salary: '',
    gender: '',
    marital_status: '',
    blood_type: '',
    phone: '',
    education_level: '',
    employment_type: '',
    status: '',
    bank_name: '',
    bank_account_number: '',
    npwp: '',
    ptkp: ''
  });
  const [managerId, setManagerId] = useState<string>('');
  const [allowances, setAllowances] = useState([{ name: '', amount: '' }]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [npwpError, setNpwpError] = useState('');

  useEffect(() => {
    async function fetchEmployees() {
      try {
        const res = await fetch('http://localhost:4004/api/v1/employees');
        if (!res.ok) throw new Error('Failed to load employees');
        const payload = await res.json();
        setEmployees(payload.data || []);
      } catch (err) {
        console.error('Failed to load employees:', err);
      }
    }
    fetchEmployees();
  }, []);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`http://localhost:4004/api/v1/employees/${id}`);
        if (!res.ok) throw new Error('Failed to load data');
        const payload = await res.json();
        const emp = payload.data || payload;
        setForm({
          full_name: emp.full_name || '',
          position: emp.position || '',
          department: emp.department || '',
          hire_date: emp.hire_date ? emp.hire_date.slice(0, 10) : '',
          basic_salary: emp.basic_salary !== undefined && emp.basic_salary !== null ? String(emp.basic_salary) : '',
          gender: emp.gender || '',
          marital_status: emp.marital_status || '',
          blood_type: emp.blood_type || '',
          phone: emp.phone || '',
          education_level: emp.education_level || '',
          employment_type: emp.employment_type || '',
          status: emp.status || '',
          bank_name: emp.bank_name || '',
          bank_account_number: emp.bank_account_number || '',
          npwp: emp.npwp || '',
          ptkp: emp.ptkp || ''
        });
        setManagerId(emp.manager_id || '');
        // normalize allowances: backend may return object map or array
        if (emp.allowances) {
          if (Array.isArray(emp.allowances)) {
            const arr = emp.allowances.map((a: any) => ({ name: String(a.name ?? ''), amount: String(a.amount ?? '') }));
            setAllowances(arr.length > 0 ? arr : [{ name: '', amount: '' }]);
          } else if (typeof emp.allowances === 'object') {
            const arr = Object.entries(emp.allowances).map(([name, amount]) => ({ name: String(name), amount: String(amount ?? '') }));
            setAllowances(arr.length > 0 ? arr : [{ name: '', amount: '' }]);
          } else {
            setAllowances([{ name: '', amount: '' }]);
          }
        } else {
          setAllowances([{ name: '', amount: '' }]);
        }
      } catch (e: any) {
        setError(e.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'npwp') {
      setNpwpError('');
      if (value && !isValidNpwp(value)) {
        setNpwpError('Invalid NPWP. Format: 99.999.999.9-999.999 or 15 digits');
      }
    }
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleAllowanceChange = (idx: number, field: 'name' | 'amount', value: string) => {
    setAllowances(a => a.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  };

  const addAllowance = () => setAllowances(a => [...a, { name: '', amount: '' }]);
  const removeAllowance = (idx: number) => setAllowances(a => a.filter((_, i) => i !== idx));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setNpwpError('');
    
    // Validate NPWP before submit
    if (form.npwp && !isValidNpwp(form.npwp)) {
      setNpwpError('Invalid NPWP. Format: 99.999.999.9-999.999 or 15 digits');
      return;
    }
    
    // Filter form: remove empty fields ('')
    const filteredForm: any = {};
    Object.entries(form).forEach(([key, value]) => {
      if (value !== '' && value !== null && value !== undefined) {
        // Normalize NPWP before sending
        if (key === 'npwp' && value) {
          filteredForm[key] = normalizeNpwp(String(value));
        } else {
          filteredForm[key] = value;
        }
      }
    });
    
    // Always include manager_id (support both setting and clearing)
    filteredForm.manager_id = managerId || null;
    
    console.log('=== DEBUG: Submitting ===');
    console.log('managerId state:', managerId);
    console.log('Payload:', JSON.stringify(filteredForm, null, 2));
    
    try {
      const res = await fetch(`http://localhost:4004/api/v1/employees/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...filteredForm, allowances }),
      });
      if (res.ok) {
        setShowModal(true);
        setTimeout(() => {
          setShowModal(false);
          onClose();
        }, 1500);
      } else {
        let errMsg = 'Failed to update data';
        try {
          const err = await res.json();
          errMsg = err.message || errMsg;
        } catch (err) {
          // response not JSON, possibly HTML error
          errMsg = 'Server error: ' + res.status;
        }
        setError(errMsg);
      }
    } catch (e: any) {
      setError(e.message || 'Failed to update data');
    }
  };

  if (loading) return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"><div className="bg-white rounded-2xl shadow-2xl p-8">Loading data...</div></div>;

  return (
    <>
  <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose}></div>
    <div className="fixed inset-0 z-50 flex items-center justify-center px-2">
  <div className="w-full max-w-xl min-w-[340px] mx-auto bg-gradient-to-br from-gray-50 to-white rounded-2xl shadow-2xl border border-gray-200 animate-fade-in relative overflow-hidden">
  <div className="py-10 px-8 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center gap-3 mb-6">
            <button onClick={onClose} className="text-gray-500 hover:text-blue-700 focus:outline-none" title="Close">
              <ArrowLeft size={28} />
            </button>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800">Edit Employee Data</h2>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Row 1 */}
              <div className="flex flex-col gap-2 mb-2">
                <label className="block font-semibold text-gray-800">Full Name</label>
                <input name="full_name" value={form.full_name} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 text-gray-900 placeholder:text-gray-400 transition" required />
              </div>
              <div className="flex flex-col gap-2 mb-2">
                <label className="block font-semibold text-gray-800">Position</label>
                <input name="position" value={form.position} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 text-gray-900 placeholder:text-gray-400 transition" required />
              </div>
              {/* Row 2 */}
              <div className="flex flex-col gap-2 mb-2">
                <label className="block font-semibold text-gray-800">Department</label>
                <input name="department" value={form.department} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 text-gray-900 placeholder:text-gray-400 transition" placeholder="Example: HR, Finance, IT" />
              </div>
              <div className="flex flex-col gap-2 mb-2">
                <label className="block font-semibold text-gray-800">Direct Manager</label>
                <Select
                  isClearable
                  placeholder="Type to search manager..."
                  noOptionsMessage={({ inputValue }) => 
                    inputValue.length < 2 
                      ? "Type at least 2 characters to search" 
                      : "No manager found"
                  }
                  filterOption={(option, inputValue) => {
                    if (inputValue.length < 2) return false;
                    const searchText = inputValue.toLowerCase();
                    const label = option.label.toLowerCase();
                    return label.includes(searchText);
                  }}
                  options={employees.filter(e => e.id !== id).map(emp => ({
                    value: emp.id,
                    label: `${emp.full_name} - ${emp.position}`
                  }))}
                  value={
                    managerId && employees.find(e => e.id === managerId)
                      ? { 
                          value: managerId, 
                          label: `${employees.find(e => e.id === managerId)?.full_name} - ${employees.find(e => e.id === managerId)?.position}` 
                        }
                      : null
                  }
                  onChange={(selected) => {
                    const newManagerId = selected ? selected.value : '';
                    setManagerId(newManagerId);
                    console.log('Manager changed to:', newManagerId);
                  }}
                  styles={{
                    control: (base) => ({
                      ...base,
                      borderColor: '#d1d5db',
                      borderRadius: '0.5rem',
                      padding: '0.25rem',
                      backgroundColor: 'white',
                      '&:hover': { borderColor: '#60a5fa' },
                      '&:focus': { borderColor: '#60a5fa', boxShadow: '0 0 0 2px rgba(96, 165, 250, 0.1)' }
                    }),
                    placeholder: (base) => ({
                      ...base,
                      color: '#9ca3af'
                    })
                  }}
                />
                <span className="text-xs text-gray-500 mt-1">Type at least 2 characters to search. Leave empty for top-level (CEO/Director)</span>
              </div>
              {/* Row 3 */}
              <div className="flex flex-col gap-2 mb-2">
                <label className="block font-semibold text-gray-800">Hire Date</label>
                <input name="hire_date" type="date" value={form.hire_date} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 text-gray-900 placeholder:text-gray-400 transition" required />
              </div>
              <div className="flex flex-col gap-2 mb-2">
                <label className="block font-semibold text-gray-800">Basic Salary</label>
                <input name="basic_salary" type="number" value={form.basic_salary} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 text-gray-900 placeholder:text-gray-400 transition" required />
              </div>
              <div className="flex flex-col gap-2 mb-2">
                <label className="block font-semibold text-gray-800">Gender</label>
                <select name="gender" value={form.gender} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 text-gray-900 transition">
                  <option value="">Select Gender</option>
                  {Object.entries(GenderLabels).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
              {/* Row 4 */}
              <div className="flex flex-col gap-2 mb-2">
                <label className="block font-semibold text-gray-800">Marital Status</label>
                <select name="marital_status" value={form.marital_status} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 text-gray-900 transition">
                  <option value="">Select Marital Status</option>
                  {Object.entries(MaritalStatusLabels).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-2 mb-2">
                <label className="block font-semibold text-gray-800">Blood Type</label>
                <select name="blood_type" value={form.blood_type} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 text-gray-900 transition">
                  <option value="">Select Blood Type</option>
                  {Object.entries(BloodTypeLabels).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
              {/* Row 5 */}
              <div className="flex flex-col gap-2 mb-2">
                <label className="block font-semibold text-gray-800">Phone</label>
                <input name="phone" type="tel" value={form.phone} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 text-gray-900 placeholder:text-gray-400 transition" placeholder="+62..." />
              </div>
              <div className="flex flex-col gap-2 mb-2">
                <label className="block font-semibold text-gray-800">Education Level</label>
                <select name="education_level" value={form.education_level} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 text-gray-900 transition">
                  <option value="">Select Education Level</option>
                  {Object.entries(EducationLevelLabels).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
              {/* Row 6 */}
              <div className="flex flex-col gap-2 mb-2">
                <label className="block font-semibold text-gray-800">Employment Type</label>
                <select name="employment_type" value={form.employment_type} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 text-gray-900 transition">
                  <option value="">Select Employment Type</option>
                  {Object.entries(EmploymentTypeLabels).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
              {/* Row 5 */}
              <div className="flex flex-col gap-2 mb-2 md:col-span-2">
                <label className="block font-semibold text-gray-800">Status</label>
                <select name="status" value={form.status} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 text-gray-900 transition">
                  <option value="">Select Status</option>
                  {Object.entries(EmployeeStatusLabels).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Section: Account & Tax Information */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Account & Tax Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="block font-semibold text-gray-800">Bank Name</label>
                  <input 
                    name="bank_name" 
                    value={form.bank_name} 
                    onChange={handleChange} 
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 text-gray-900 placeholder:text-gray-400 transition" 
                    placeholder="Example: BCA, Mandiri"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="block font-semibold text-gray-800">Account Number</label>
                  <input 
                    name="bank_account_number" 
                    value={form.bank_account_number} 
                    onChange={handleChange} 
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 text-gray-900 placeholder:text-gray-400 transition" 
                    placeholder="Bank account number"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="block font-semibold text-gray-800">NPWP</label>
                  <input 
                    name="npwp" 
                    value={form.npwp} 
                    onChange={handleChange} 
                    className={`w-full border rounded-lg px-4 py-2 bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 text-gray-900 placeholder:text-gray-400 transition ${npwpError ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="00.000.000.0-000.000"
                  />
                  {npwpError && <span className="text-xs text-red-600">{npwpError}</span>}
                  <span className="text-xs text-gray-500">Format: 99.999.999.9-999.999 or 15 digits</span>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="block font-semibold text-gray-800">PTKP Status</label>
                  <select
                    name="ptkp" 
                    value={form.ptkp} 
                    onChange={handleChange} 
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 text-gray-900 transition"
                  >
                    <option value="">Select PTKP Status</option>
                    {PTKP_OPTIONS.map(opt => (
                      <option key={opt.code} value={opt.code}>{opt.label}</option>
                    ))}
                  </select>
                  <span className="text-xs text-gray-500">Non-Taxable Income Status</span>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <label className="block mb-1 font-semibold text-gray-800">Allowances</label>
              <div className="space-y-2">
                {allowances.map((a, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <select
                      value={a.name}
                      onChange={e => handleAllowanceChange(idx, 'name', e.target.value)}
                      className="border border-gray-300 rounded-lg px-3 py-2 bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 text-gray-900 transition flex-1"
                    >
                      <option value="">Select allowance type</option>
                      {Object.entries(AllowanceCategoryLabels).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      placeholder="Amount"
                      value={a.amount}
                      onChange={e => handleAllowanceChange(idx, 'amount', e.target.value)}
                      className="border border-gray-300 rounded-lg px-3 py-2 bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 text-gray-900 placeholder:text-gray-400 transition w-40"
                    />
                    <button type="button" className="text-red-500 px-2 py-1 font-semibold hover:bg-red-50 rounded-full transition" onClick={() => removeAllowance(idx)} title="Delete allowance">
                      <Trash2 size={20} />
                    </button>
                  </div>
                ))}
                <button type="button" className="text-blue-700 px-3 py-1 border border-blue-200 rounded-lg font-semibold hover:bg-blue-50 transition" onClick={addAllowance}>
                  + Add Allowance
                </button>
              </div>
            </div>
            <button type="submit" className="w-full bg-gradient-to-r from-blue-700 to-blue-500 hover:from-blue-800 hover:to-blue-600 text-white py-3 rounded-xl font-bold text-lg shadow transition">Save Changes</button>
            {error && <div className="text-red-600 mt-2 text-center">{error}</div>}
            {/* Success Modal - improved design */}
            {showModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center">
                <div className="fixed inset-0 z-40 bg-black/30 pointer-events-none"></div>
                <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm border border-green-200 animate-fade-in flex flex-col items-center relative z-50">
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white rounded-full shadow-lg p-2 border-4 border-green-100">
                    <svg width="48" height="48" fill="none" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="12" fill="#E6F4EA" />
                      <path d="M7 13l3 3 7-7" stroke="#5CB85C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <div className="mt-8 text-lg font-bold text-[#5CB85C] mb-2">Successfully Updated</div>
                  <div className="text-gray-700 mb-2 text-center">Employee data has been updated successfully.</div>
                </div>
              </div>
            )}
          </form>
    </div>
        </div>
      </div>
    </>
  );
}

export default EmployeeEdit;





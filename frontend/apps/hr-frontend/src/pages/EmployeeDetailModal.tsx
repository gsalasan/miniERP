
import React, { useEffect, useState } from 'react';
import { 
  FaUserCircle, 
  FaEnvelope, 
  FaMoneyBillWave, 
  FaCalendarAlt, 
  FaUserShield, 
  FaTimes,
  FaVenusMars,
  FaRing,
  FaTint,
  FaPhone,
  FaGraduationCap,
  FaBriefcase,
  FaCheckCircle,
  FaUniversity,
  FaCreditCard,
  FaFileInvoice,
  FaIdCard
} from 'react-icons/fa';
import {
  GenderLabels,
  MaritalStatusLabels,
  BloodTypeLabels,
  EducationLevelLabels,
  EmploymentTypeLabels,
  EmployeeStatusLabels
} from '../enums/employeeEnums';

interface UserInfo {
  id: string;
  email: string;
  roles: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Employee {
  id: string;
  full_name: string;
  position: string;
  hire_date: string;
  basic_salary: number;
  allowances?: any;
  users?: UserInfo | UserInfo[]; // Support both object and array
  // Extended optional fields used across list/detail views
  department?: string | null;
  gender?: string | null;
  marital_status?: string | null;
  phone?: string | null;
  employment_type?: string | null;
  status?: string | null;
  blood_type?: string | null;
  education_level?: string | null;
  // Account & Tax (opsional)
  bank_name?: string | null;
  bank_account_number?: string | null;
  npwp?: string | null;
  ptkp?: string | null;
  // Manager relationship
  manager_id?: string | null;
  manager?: { full_name: string; position: string } | null;
}

interface EmployeeDetailModalProps {
  id: string;
  onClose: () => void;
}

export default function EmployeeDetailModal({ id, onClose }: EmployeeDetailModalProps) {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'info' | 'finance'>('info');
  
  useEffect(() => {
    fetch(`http://localhost:4004/api/v1/employees/${id}`)
      .then(res => res.json())
      .then(data => {
        console.log('Employee detail response:', data);
        setEmployee(data.data || null);
        setLoading(false);
      });
  }, [id]);
  // user dan allowances dideklarasikan di bawah jika employee sudah ada
  if (loading) {
    return (
      <div>
        <div className="fixed inset-0 z-40 bg-black/20" onClick={onClose}></div>
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="w-full max-w-xl mx-auto bg-white rounded-lg shadow-xl p-8 border border-gray-100 animate-fade-in relative flex flex-col items-center">
            <FaUserCircle className="text-5xl text-blue-200 mb-3" />
            <div className="text-gray-500 text-base font-medium">Memuat data...</div>
          </div>
        </div>
      </div>
    );
  }
  if (!employee) {
    return (
      <div>
        <div className="fixed inset-0 z-40 bg-black/20" onClick={onClose}></div>
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="w-full max-w-md mx-auto bg-white rounded-lg shadow-xl p-8 border border-gray-100 animate-fade-in relative flex flex-col items-center">
            <FaUserCircle className="text-5xl text-red-200 mb-3" />
            <div className="text-red-600 text-base font-medium">Data karyawan tidak ditemukan.</div>
          </div>
        </div>
      </div>
    );
  }
  // Handle users as either object or array
  const user = Array.isArray(employee.users) ? employee.users[0] : employee.users;
  
  // Normalize allowances: handle both array [{name, amount}] and object {name: amount}
  let allowancesArray: Array<{ name: string; amount: number }> = [];
  if (employee.allowances) {
    console.log('Allowances raw:', employee.allowances, 'Type:', typeof employee.allowances, 'IsArray:', Array.isArray(employee.allowances));
    
    if (Array.isArray(employee.allowances)) {
      // Format array: [{name: "meal", amount: 2000000}, ...]
      allowancesArray = employee.allowances
        .filter((a: any) => a && (a.name || a.amount))
        .map((a: any) => ({
          name: String(a.name || 'Tunjangan'),
          amount: Number(a.amount) || 0
        }));
    } else if (typeof employee.allowances === 'object') {
      // Format object: {meal: 2000000, bonus: 2000000, ...}
      allowancesArray = Object.entries(employee.allowances)
        .filter(([name, amount]) => name && amount !== null && amount !== undefined)
        .map(([name, amount]) => ({
          name: String(name),
          amount: Number(amount) || 0
        }));
    }
    
    console.log('Allowances normalized:', allowancesArray);
  }
  return (
    <div>
      <div className="fixed inset-0 z-40 bg-black/20" onClick={onClose}></div>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl mx-auto bg-white rounded-xl shadow-2xl border border-gray-100 animate-fade-in relative overflow-hidden max-h-[90vh] flex flex-col">
          <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-red-500 text-2xl z-10" title="Tutup"><FaTimes /></button>
          
          {/* Header - Fixed */}
          <div className="px-6 pt-6 pb-4 border-b border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-3xl text-blue-500">
                <FaUserCircle />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-blue-900">{employee.full_name}</h2>
                {employee.position && (
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-xs font-semibold">{employee.position}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200 bg-gray-50">
            <button
              onClick={() => setActiveTab('info')}
              className={`flex-1 px-4 py-3 font-semibold text-sm transition-colors flex items-center justify-center gap-2 ${
                activeTab === 'info'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                  : 'text-gray-600 hover:text-blue-600 hover:bg-gray-100'
              }`}
            >
              <FaIdCard /> General Information
            </button>
            <button
              onClick={() => setActiveTab('finance')}
              className={`flex-1 px-4 py-3 font-semibold text-sm transition-colors flex items-center justify-center gap-2 ${
                activeTab === 'finance'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                  : 'text-gray-600 hover:text-blue-600 hover:bg-gray-100'
              }`}
            >
              <FaMoneyBillWave /> Finance & Tax
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {activeTab === 'info' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="font-medium text-gray-500 flex items-center gap-2 mb-1 text-sm"><FaEnvelope className="text-blue-500" /> Email</div>
                  <div className="text-gray-800">{user?.email ?? <span className="italic text-gray-400">No email</span>}</div>
                </div>
                <div>
                  <div className="font-medium text-gray-500 flex items-center gap-2 mb-1 text-sm"><FaUserShield className="text-purple-500" /> Roles</div>
                  <div className="text-gray-800 text-sm">{user?.roles?.length ? user.roles.join(', ') : <span className="italic text-gray-400">No role</span>}</div>
                </div>
                <div>
                  <div className="font-medium text-gray-500 flex items-center gap-2 mb-1 text-sm"><FaCalendarAlt className="text-green-500" /> Hire Date</div>
                  <div className="text-gray-800">{employee.hire_date ? new Date(employee.hire_date).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}</div>
                </div>
                <div>
                  <div className="font-medium text-gray-500 flex items-center gap-2 mb-1 text-sm"><FaVenusMars className="text-pink-500" /> Gender</div>
                  <div className="text-gray-800">{employee.gender ? GenderLabels[employee.gender] || employee.gender : '-'}</div>
                </div>
                <div>
                  <div className="font-medium text-gray-500 flex items-center gap-2 mb-1 text-sm"><FaRing className="text-yellow-600" /> Marital Status</div>
                  <div className="text-gray-800">{employee.marital_status ? MaritalStatusLabels[employee.marital_status] || employee.marital_status : '-'}</div>
                </div>
                <div>
                  <div className="font-medium text-gray-500 flex items-center gap-2 mb-1 text-sm"><FaTint className="text-red-500" /> Blood Type</div>
                  <div className="text-gray-800">{employee.blood_type ? BloodTypeLabels[employee.blood_type] || employee.blood_type : '-'}</div>
                </div>
                <div>
                  <div className="font-medium text-gray-500 flex items-center gap-2 mb-1 text-sm"><FaPhone className="text-teal-500" /> Phone</div>
                  <div className="text-gray-800">{employee.phone || '-'}</div>
                </div>
                <div>
                  <div className="font-medium text-gray-500 flex items-center gap-2 mb-1 text-sm"><FaGraduationCap className="text-indigo-500" /> Education Level</div>
                  <div className="text-gray-800">{employee.education_level ? EducationLevelLabels[employee.education_level] || employee.education_level : '-'}</div>
                </div>
                <div>
                  <div className="font-medium text-gray-500 flex items-center gap-2 mb-1 text-sm"><FaBriefcase className="text-gray-600" /> Employment Type</div>
                  <div className="text-gray-800">{employee.employment_type ? EmploymentTypeLabels[employee.employment_type] || employee.employment_type : '-'}</div>
                </div>
                <div>
                  <div className="font-medium text-gray-500 flex items-center gap-2 mb-1 text-sm"><FaCheckCircle className="text-green-600" /> Employee Status</div>
                  <div className="text-gray-800">{employee.status ? EmployeeStatusLabels[employee.status] || employee.status : '-'}</div>
                </div>
                <div>
                  <div className="font-medium text-gray-500 flex items-center gap-2 mb-1 text-sm"><FaUserShield className="text-orange-500" /> Direct Manager</div>
                  <div className="text-gray-800">
                    {employee.manager ? (
                      <span>{employee.manager.full_name} - {employee.manager.position}</span>
                    ) : (
                      <span className="italic text-gray-400">No manager assigned</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'finance' && (
              <div className="space-y-6">
                {/* Bank Information */}
                <div>
                  <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                    <FaUniversity className="text-blue-600" /> Bank Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-blue-50 p-4 rounded-lg">
                    <div>
                      <div className="font-medium text-gray-600 mb-1 text-sm flex items-center gap-2">
                        <FaUniversity className="text-blue-500" /> Bank Name
                      </div>
                      <div className="text-gray-900 font-semibold">{employee.bank_name || '-'}</div>
                    </div>
                    <div>
                      <div className="font-medium text-gray-600 mb-1 text-sm flex items-center gap-2">
                        <FaCreditCard className="text-blue-500" /> Account Number
                      </div>
                      <div className="text-gray-900 font-semibold">{employee.bank_account_number || '-'}</div>
                    </div>
                  </div>
                </div>

                {/* Tax Information */}
                <div>
                  <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                    <FaFileInvoice className="text-amber-600" /> Tax Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-amber-50 p-4 rounded-lg">
                    <div>
                      <div className="font-medium text-gray-600 mb-1 text-sm flex items-center gap-2">
                        <FaIdCard className="text-amber-600" /> NPWP
                      </div>
                      <div className="text-gray-900 font-semibold">{employee.npwp || '-'}</div>
                    </div>
                    <div>
                      <div className="font-medium text-gray-600 mb-1 text-sm flex items-center gap-2">
                        <FaFileInvoice className="text-amber-600" /> PTKP Status
                      </div>
                      <div className="text-gray-900 font-semibold">{employee.ptkp || '-'}</div>
                    </div>
                  </div>
                </div>

                {/* Salary & Allowances */}
                <div>
                  <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                    <FaMoneyBillWave className="text-green-600" /> Salary & Allowances
                  </h3>
                  <div className="bg-green-50 p-4 rounded-lg mb-3">
                    <div className="font-medium text-gray-600 mb-1 text-sm">Basic Salary</div>
                    <div className="text-green-700 font-bold text-xl">
                      Rp {employee.basic_salary ? Number(employee.basic_salary).toLocaleString('id-ID') : '0'}
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    {allowancesArray.length > 0 ? (
                      <table className="w-full text-sm bg-white border border-gray-200 rounded-lg overflow-hidden">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="px-4 py-2 text-left font-semibold text-gray-700">Allowance Name</th>
                            <th className="px-4 py-2 text-right font-semibold text-gray-700">Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {allowancesArray.map((item, idx) => (
                            <tr key={`${item.name}-${idx}`} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                              <td className="px-4 py-2 text-gray-800">{item.name}</td>
                              <td className="px-4 py-2 text-blue-700 font-semibold text-right">
                                Rp {item.amount.toLocaleString('id-ID')}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div className="text-center py-4 text-gray-400 italic">No allowances</div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 text-xs text-gray-500">
            <div className="flex justify-between">
              <span>Created: {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US') : '-'}</span>
              <span>Updated: {user?.updated_at ? new Date(user.updated_at).toLocaleDateString('en-US') : '-'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


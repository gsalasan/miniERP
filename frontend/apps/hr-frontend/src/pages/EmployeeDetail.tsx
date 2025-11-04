import React, { useEffect, useState } from 'react';
import { FaUserCircle, FaEnvelope, FaMoneyBillWave, FaCalendarAlt, FaUserShield, FaEdit, FaArrowLeft } from 'react-icons/fa';
import { useParams, Link } from 'react-router-dom';

import EmployeeEdit from './EmployeeEdit';
import Layout from '../components/Layout';
import {
  GenderLabels,
  MaritalStatusLabels,
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

interface Employee {
  id: string;
  full_name: string;
  position: string;
  hire_date: string;
  basic_salary: number;
  allowances?: any;
  users?: UserInfo[];
  gender?: string;
  marital_status?: string;
  employment_type?: string;
  status?: string;
}

export default function EmployeeDetail() {
  const { id } = useParams<{ id: string }>();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    fetch(`http://localhost:3002/api/v1/employees/${id}`)
      .then(res => res.json())
      .then(data => {
        setEmployee(data.data || null);
        setLoading(false);
      });
  }, [id]);

  const user = employee?.users?.[0];
  const allowances = employee?.allowances;
  const [editOpen, setEditOpen] = useState(false);
  return (
    <Layout>
      <div className="mb-8 flex items-center gap-3">
        <Link to="/hr/employees" className="text-gray-500 hover:text-blue-500 text-2xl p-2 rounded-full bg-gray-100 hover:bg-blue-100 transition flex items-center justify-center" title="Kembali ke daftar karyawan">
          <FaArrowLeft />
        </Link>
        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
          <FaUserCircle className="text-gray-400" /> Detail Karyawan
        </h1>
      </div>

      {loading ? (
        <div className="text-center py-10 text-blue-600">Memuat data...</div>
      ) : employee ? (
        <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl p-8 border border-gray-200 animate-fade-in">
          <div className="flex items-center gap-6 mb-8">
            <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center text-5xl font-extrabold text-gray-400 shadow border-2 border-white">
              <FaUserCircle className="text-5xl" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl font-bold text-gray-800">{employee.full_name}</span>
                {employee.position && (
                  <span className="ml-2 px-2 py-1 rounded bg-gray-100 text-blue-700 text-xs font-semibold border border-gray-200 flex items-center gap-1"><FaUserShield className="inline" /> {employee.position}</span>
                )}
              </div>
              <div className="text-xs mt-1 text-gray-400">ID: {employee.id}</div>
              <div className="mt-2 flex gap-2">
                <button type="button" onClick={() => setEditOpen(true)} className="inline-flex items-center justify-center p-2 rounded-full bg-yellow-50 text-yellow-700 border border-yellow-100 hover:bg-yellow-100 transition" title="Edit data karyawan ini (sama dengan edit di daftar)"><FaEdit /></button>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
            <div>
              <div className="font-medium text-gray-500 flex items-center gap-1"><FaEnvelope /> Email</div>
              <div className="text-gray-800 font-semibold">{user?.email ?? <span className="italic text-gray-400">Tidak ada email</span>}</div>
            </div>
            <div>
              <div className="font-medium text-gray-500 flex items-center gap-1"><FaUserShield /> Roles</div>
              <div className="text-gray-700 text-xs font-semibold">{user?.roles?.length ? user.roles.join(', ') : <span className="italic text-gray-400">Tidak ada role</span>}</div>
            </div>
            <div>
              <div className="font-medium text-gray-500 flex items-center gap-1"><FaCalendarAlt /> Tanggal Masuk</div>
              <div className="text-gray-800">{employee.hire_date ? new Date(employee.hire_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}</div>
            </div>
            <div>
              <div className="font-medium text-gray-500 flex items-center gap-1">Gender</div>
              <div className="text-gray-800">{employee.gender ? GenderLabels[employee.gender] || employee.gender : '-'}</div>
            </div>
            <div>
              <div className="font-medium text-gray-500 flex items-center gap-1">Status Nikah</div>
              <div className="text-gray-800">{employee.marital_status ? MaritalStatusLabels[employee.marital_status] || employee.marital_status : '-'}</div>
            </div>
            <div>
              <div className="font-medium text-gray-500 flex items-center gap-1">Tipe Kerja</div>
              <div className="text-gray-800">{employee.employment_type ? EmploymentTypeLabels[employee.employment_type] || employee.employment_type : '-'}</div>
            </div>
            <div>
              <div className="font-medium text-gray-500 flex items-center gap-1">Status</div>
              <div className="text-gray-800">{employee.status ? EmployeeStatusLabels[employee.status] || employee.status : '-'}</div>
            </div>
            <div className="md:col-span-2">
              <div className="font-medium text-gray-500 flex items-center gap-1"><FaMoneyBillWave /> Tunjangan</div>
              <div className="mt-1 bg-gray-50 rounded p-2 text-sm">
                {allowances && Object.keys(allowances).length > 0 ? (
                  <ul className="list-disc pl-5">
                    {Object.entries(allowances).map(([name, amount]) => (
                      <li key={name} className="flex justify-between">
                        <span>{name}</span>
                        <span className="font-semibold text-blue-700">
                          Rp {typeof amount === 'number' ? amount.toLocaleString('id-ID') : '-'}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <span className="italic text-gray-400">Tidak ada tunjangan</span>
                )}
              </div>
            </div>
          </div>
          <div className="mt-8 text-xs text-gray-400 text-right">
            Dibuat: {user?.created_at ? new Date(user.created_at).toLocaleString('id-ID') : '-'} | Diperbarui: {user?.updated_at ? new Date(user.updated_at).toLocaleString('id-ID') : '-'}
          </div>
        </div>
      ) : (
        <div className="text-center text-red-600 flex flex-col items-center gap-2">
          <FaUserCircle className="text-5xl mb-2 text-red-300" />
          Data karyawan tidak ditemukan.
        </div>
      )}
      {editOpen && employee && (
        <EmployeeEdit id={employee.id} onClose={() => { setEditOpen(false); }} />
      )}
      </Layout>
  );
}

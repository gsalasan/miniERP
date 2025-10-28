import React, { useEffect, useState } from 'react';
import { FaUserCircle, FaEnvelope, FaMoneyBillWave, FaCalendarAlt, FaUserShield, FaEdit } from 'react-icons/fa';
import { useParams, Link } from 'react-router-dom';
import Layout from '../components/Layout';


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

  return (
    <Layout>
      <div className="mb-6 flex items-center gap-4">
        <Link to="/hr/employees" className="text-blue-700 hover:underline flex items-center gap-1">&larr; <span>Kembali ke Daftar</span></Link>
        <h1 className="text-3xl font-bold text-blue-800 flex items-center gap-2"><FaUserCircle className="text-blue-400" /> Detail Karyawan</h1>
      </div>
      {loading ? (
        <div className="text-center py-10 text-blue-600 animate-pulse flex flex-col items-center gap-2">
          <FaUserCircle className="text-5xl mb-2 animate-bounce text-blue-300" />
          Memuat data...
        </div>
      ) : employee ? (
        <div className="max-w-2xl mx-auto bg-gradient-to-br from-blue-50 to-white rounded-2xl shadow-2xl p-10 border border-blue-100 animate-fade-in">
          <div className="flex items-center gap-8 mb-8">
            <div className="w-28 h-28 rounded-full bg-gradient-to-br from-blue-200 to-blue-100 flex items-center justify-center text-5xl font-extrabold text-blue-800 shadow-lg border-4 border-white">
              <FaUserCircle className="text-6xl text-blue-400" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-3xl font-extrabold text-blue-900">{employee.full_name}</span>
                <span className="ml-2 px-2 py-1 rounded bg-blue-100 text-blue-700 text-xs font-semibold border border-blue-200 flex items-center gap-1"><FaUserShield className="inline" /> {employee.position}</span>
              </div>
              <div className="text-xs mt-1 text-gray-400">ID: {employee.id}</div>
              <div className="mt-2 flex gap-2">
                <Link to={`/hr/employees/edit/${employee.id}`} className="inline-flex items-center gap-1 px-3 py-1 rounded bg-yellow-100 text-yellow-800 text-xs font-bold border border-yellow-200 hover:bg-yellow-200 transition"><FaEdit /> Edit</Link>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
            <div>
              <div className="font-medium text-gray-500 flex items-center gap-1"><FaEnvelope /> Email</div>
              <div className="text-blue-900 font-semibold">{employee.users && employee.users[0]?.email || <span className="italic text-gray-400">Tidak ada email</span>}</div>
            </div>

            <div>
              <div className="font-medium text-gray-500 flex items-center gap-1"><FaUserShield /> Roles</div>
              <div className="text-blue-700 text-xs font-semibold">{employee.users && employee.users[0]?.roles?.length ? employee.users[0].roles.join(', ') : <span className="italic text-gray-400">Tidak ada role</span>}</div>
            </div>
            <div>
              <div className="font-medium text-gray-500 flex items-center gap-1"><FaCalendarAlt /> Tanggal Masuk</div>
              <div className="text-blue-900">{employee.hire_date ? new Date(employee.hire_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}</div>
            </div>
            <div>
              <div className="font-medium text-gray-500 flex items-center gap-1"><FaMoneyBillWave /> Gaji Pokok</div>
              <div className="text-blue-900 font-mono font-bold">Rp {employee.basic_salary?.toLocaleString('id-ID')}</div>
            </div>
            <div>
              <div className="font-medium text-gray-500 flex items-center gap-1"><FaMoneyBillWave /> Tunjangan</div>
               <div className="mt-1 bg-gray-100 rounded p-2 text-sm">
                 {employee.allowances && Object.keys(employee.allowances).length > 0 ? (
                   <ul className="list-disc pl-5">
                     {Object.entries(employee.allowances).map(([name, amount]) => (
                       <li key={name} className="flex justify-between">
                         <span>{name}</span>
                         <span className="font-semibold text-blue-800">
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
          <div className="mt-8 text-xs text-gray-400 text-right">Dibuat: {employee.users && employee.users[0]?.created_at ? new Date(employee.users[0].created_at).toLocaleString('id-ID') : '-'} | Diperbarui: {employee.users && employee.users[0]?.updated_at ? new Date(employee.users[0].updated_at).toLocaleString('id-ID') : '-'}</div>
        </div>
      ) : (
        <div className="text-center text-red-600 flex flex-col items-center gap-2">
          <FaUserCircle className="text-5xl mb-2 text-red-300" />
          Data karyawan tidak ditemukan.
        </div>
      )}
    </Layout>
  );
}

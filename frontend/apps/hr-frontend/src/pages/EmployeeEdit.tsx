
import React, { useEffect, useState } from 'react';
import { Trash2, ArrowLeft } from 'lucide-react';

interface EmployeeEditProps {
  id: string;
  onClose: () => void;
}

function EmployeeEdit({ id, onClose }: EmployeeEditProps) {
  const [form, setForm] = useState({ full_name: '', position: '', department: '', hire_date: '', basic_salary: '' });
  const [allowances, setAllowances] = useState([{ name: '', amount: '' }]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`http://localhost:3002/api/v1/employees/${id}`);
        if (!res.ok) throw new Error('Gagal memuat data');
        const data = await res.json();
        setForm({
          full_name: data.full_name || '',
          position: data.position || '',
          department: data.department || '',
          hire_date: data.hire_date ? data.hire_date.slice(0, 10) : '',
          basic_salary: data.basic_salary || '',
        });
        setAllowances(data.allowances && data.allowances.length > 0 ? data.allowances : [{ name: '', amount: '' }]);
      } catch (e: any) {
        setError(e.message || 'Gagal memuat data');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleAllowanceChange = (idx: number, field: 'name' | 'amount', value: string) => {
    setAllowances(a => a.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  };

  const addAllowance = () => setAllowances(a => [...a, { name: '', amount: '' }]);
  const removeAllowance = (idx: number) => setAllowances(a => a.filter((_, i) => i !== idx));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch(`http://localhost:3002/api/v1/employees/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, allowances }),
      });
      if (res.ok) {
        setShowModal(true);
        setTimeout(() => {
          setShowModal(false);
          onClose();
        }, 1500);
      } else {
        let errMsg = 'Gagal update data';
        try {
          const err = await res.json();
          errMsg = err.message || errMsg;
        } catch (err) {
          // response bukan JSON, kemungkinan HTML error
          errMsg = 'Server error: ' + res.status;
        }
        setError(errMsg);
      }
    } catch (e: any) {
      setError(e.message || 'Gagal update data');
    }
  };

  if (loading) return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"><div className="bg-white rounded-2xl shadow-2xl p-8">Memuat data...</div></div>;

  return (
    <>
  <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose}></div>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="w-full max-w-2xl mx-auto bg-gradient-to-br from-gray-50 to-white rounded-2xl shadow-2xl p-10 border border-gray-200 animate-fade-in relative">
          <div className="flex items-center gap-3 mb-6">
            <button onClick={onClose} className="text-gray-500 hover:text-blue-700 focus:outline-none" title="Tutup">
              <ArrowLeft size={28} />
            </button>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800">Edit Data Karyawan</h2>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block mb-1 font-semibold text-gray-800">Nama Lengkap</label>
                <input name="full_name" value={form.full_name} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 text-gray-900 placeholder:text-gray-400 transition" required />
              </div>
              <div>
                <label className="block mb-1 font-semibold text-gray-800">Jabatan</label>
                <input name="position" value={form.position} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 text-gray-900 placeholder:text-gray-400 transition" required />
              </div>
              <div>
                <label className="block mb-1 font-semibold text-gray-800">Departemen</label>
                <input name="department" value={form.department} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 text-gray-900 placeholder:text-gray-400 transition" />
              </div>
              <div>
                <label className="block mb-1 font-semibold text-gray-800">Tanggal Masuk</label>
                <input name="hire_date" type="date" value={form.hire_date} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 text-gray-900 placeholder:text-gray-400 transition" required />
              </div>
              <div>
                <label className="block mb-1 font-semibold text-gray-800">Gaji Pokok</label>
                <input name="basic_salary" type="number" value={form.basic_salary} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 text-gray-900 placeholder:text-gray-400 transition" required />
              </div>
            </div>
            <div>
              <label className="block mb-1 font-semibold text-gray-800">Tunjangan</label>
              <div className="space-y-2">
                {allowances.map((a, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <input
                      type="text"
                      placeholder="Nama tunjangan"
                      value={a.name}
                      onChange={e => handleAllowanceChange(idx, 'name', e.target.value)}
                      className="border border-gray-300 rounded-lg px-3 py-2 bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 text-gray-900 placeholder:text-gray-400 transition flex-1"
                    />
                    <input
                      type="number"
                      placeholder="Jumlah"
                      value={a.amount}
                      onChange={e => handleAllowanceChange(idx, 'amount', e.target.value)}
                      className="border border-gray-300 rounded-lg px-3 py-2 bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 text-gray-900 placeholder:text-gray-400 transition w-40"
                    />
                    <button type="button" className="text-red-500 px-2 py-1 font-semibold hover:bg-red-50 rounded-full transition" onClick={() => removeAllowance(idx)} title="Hapus tunjangan">
                      <Trash2 size={20} />
                    </button>
                  </div>
                ))}
                <button type="button" className="text-blue-700 px-3 py-1 border border-blue-200 rounded-lg font-semibold hover:bg-blue-50 transition" onClick={addAllowance}>
                  + Tambah Tunjangan
                </button>
              </div>
            </div>
            <button type="submit" className="w-full bg-gradient-to-r from-blue-700 to-blue-500 hover:from-blue-800 hover:to-blue-600 text-white py-3 rounded-xl font-bold text-lg shadow transition">Simpan Perubahan</button>
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
                  <div className="mt-8 text-lg font-bold text-[#5CB85C] mb-2">Berhasil Diedit</div>
                  <div className="text-gray-700 mb-2 text-center">Data karyawan berhasil diupdate.</div>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </>
  );
}

export default EmployeeEdit;




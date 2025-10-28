import React from 'react';

interface AllowanceItem {
  name: string;
  amount: string;
}

interface AllowanceInputProps {
  value: AllowanceItem[];
  onChange: (items: AllowanceItem[]) => void;
}

export default function AllowanceInput({ value, onChange }: AllowanceInputProps) {
  const handleChange = (idx: number, field: 'name' | 'amount', val: string) => {
    const updated = value.map((item, i) =>
      i === idx ? { ...item, [field]: val } : item
    );
    onChange(updated);
  };

  const handleAdd = () => {
    onChange([...value, { name: '', amount: '' }]);
  };

  const handleRemove = (idx: number) => {
    onChange(value.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-2">
      {value.map((item, idx) => (
        <div key={idx} className="flex gap-2 items-center">
          <input
            className="flex-1 border rounded px-3 py-2 bg-gray-50 focus:bg-white focus:border-blue-400 transition"
            placeholder="Nama Tunjangan (cth: Transport)"
            value={item.name}
            onChange={e => handleChange(idx, 'name', e.target.value)}
          />
          <input
            className="w-32 border rounded px-3 py-2 bg-gray-50 focus:bg-white focus:border-blue-400 transition text-right"
            placeholder="Nominal"
            type="number"
            value={item.amount}
            onChange={e => handleChange(idx, 'amount', e.target.value)}
          />
          <button
            type="button"
            className="text-red-500 hover:text-white hover:bg-red-500 p-1 rounded-full transition"
            onClick={() => handleRemove(idx)}
            title="Hapus"
          >
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18 18 6M6 6l12 12"/></svg>
          </button>
        </div>
      ))}
      <button
        type="button"
        className="mt-2 flex items-center gap-2 text-blue-700 hover:text-white hover:bg-blue-600 bg-blue-50 px-3 py-1 rounded-full font-medium transition"
        onClick={handleAdd}
      >
        <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v12m6-6H6"/></svg>
        Tambah Tunjangan
      </button>
    </div>
  );
}

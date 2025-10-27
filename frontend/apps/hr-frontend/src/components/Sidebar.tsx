import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const navItems = [
  { label: 'Daftar Karyawan', path: '/hr/employees' },
];

export default function Sidebar() {
  const location = useLocation();
  return (
    <aside className="h-screen w-64 bg-white text-blue-900 flex flex-col shadow-lg border-r border-blue-100 fixed">
      <div className="flex flex-col items-center mt-8 mb-4">
        <img
          src="/unais.png"
          alt="Logo Unais"
          className="w-36 h-36 object-contain transition-transform hover:scale-105"
          style={{ aspectRatio: '1/1' }}
        />
      </div>
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navItems.map(item => (
            <li key={item.path}>
              <Link
                to={item.path}
                className={`block px-4 py-2 rounded transition-colors duration-200 ${location.pathname === item.path ? 'bg-blue-50 text-blue-900 font-semibold' : 'hover:bg-blue-100 hover:text-blue-700'}`}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <div className="p-4 text-xs text-blue-400 mt-auto">&copy; {new Date().getFullYear()} HR Dept</div>
    </aside>
  );
}

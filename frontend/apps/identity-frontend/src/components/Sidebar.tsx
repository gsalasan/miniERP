import { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSidebarCollapse } from './Layout';
import { FaUsers, FaHome } from 'react-icons/fa';

const navItems = [
  { label: 'Dashboard', path: '/', icon: <FaHome size={18} /> },
  { label: 'User Management', path: '/users', icon: <FaUsers size={18} /> },
];

export default function Sidebar() {
  const location = useLocation();
  const { collapsed, setCollapsed } = useSidebarCollapse();
  return (
    <aside
      className={`min-h-screen bg-white text-blue-900 flex flex-col border-r border-blue-100 transition-all duration-300 ${collapsed ? 'w-[88px] min-w-[88px] shadow-md' : 'w-64 min-w-[16rem] shadow-xl'} relative`}
    >
      <div className={`flex flex-col items-center mt-10 mb-2 transition-all duration-300 ${collapsed ? 'mb-0' : 'mb-4'}`}>
        <img
          src="/unais.png"
          alt="Logo Unais"
          className={`object-contain transition-transform hover:scale-105 drop-shadow-lg ${collapsed ? 'w-12 h-12' : 'w-28 h-28'}`}
          style={{ aspectRatio: '1/1' }}
        />
      </div>
      <button
        className={`absolute top-4 ${collapsed ? 'right-2' : 'right-4'} bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-full p-1.5 shadow transition-all duration-200 ${collapsed ? 'rotate-180' : ''}`}
        style={{ zIndex: 30 }}
        onClick={() => setCollapsed(!collapsed)}
        title={collapsed ? 'Open Sidebar' : 'Close Sidebar'}
      >
        <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </button>
      <nav className={`flex-1 ${collapsed ? 'px-0 pt-8' : 'px-4 pt-8'}`}>
        <ul className="space-y-2">
          {navItems.map(item => {
            const active = location.pathname === item.path;
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center rounded-xl font-medium transition-all duration-200 relative group
                    ${collapsed ? 'justify-center py-4 px-0' : 'gap-4 py-3 px-3'}
                    ${active
                      ? 'bg-blue-50 text-blue-900 font-bold shadow-[0_2px_12px_0_rgba(59,130,246,0.10)] ring-2 ring-blue-200'
                      : 'hover:bg-blue-100 hover:text-blue-700 text-blue-900'}
                  `}
                  style={{ boxShadow: active ? '0 2px 12px 0 rgba(59,130,246,0.10)' : undefined }}
                >
                  <span className={`transition-transform duration-200 flex items-center justify-center ${active ? 'scale-125 text-blue-600 drop-shadow-[0_0_8px_rgba(59,130,246,0.25)]' : 'text-blue-500 group-hover:scale-110'} ${collapsed ? 'text-lg' : 'text-2xl'}`}>{item.icon}</span>
                  <span className={`transition-all duration-200 text-base whitespace-nowrap ${collapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100 w-auto ml-2'}`}>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className={`p-4 text-xs text-blue-400 mt-auto transition-all duration-200 ${collapsed ? 'text-center' : ''}`}>
        <span className={`${collapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100 w-auto'} transition-all duration-200`}>
          &copy; {new Date().getFullYear()} Identity
        </span>
      </div>
    </aside>
  );
}

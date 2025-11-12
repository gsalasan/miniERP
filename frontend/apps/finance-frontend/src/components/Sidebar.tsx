import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  HomeIcon,
  DocumentTextIcon,
  BanknotesIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  Bars3Icon,
  XMarkIcon,
  ChevronDownIcon,
<<<<<<< HEAD
  RectangleGroupIcon,
=======
>>>>>>> origin/main
} from '@heroicons/react/24/outline';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

interface MenuItem {
  name: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  children?: MenuItem[];
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen }) => {
  const location = useLocation();
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['finance']);

  const menuItems: MenuItem[] = [
    {
      name: 'Dashboard',
      path: '/dashboard',
      icon: HomeIcon,
    },
    {
      name: 'Finance',
      path: '/finance',
      icon: BanknotesIcon,
      children: [
        {
<<<<<<< HEAD
          name: 'Akuntansi',
=======
          name: 'Chart of Accounts',
>>>>>>> origin/main
          path: '/coa',
          icon: DocumentTextIcon,
        },
        {
<<<<<<< HEAD
          name: 'Kokpit Kebijakan',
          path: '/policy-cockpit',
=======
          name: 'Kokpit Finansial',
          path: '/financial-cockpit',
>>>>>>> origin/main
          icon: ChartBarIcon,
        },
      ],
    },
    {
      name: 'Settings',
      path: '/settings',
      icon: Cog6ToothIcon,
    },
  ];

  const toggleMenu = (menuName: string) => {
    setExpandedMenus((prev) =>
      prev.includes(menuName)
        ? prev.filter((name) => name !== menuName)
        : [...prev, menuName]
    );
  };

  const isActive = (path: string) => location.pathname === path;

  const isParentActive = (children?: MenuItem[]) => {
    return children?.some((child) => location.pathname === child.path);
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-screen transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } w-64 bg-primary-dark text-white shadow-2xl`}
      >
        {/* Header */}
        <div className="flex flex-col items-center justify-center pt-1 bg-gradient-to-b from-accent-gold to-accent-gold/90 border-b-4 border-accent-gold">
          {/* Logo Image */}
          <div className="w-36 h-36 flex items-center justify-center">
            <img 
              src="/logo.png" 
              alt="Logo" 
              className="w-full h-full object-contain"
            />
          </div>
          <p className="text-sm font-semibold text-primary-dark -mt-6 pb-0.5">Finance Module</p>
          <button
            onClick={() => setIsOpen(false)}
            className="lg:hidden text-primary-dark hover:text-primary transition-colors absolute top-2 right-2"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-6 px-3">
          <div className="space-y-1">
            {menuItems.map((item) => (
              <div key={item.name}>
                {item.children ? (
                  // Menu with submenu
                  <div>
                    <button
                      onClick={() => toggleMenu(item.name.toLowerCase())}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group ${
                        isParentActive(item.children)
                          ? 'bg-accent-gold text-primary-dark shadow-md'
                          : 'text-primary-light hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <item.icon
                          className={`h-5 w-5 transition-colors ${
                            isParentActive(item.children)
                              ? 'text-primary-dark'
                              : 'text-primary-light group-hover:text-white'
                          }`}
                        />
                        <span className="font-medium">{item.name}</span>
                      </div>
                      <ChevronDownIcon
                        className={`h-4 w-4 transition-transform duration-200 ${
                          expandedMenus.includes(item.name.toLowerCase())
                            ? 'rotate-180'
                            : ''
                        }`}
                      />
                    </button>
                    
                    {/* Submenu */}
                    {expandedMenus.includes(item.name.toLowerCase()) && (
                      <div className="ml-4 mt-1 space-y-1">
                        {item.children.map((child) => (
                          <Link
                            key={child.path}
                            to={child.path}
                            onClick={() => setIsOpen(false)}
                            className={`flex items-center space-x-3 px-4 py-2.5 rounded-lg transition-all duration-200 ${
                              isActive(child.path)
                                ? 'bg-accent-gold text-primary-dark shadow-md font-semibold'
                                : 'text-primary-light hover:bg-white/5 hover:text-white'
                            }`}
                          >
                            <div className="w-2 h-2 rounded-full bg-current opacity-50" />
                            <span className="text-sm font-medium">{child.name}</span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  // Regular menu item
                  <Link
                    to={item.path}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group ${
                      isActive(item.path)
                        ? 'bg-accent-gold text-primary-dark shadow-md'
                        : 'text-primary-light hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <item.icon
                        className={`h-5 w-5 transition-colors ${
                          isActive(item.path)
                            ? 'text-primary-dark'
                            : 'text-primary-light group-hover:text-white'
                        }`}
                      />
                      <span className="font-medium">{item.name}</span>
                    </div>
                    {item.badge && (
                      <span className="px-2 py-1 text-xs font-bold bg-danger text-white rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                )}
              </div>
            ))}
          </div>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-primary-light/20">
          <div className="flex items-center space-x-3 px-3 py-2 rounded-lg bg-primary-light/10">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-light to-accent-gold rounded-full flex items-center justify-center">
              <span className="text-sm font-bold">AD</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">Admin User</p>
              <p className="text-xs text-gray-400 truncate">admin@minierp.com</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;

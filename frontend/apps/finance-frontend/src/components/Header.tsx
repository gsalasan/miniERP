import React from 'react';
import {
  Bars3Icon,
  MagnifyingGlassIcon,
  BellIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';

interface HeaderProps {
  toggleSidebar: () => void;
  title?: string;
}

const Header: React.FC<HeaderProps> = ({ toggleSidebar, title }) => {
  return (
    <header className="sticky top-0 z-30 bg-surface-card border-b border-gray-200 shadow-sm">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Left Section */}
        <div className="flex items-center space-x-4">
          <button
            onClick={toggleSidebar}
            className="lg:hidden p-2 rounded-lg hover:bg-surface-bg transition-colors"
          >
            <Bars3Icon className="h-6 w-6 text-text-secondary" />
          </button>
          
          <div className="hidden lg:block">
            <h1 className="text-2xl font-bold text-primary-dark">{title || 'Finance Module'}</h1>
            <p className="text-sm text-text-secondary">Manage your financial data</p>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-4">
          {/* Search */}
          <div className="hidden md:flex items-center space-x-2 bg-surface-bg rounded-lg px-4 py-2">
            <MagnifyingGlassIcon className="h-5 w-5 text-text-secondary" />
            <input
              type="text"
              placeholder="Search..."
              className="bg-transparent border-none focus:outline-none text-sm text-text-primary placeholder-text-secondary w-64"
            />
          </div>

          {/* Notifications */}
          <button className="relative p-2 rounded-lg hover:bg-surface-bg transition-colors">
            <BellIcon className="h-6 w-6 text-text-secondary" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-danger rounded-full"></span>
          </button>

          {/* Profile */}
          <button className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-surface-bg transition-colors">
            <UserCircleIcon className="h-8 w-8 text-text-secondary" />
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium text-text-primary">Admin</p>
              <p className="text-xs text-text-secondary">Finance Admin</p>
            </div>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;

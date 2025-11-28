import React, { useState } from 'react';
import Sidebar from './Sidebar';
import { Bars3Icon } from '@heroicons/react/24/outline';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50/30 via-pink-50/20 to-blue-50/30">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      {/* Main Content */}
      <div className="lg:pl-64">
        {/* Mobile Menu Button */}
        <div className="lg:hidden fixed top-4 left-4 z-40">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 bg-white rounded-lg shadow-lg hover:shadow-xl transition-all"
          >
            <Bars3Icon className="h-6 w-6 text-gray-700" />
          </button>
        </div>

        {/* Page Content */}
        <main className="p-4 md:p-6 min-h-screen">
          {children}
        </main>

        {/* Footer */}
        <footer className="bg-white/70 backdrop-blur-sm border-t border-purple-100 py-4 px-6">
          <div className="flex flex-col md:flex-row justify-between items-center text-sm text-gray-600">
            <p className="font-medium">&copy; 2025 miniERP Finance. All rights reserved.</p>
            <div className="flex space-x-6 mt-2 md:mt-0">
              <a href="#" className="hover:text-purple-400 transition-colors font-medium">Privacy</a>
              <a href="#" className="hover:text-purple-400 transition-colors font-medium">Terms</a>
              <a href="#" className="hover:text-purple-400 transition-colors font-medium">Support</a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Layout;

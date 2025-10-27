import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
}

const Layout: React.FC<LayoutProps> = ({ children, title }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-surface-bg">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      {/* Main Content */}
      <div className="lg:pl-64">
        {/* Header */}
        <Header toggleSidebar={() => setSidebarOpen(!sidebarOpen)} title={title} />

        {/* Page Content */}
        <main className="p-6">
          {children}
        </main>

        {/* Footer */}
        <footer className="bg-surface-card border-t border-gray-200 py-4 px-6 mt-8">
          <div className="flex flex-col md:flex-row justify-between items-center text-sm text-text-secondary">
            <p>&copy; 2025 miniERP. All rights reserved.</p>
            <div className="flex space-x-6 mt-2 md:mt-0">
              <a href="#" className="hover:text-primary-light transition-colors">Privacy</a>
              <a href="#" className="hover:text-primary-light transition-colors">Terms</a>
              <a href="#" className="hover:text-primary-light transition-colors">Support</a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Layout;

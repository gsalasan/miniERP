
import React, { createContext, useContext, useState } from 'react';
import { LogOut } from 'lucide-react';
import Sidebar from './Sidebar';

// Context untuk sinkronisasi collapse sidebar
const SidebarCollapseContext = createContext<{collapsed: boolean, setCollapsed: (v: boolean) => void}>({collapsed: false, setCollapsed: () => {}});


export function useSidebarCollapse() {
  return useContext(SidebarCollapseContext);
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <SidebarCollapseContext.Provider value={{collapsed, setCollapsed}}>
      <div className="flex min-h-screen bg-gray-100 transition-all duration-300">
        <Sidebar />
        <main className="flex-1 w-full flex flex-col min-h-screen">
          {/* Top Navbar */}
          <header className="sticky top-0 z-20 bg-white border-b border-blue-100 shadow-sm">
            <div className="px-4 md:px-8 lg:px-10 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* No title text per request */}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    try {
                      localStorage.removeItem('token');
                      localStorage.removeItem('cross_app_token');
                      localStorage.removeItem('cross_app_user');
                      localStorage.removeItem('cross_app_timestamp');
                    } catch {}
                    window.location.href = 'http://localhost:3000';
                  }}
                  className="p-0 mr-1 md:mr-2 bg-transparent text-black hover:text-neutral-700 transition-colors inline-flex items-center"
                  title="Keluar"
                  aria-label="Keluar"
                >
                  <LogOut size={20} strokeWidth={2.75} />
                </button>
              </div>
            </div>
          </header>

          {/* Page content */}
          <div className="flex-1 overflow-auto">
            {children}
          </div>
        </main>
      </div>
    </SidebarCollapseContext.Provider>
  );
}

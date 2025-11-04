
import React, { createContext, useContext, useState } from 'react';
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
        <main className="flex-1 p-8 w-full flex flex-col min-h-screen">
          {children}
        </main>
      </div>
    </SidebarCollapseContext.Provider>
  );
}

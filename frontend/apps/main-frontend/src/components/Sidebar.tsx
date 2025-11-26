
import React from "react";
import { Home, Users } from 'lucide-react';

interface Module {
  id: string;
  name: string;
  url: string;
  icon: JSX.Element;
  color: string;
  description: string;
}

interface SidebarProps {
  modules: Module[];
  onModuleClick: (module: Module) => void;
  userRoles: string[];
}

const roleModuleMap: Record<string, string[]> = {
  "cost-estimation": ["PROJECT_MANAGER", "PROJECT_ENGINEER", "CEO"],
  crm: ["SALES", "SALES_MANAGER", "CEO"],
  hr: ["HR_ADMIN", "FINANCE_ADMIN", "CEO"],
  finance: ["FINANCE_ADMIN", "ASSET_ADMIN", "CEO"],
  procurement: ["PROCUREMENT_ADMIN", "CEO"],
  project: ["PROJECT_MANAGER", "PROJECT_ENGINEER", "CEO"],
};



interface SidebarOpenProps extends SidebarProps {
  open?: boolean;
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarOpenProps> = ({ modules, onModuleClick, userRoles, open = true, onClose }) => {
  // Only show modules user has access to
  const allowedModules = modules.filter((m) =>
    (roleModuleMap[m.id]?.includes("*") || userRoles.some((role) => roleModuleMap[m.id]?.includes(role)))
  );

  // Selalu mode hamburger (overlay), baik desktop maupun mobile
  const isMobile = true;

  return (
    <>
      {/* Overlay, selalu muncul jika open dan onClose ada */}
      {open && onClose && (
        <div
          onClick={onClose}
          style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", background: "#0004", zIndex: 1998 }}
        />
      )}
      {/* Sidebar overlay, selalu muncul jika open */}
      {open && (
        <nav
          className="sidebar"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: 220,
            height: "100vh",
            background: "#fff",
            boxShadow: "0 4px 24px 0 rgba(37,99,235,0.10), 0 1.5px 8px #0001",
            zIndex: 2000,
            transition: "left 0.22s cubic-bezier(.4,0,.2,1), box-shadow 0.18s",
            padding: '32px 12px 12px 12px',
            display: "flex",
            flexDirection: "column",
            borderTopRightRadius: 24,
            borderBottomRightRadius: 24,
            borderRight: '2px solid #e5e7eb',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
          }}
        >
          {/* Tombol close selalu ada */}
          {onClose && (
            <button
              onClick={onClose}
              style={{ position: "absolute", top: 7, right: 7, background: "none", border: "none", fontSize: 15, color: "#aaa", cursor: "pointer" }}
              aria-label="Close sidebar"
            >
              ×
            </button>
          )}
          <h3 style={{
            marginBottom: 16,
            color: "#2563eb",
            fontWeight: 700,
            fontSize: 15,
            letterSpacing: 0.08,
            paddingLeft: 2,
            textTransform: 'uppercase',
          }}>Business Modules</h3>
          <div style={{height:2, background:'#e0e7ff', borderRadius:2, marginBottom:22, opacity:0.8}} />
          {allowedModules.length === 0 && (
            <div style={{ color: '#aaa', fontSize: 15 }}>No accessible modules</div>
          )}
          {allowedModules.map((module) => {
            const isActive = typeof window !== 'undefined' && window.location.pathname.startsWith(module.url);
            return (
              <button
                key={module.id}
                onClick={() => {
                  onModuleClick(module);
                  if (onClose) onClose();
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  background: isActive ? "#e0e7ff" : "#fff",
                  border: "none",
                  color: isActive ? "#2563eb" : "#22223b",
                  fontWeight: isActive ? 700 : 500,
                  fontSize: 16,
                  marginBottom: 14,
                  cursor: "pointer",
                  borderRadius: 14,
                  padding: '14px 18px',
                  width: "100%",
                  textAlign: "left",
                  transition: "background 0.16s, color 0.16s, font-weight 0.16s, box-shadow 0.16s",
                  boxShadow: isActive ? "0 2px 12px #2563eb22" : "0 1px 4px #0001",
                  letterSpacing: 0.01,
                  fontFamily: "inherit",
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = '#dbeafe';
                  e.currentTarget.style.color = '#2563eb';
                  e.currentTarget.style.boxShadow = '0 4px 16px #2563eb22';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = isActive ? '#e0e7ff' : '#fff';
                  e.currentTarget.style.color = isActive ? '#2563eb' : '#22223b';
                  e.currentTarget.style.boxShadow = isActive ? '0 2px 12px #2563eb22' : '0 1px 4px #0001';
                }}
              >
                <span style={{
                  background: isActive ? '#2563eb22' : '#e0e7ff',
                  color: isActive ? '#2563eb' : '#2563eb',
                  fontSize: 22,
                  borderRadius: '50%',
                  width: 32,
                  height: 32,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 2,
                  boxShadow: isActive ? '0 2px 8px #2563eb22' : 'none',
                  transition: 'background 0.16s, color 0.16s',
                }}>{module.icon}</span>
                <span style={{
                  fontWeight: isActive ? 700 : 500,
                  fontSize: 16,
                  letterSpacing: 0.01,
                  fontFamily: "inherit",
                }}>{module.name}</span>
              </button>
            );
          })}
        </nav>
      )}
    </>
  );
};

export default Sidebar;

import React, { useEffect, useState } from 'react';
import { fetchModulesByRoles, fetchModulesByRole } from '../api/employeeApi';
import NotificationBell from './NotificationBell';
import AttendanceHistory from './AttendanceHistory';

type ModuleItem = {
  id: string;
  name: string;
  icon?: string;
  route?: string;
};

// Fallback module list used when backend returns nothing.
// Keep this small and safe as default options for the dashboard.
const MODULES: ModuleItem[] = [
  { id: 'dashboard', name: 'Dashboard', icon: '📊', route: '/dashboard' },
  { id: 'attendance', name: 'Attendance', icon: '🕒', route: '/attendance' },
  { id: 'employees', name: 'Employees', icon: '👥', route: '/employees' },
  { id: 'payroll', name: 'Payroll', icon: '💸', route: '/payroll' },
  { id: 'leave', name: 'Leave', icon: '🌴', route: '/leave' },
];

// Mapping of role -> allowed module ids used as fallback when backend is not available.
const ROLE_MODULES: Record<string, string[]> = {
  hr: ['dashboard', 'attendance', 'employees', 'leave'],
  finance: ['dashboard', 'attendance', 'payroll'],
  manager: ['dashboard', 'attendance', 'employees'],
};

interface DashboardMenuProps {
  // provide either `roles` (multi) or `role` (single)
  roles?: string[];
  role?: string;
  // optional navigation handler (router-aware)
  onNavigate?: (route?: string) => void;
  // show notification bell above modules
  showBell?: boolean;
  // show attendance history below
  showAttendanceHistory?: boolean;
  // optionally pass attendance records to display
  attendanceRecords?: Array<{ id?: string | number; type?: string; time: string; note?: string }>;
}

const DashboardMenu: React.FC<DashboardMenuProps> = ({ roles, role, onNavigate, showBell = true, showAttendanceHistory = true, attendanceRecords = [] }) => {
  const [modules, setModules] = useState<ModuleItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        // Try backend first (supports single or multi-role)
        let fetched: any[] = [];
        try {
          fetched = roles && roles.length > 0
            ? await fetchModulesByRoles(roles)
            : role
              ? await fetchModulesByRole(role)
              : [];
        } catch (e) {
          fetched = [];
        }

        // If backend returns nothing, fall back to local mapping
        if (!fetched || fetched.length === 0) {
          // If any role is 'ceo', grant all modules
          const roleList = roles && roles.length > 0 ? roles : role ? [role] : [];
          if (roleList.includes('ceo')) {
            fetched = MODULES;
          } else {
            const ids = new Set<string>();
            for (const r of roleList) {
              const allowed = ROLE_MODULES[r] || [];
              for (const id of allowed) ids.add(id);
            }
            // ensure attendance is always available to everyone
            ids.add('attendance');
            fetched = MODULES.filter((m) => ids.has(m.id));
          }
        }

        if (mounted) setModules(fetched);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [roles, role]);

  // Navigation helper — call `onNavigate` when provided, otherwise use window navigation.
  const handleClick = (item: ModuleItem) => {
    if (onNavigate) {
      onNavigate(item.route);
      return;
    }
    if (item.route) window.location.href = item.route;
  };

  if (loading) return <div>Loading modules...</div>;

  return (
    <div>
      {/* Bell icon at the top */}
      {showBell && <NotificationBell count={0} onClick={() => { /* open notifications panel */ }} />}

      {/* Business Modules */}
      {(!modules || modules.length === 0) ? (
        <div>No modules available</div>
      ) : (
        <div className="dashboard-menu" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {modules.map((m) => (
            <div
              key={m.id}
              className="menu-card"
              role="button"
              tabIndex={0}
              onClick={() => handleClick(m)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleClick(m);
                }
              }}
              style={{
                border: '1px solid #eee',
                padding: 12,
                borderRadius: 8,
                minWidth: 140,
                cursor: 'pointer',
                textAlign: 'center',
              }}
            >
              <div className="menu-icon" style={{ fontSize: 24 }}>{m.icon || '📁'}</div>
              <div className="menu-name" style={{ marginTop: 8 }}>{m.name}</div>
            </div>
          ))}
        </div>
      )}

      {/* Riwayat Absen (Attendance History) below modules */}
      {showAttendanceHistory && (
        <div style={{ marginTop: 24 }}>
          <AttendanceHistory records={attendanceRecords} />
        </div>
      )}
    </div>
  );
};

export default DashboardMenu;

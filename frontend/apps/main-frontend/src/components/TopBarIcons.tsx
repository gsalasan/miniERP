import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { checkSubordinates, getTeamRequests, getAllApprovalRequests } from '../api/approvals';
import { getMyPermissions, getMyOvertimes, getMyReimbursements, getMyLeaves } from '../api/requests';

type Request = {
  id: string;
  requestType: 'leave' | 'permission' | 'overtime' | 'reimbursement';
  employee?: { full_name: string; position?: string };
  created_at: string;
  status: string;
  approved_at?: string;
  updated_at?: string;
  [key: string]: any;
};

type NotificationType = 'approval_needed' | 'status_update';

type Notification = {
  id: string;
  type: NotificationType;
  requestType: 'leave' | 'permission' | 'overtime' | 'reimbursement';
  message: string;
  timestamp: string;
  status?: string;
  employeeName?: string;
  read?: boolean;
};

export function NotificationBell({ onClick }: { onClick?: () => void; count?: number }) {
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [isManager, setIsManager] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadNotifications();
    
    // Refresh every 30 seconds
    const interval = setInterval(loadNotifications, 30000);
    
    // Close dropdown when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      clearInterval(interval);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const userStr = localStorage.getItem('user');
      if (!userStr) return;
      
      const user = JSON.parse(userStr);
      const notifs: Notification[] = [];

      // Check if user is manager - show pending approvals
      if (user.employee_id) {
        const subCheck = await checkSubordinates(user.employee_id).catch(() => ({ has_subordinates: false }));
        
        if (subCheck.has_subordinates || (user.roles && user.roles.includes('HR_ADMIN'))) {
          setIsManager(true);
          let data;
          if (user.roles && user.roles.includes('HR_ADMIN')) {
            data = await getAllApprovalRequests();
          } else {
            data = await getTeamRequests(user.employee_id);
          }

          const allRequests: Request[] = [
            ...data.leave_requests.map((r: any) => ({ ...r, requestType: 'leave' as const })),
            ...data.permission_requests.map((r: any) => ({ ...r, requestType: 'permission' as const })),
            ...data.overtime_requests.map((r: any) => ({ ...r, requestType: 'overtime' as const })),
            ...data.reimbursement_requests.map((r: any) => ({ ...r, requestType: 'reimbursement' as const })),
          ];

          allRequests.forEach(req => {
            notifs.push({
              id: req.id,
              type: 'approval_needed',
              requestType: req.requestType,
              message: `${req.employee?.full_name || 'Employee'} submitted ${req.requestType} request`,
              timestamp: req.created_at,
              employeeName: req.employee?.full_name,
            });
          });
        }
      }

      // Load user's own requests - show status updates
      const [permissions, overtimes, reimbursements, leaves] = await Promise.all([
        getMyPermissions().catch(() => []),
        getMyOvertimes().catch(() => []),
        getMyReimbursements().catch(() => []),
        getMyLeaves().catch(() => []),
      ]);

      const myRequests = [
        ...(Array.isArray(permissions) ? permissions : []).map((r: any) => ({ ...r, requestType: 'permission' as const })),
        ...(Array.isArray(overtimes) ? overtimes : []).map((r: any) => ({ ...r, requestType: 'overtime' as const })),
        ...(Array.isArray(reimbursements) ? reimbursements : []).map((r: any) => ({ ...r, requestType: 'reimbursement' as const })),
        ...(Array.isArray(leaves) ? leaves : []).map((r: any) => ({ ...r, requestType: 'leave' as const })),
      ];

      // Show recently approved/rejected requests (within 24 hours)
      const oneDayAgo = new Date().getTime() - 24 * 60 * 60 * 1000;
      myRequests.forEach((req: Request) => {
        if (req.status !== 'PENDING') {
          const updatedTime = req.approved_at || req.updated_at || req.created_at;
          if (new Date(updatedTime).getTime() > oneDayAgo) {
            // Get request details
            let details = '';
            if (req.requestType === 'permission') {
              details = `${(req as any).permission_type || ''} - ${new Date((req as any).start_time).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}`;
            } else if (req.requestType === 'leave') {
              details = `${(req as any).leave_type || ''} - ${(req as any).total_days || 0} days`;
            } else if (req.requestType === 'overtime') {
              details = `${(req as any).overtime_code || ''} - ${new Date((req as any).overtime_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}`;
            } else if (req.requestType === 'reimbursement') {
              details = `${(req as any).reimbursement_type || ''} - Rp ${((req as any).amount || 0).toLocaleString()}`;
            }
            
            const statusText = req.status === 'APPROVED' ? 'Approved' : 'Rejected';
            notifs.push({
              id: `${req.id}-status`,
              type: 'status_update',
              requestType: req.requestType,
              message: `${statusText} - ${details}`,
              timestamp: updatedTime,
              status: req.status,
            });
          }
        }
      });

      // Sort by timestamp desc
      notifs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      // Check read status from localStorage
      const readIds = JSON.parse(localStorage.getItem('notifications_read') || '[]');
      notifs.forEach(n => {
        n.read = readIds.includes(n.id);
      });
      
      setNotifications(notifs);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRequestLabel = (type: string) => {
    const labels: Record<string, string> = {
      leave: '📅 Cuti',
      permission: '🚪 Izin',
      overtime: '⏰ Lembur',
      reimbursement: '💰 Reimbursement'
    };
    return labels[type] || type;
  };

  const handleBellClick = () => {
    if (onClick) onClick();
    setShowDropdown(!showDropdown);
    if (!showDropdown) loadNotifications();
  };

  const handleNotificationClick = (notif: Notification) => {
    // Mark as read
    markAsRead(notif.id);
    
    if (notif.type === 'approval_needed') {
      navigate('/approvals');
    } else {
      navigate('/my-requests');
    }
    setShowDropdown(false);
  };

  const markAsRead = (notifId: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === notifId ? { ...n, read: true } : n)
    );
    
    // Save to localStorage
    const saved = localStorage.getItem('notifications_read') || '[]';
    const readIds = JSON.parse(saved);
    if (!readIds.includes(notifId)) {
      readIds.push(notifId);
      localStorage.setItem('notifications_read', JSON.stringify(readIds));
    }
  };

  const markAllAsRead = () => {
    const allIds = notifications.map(n => n.id);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    localStorage.setItem('notifications_read', JSON.stringify(allIds));
  };

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      <button
        onClick={handleBellClick}
        style={{
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          position: 'relative',
          marginRight: 16,
          padding: 4,
          fontSize: 0,
        }}
        aria-label="Notifications"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
        </svg>
        {notifications.filter(n => !n.read).length > 0 && (
          <span
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              background: '#e55353',
              color: 'white',
              borderRadius: 10,
              padding: '2px 6px',
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            {notifications.filter(n => !n.read).length}
          </span>
        )}
      </button>

      {showDropdown && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: 8,
            background: 'white',
            borderRadius: 12,
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            width: 'min(400px, calc(100vw - 32px))',
            maxHeight: 'min(500px, 80vh)',
            overflowY: 'auto',
            zIndex: 1000,
          }}
        >
          <div style={{ padding: '16px', borderBottom: '1px solid #E5E7EB' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#111827' }}>
                Notifications {notifications.filter(n => !n.read).length > 0 && `(${notifications.filter(n => !n.read).length})`}
              </h3>
              {notifications.filter(n => !n.read).length > 0 && (
                <button
                  onClick={markAllAsRead}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#3B82F6',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    padding: '4px 8px',
                  }}
                >
                  Tandai Semua
                </button>
              )}
            </div>
            {isManager && (
              <button
                onClick={() => {
                  navigate('/approvals?tab=history');
                  setShowDropdown(false);
                }}
                style={{
                  marginTop: 8,
                  width: '100%',
                  padding: '8px 12px',
                  background: '#F3F4F6',
                  border: 'none',
                  borderRadius: 8,
                  color: '#374151',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
                Lihat Semua Riwayat
              </button>
            )}
          </div>

          {loading ? (
            <div style={{ padding: 32, textAlign: 'center', color: '#6B7280' }}>
              Loading...
            </div>
          ) : notifications.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center', color: '#6B7280' }}>
              No new notifications
            </div>
          ) : (
            <div>
              {notifications.slice(0, 10).map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  style={{
                    padding: '14px 16px',
                    borderBottom: '1px solid #F3F4F6',
                    cursor: 'pointer',
                    transition: 'background 0.15s',
                    borderLeft: notif.type === 'status_update' 
                      ? `3px solid ${notif.status === 'APPROVED' ? '#10B981' : '#EF4444'}`
                      : '3px solid #3B82F6',
                    background: notif.read ? '#F9FAFB' : 'white',
                    opacity: notif.read ? 0.7 : 1,
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = notif.read ? '#F3F4F6' : '#F9FAFB'}
                  onMouseLeave={(e) => e.currentTarget.style.background = notif.read ? '#F9FAFB' : 'white'}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{ 
                      minWidth: 36, 
                      height: 36, 
                      borderRadius: 8,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: notif.type === 'status_update'
                        ? (notif.status === 'APPROVED' ? '#D1FAE5' : '#FEE2E2')
                        : '#DBEAFE',
                      fontSize: 16,
                    }}>
                      {notif.type === 'status_update' ? (
                        notif.status === 'APPROVED' ? (
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                        ) : (
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                          </svg>
                        )
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                          <polyline points="14 2 14 8 20 8"></polyline>
                        </svg>
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ 
                        fontSize: 13, 
                        fontWeight: 600, 
                        color: '#111827',
                        marginBottom: 2,
                      }}>
                        {notif.type === 'status_update' 
                          ? `${notif.requestType.charAt(0).toUpperCase() + notif.requestType.slice(1)} Request ${notif.status === 'APPROVED' ? 'Approved' : 'Rejected'}`
                          : `New ${notif.requestType.charAt(0).toUpperCase() + notif.requestType.slice(1)} Request`
                        }
                      </div>
                      <div style={{ 
                        fontSize: 12, 
                        color: '#6B7280',
                        lineHeight: 1.4,
                        wordBreak: 'break-word',
                      }}>
                        {notif.message}
                      </div>
                      <div style={{ 
                        fontSize: 11, 
                        color: '#9CA3AF',
                        marginTop: 4,
                      }}>
                        {new Date(notif.timestamp).toLocaleString('id-ID', { 
                          day: '2-digit', 
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {notifications.length > 10 && (
                <div
                  style={{
                    padding: '12px 16px',
                    textAlign: 'center',
                    background: '#F9FAFB',
                    color: '#3B82F6',
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  Showing 10 of {notifications.length} notifications
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function LogoutButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        padding: 4,
        marginLeft: 8,
        fontSize: 0,
      }}
      aria-label="Logout"
      title="Logout"
    >
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" y1="12" x2="9" y2="12" />
      </svg>
    </button>
  );
}

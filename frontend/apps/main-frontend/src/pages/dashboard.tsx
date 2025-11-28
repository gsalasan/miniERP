import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AttendanceWidget from "../components/AttendanceWidgetNew";
import { NotificationBell, LogoutButton } from "../components/TopBarIcons";
import { AttendanceHistory, AttendanceHistoryItem } from "../components/AttendanceHistory";
import { getMyAttendances } from '../api/attendance';
import { checkSubordinates, getTeamRequests, getAllApprovalRequests } from '../api/approvals';
import Sidebar from "../components/Sidebar";
import MobileHamburger from "../components/Header";

interface User {
  id: number;
  email: string;
  roles: string[];
  employee_id?: string;
}

interface Module {
  id: string;
  name: string;
  description: string;
  icon: JSX.Element;
  url: string;
  color: string;
  category: "business" | "admin";
}


const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  // State untuk attendance history
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  
  // State untuk approval access
  const [hasSubordinates, setHasSubordinates] = useState(false);
  const [isHRAdmin, setIsHRAdmin] = useState(false);
  const [teamPendingCount, setTeamPendingCount] = useState(0);
  const [allPendingCount, setAllPendingCount] = useState(0);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Ambil attendance history ketika user sudah ada
  useEffect(() => {
    if (!user) return;
    setLoadingHistory(true);
    getMyAttendances(undefined, 1, 10)  // Ambil 10 record untuk filter yang sudah complete
      .then((res) => {
        console.log('Raw attendance data:', res.data); // Debug log
        
        // Filter: hanya tampilkan yang sudah checkout (complete)
        // ATAU yang belum checkout tapi bukan hari ini (hari sebelumnya)
        const today = new Date().toDateString();
        const filteredData = (res.data || []).filter((a) => {
          // Jika sudah checkout, tampilkan
          if (a.check_out_time) return true;
          // Jika belum checkout, cek apakah bukan hari ini
          if (!a.check_in_time) return false;
          const checkInDate = new Date(a.check_in_time).toDateString();
          return checkInDate !== today; // Tampilkan hanya jika bukan hari ini
        });
        
        setAttendanceHistory(
          filteredData.slice(0, 2).map((a) => {  // Ambil 2 teratas setelah filter
            // Parse datetime to HH:MM in local time
            const formatTime = (dateTime: any) => {
              if (!dateTime) return undefined;
              const date = new Date(dateTime);
              if (isNaN(date.getTime())) return undefined;
              return date.toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: false 
              });
            };
            
            return {
              date: a.date,
              checkIn: formatTime(a.check_in_time),
              checkOut: formatTime(a.check_out_time),
              note: a.check_in_location || undefined,
            };
          })
        );
        setHistoryError(null);
      })
      .catch((err) => {
        setHistoryError(err.message || 'Gagal mengambil riwayat absen');
      })
      .finally(() => setLoadingHistory(false));
  }, [user]);

  // Check approval access (manager or HR Admin)
  useEffect(() => {
    if (!user || !user.employee_id) return;

    const checkApprovalAccess = async () => {
      try {
        // 1. Check if user has subordinates (is a manager)
        const subCheck = await checkSubordinates(user.employee_id!);
        if (subCheck.has_subordinates) {
          setHasSubordinates(true);
          
          // Fetch team pending requests count
          try {
            const teamReqs = await getTeamRequests(user.employee_id!);
            setTeamPendingCount(teamReqs.total || 0);
          } catch (error) {
            console.error('Error fetching team requests:', error);
          }
        }

        // 2. Check if user is HR Admin
        if (user.roles && user.roles.includes('HR_ADMIN')) {
          setIsHRAdmin(true);
          
          // Fetch all pending requests count
          try {
            const allReqs = await getAllApprovalRequests();
            setAllPendingCount(allReqs.total || 0);
          } catch (error) {
            console.error('Error fetching all requests:', error);
          }
        }
      } catch (error) {
        console.error('Error checking approval access:', error);
      }
    };

    checkApprovalAccess();
  }, [user]);

  // Available modules
  const modules: Module[] = [
    {
      id: "cost-estimation",
      name: "Cost Estimation",
      description: "Manage material costs and project estimations",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path
            d="M11.8 10.9C9.53 10.31 8.8 9.7 8.8 8.75C8.8 7.66 9.81 6.9 11.5 6.9C13.28 6.9 13.94 7.75 14 9H16.21C16.14 7.28 15.09 5.7 13 5.19V3H10V5.16C8.06 5.58 6.5 6.84 6.5 8.77C6.5 11.08 8.41 12.23 11.2 12.9C13.7 13.5 14.2 14.38 14.2 15.31C14.2 16 13.71 17.1 11.5 17.1C9.44 17.1 8.63 16.18 8.5 15H6.32C6.44 17.19 8.08 18.42 10 18.83V21H13V18.85C14.95 18.5 16.5 17.35 16.5 15.3C16.5 12.46 14.07 11.5 11.8 10.9Z"
            fill="currentColor"
          />
        </svg>
      ),
      url: "http://localhost:3011", // Engineering frontend URL
      color: "#10B981",
      category: "business",
    },
    {
      id: "crm",
      name: "CRM",
      description: "Customer Relationship Management",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path
            d="M16 4C18.2 4 20 5.8 20 8C20 10.2 18.2 12 16 12C13.8 12 12 10.2 12 8C12 5.8 13.8 4 16 4ZM16 14C20.4 14 24 15.8 24 18V20H8V18C8 15.8 11.6 14 16 14ZM8 12C10.2 12 12 10.2 12 8C12 5.8 10.2 4 8 4C5.8 4 4 5.8 4 8C4 10.2 5.8 12 8 12ZM8 14C3.6 14 0 15.8 0 18V20H8V18C8 16.9 8.7 15.5 10.1 14.7C9.5 14.3 8.8 14 8 14Z"
            fill="currentColor"
          />
        </svg>
      ),
      url: "http://localhost:3010", // CRM frontend URL
      color: "#3B82F6",
      category: "business",
    },
    {
      id: "hr",
      name: "Human Resources",
      description: "Employee and HR management",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z"
            fill="currentColor"
          />
        </svg>
      ),
      url: "http://localhost:3013", // HR frontend URL
      color: "#F59E0B",
      category: "business",
    },
    {
      id: "finance",
      name: "Finance",
      description: "Financial management and accounting",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path
            d="M16 6L18.29 8.29L13.41 13.17L9.41 9.17L2 16.59L3.41 18L9.41 12L13.41 16L19.71 9.7L22 12V6H16Z"
            fill="currentColor"
          />
        </svg>
      ),
      url: "http://localhost:3012", // Finance frontend URL
      color: "#8B5CF6",
      category: "business",
    },
    {
      id: "procurement",
      name: "Procurement",
      description: "Purchase orders and supplier management",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path
            d="M19 7H16V6C16 3.79 14.21 2 12 2C9.79 2 8 3.79 8 6V7H5C3.9 7 3 7.9 3 9V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V9C21 7.9 20.1 7 19 7ZM10 6C10 4.9 10.9 4 12 4C13.1 4 14 4.9 14 6V7H10V6ZM19 19H5V9H19V19ZM12 12C10.9 12 10 12.9 10 14C10 15.1 10.9 16 12 16C13.1 16 14 15.1 14 14C14 12.9 13.1 12 12 12Z"
            fill="currentColor"
          />
        </svg>
      ),
      url: "http://localhost:3015", // Procurement frontend URL (placeholder)
      color: "#EF4444",
      category: "business",
    },
    {
      id: "project",
      name: "Project Management",
      description: "Project planning and tracking",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path
            d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.89 22 5.99 22H18C19.1 22 20 21.1 20 20V8L14 2ZM18 20H6V4H13V9H18V20ZM8 15.01L9.41 16.42L11 14.84L8 11.83L5 14.84L6.41 16.25L8 15.01Z"
            fill="currentColor"
          />
        </svg>
      ),
      url: "http://localhost:3016", // Project frontend URL (placeholder)
      color: "#6B7280",
      category: "business",
    },
    {
      id: "identity",
      name: "Identity",
      description: "User management and access control",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z"
            fill="currentColor"
          />
        </svg>
      ),
      url: "http://localhost:3014", // Identity frontend URL
      color: "#EC4899",
      category: "admin",
    },
  ];


  useEffect(() => {
    // Ambil token dari localStorage
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/"); // redirect ke login jika tidak ada token
      return;
    }

    // Decode token (jika JWT, bisa pakai jwt-decode)
    // Atau fetch profile dari backend
    fetch("http://localhost:3001/api/v1/auth/me", {
  headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data: any) => {
        if (data.success) {
          setUser(data.data);
        } else {
          navigate("/");
        }
      })
      .catch(() => {
        navigate("/");
      });
  }, []);

  const handleModuleClick = (module: Module) => {
    // Store current token for cross-app authentication
    const token = localStorage.getItem("token");
    console.log('📤 Module clicked:', module.name);
    console.log('🔑 Token available:', token ? '✅ ' + token.substring(0, 20) + '...' : '❌ null');

    if (token && user) {
      // Pass token via URL query parameter
      const url = `${module.url}?token=${encodeURIComponent(token)}`;
      console.log('✅ Opening module with token in URL');

      // Navigate to the module
      window.open(url, '_blank');
    } else {
      console.error("❌ No token or user data available");
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  // Sidebar width
  // Sidebar selalu overlay, tidak ada margin konten
  const SIDEBAR_WIDTH = 0;
  const isMobile = true; // paksa selalu hamburger
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
      {/* Sidebar overlay, hanya muncul jika sidebarOpen */}
      <Sidebar
        modules={modules}
        onModuleClick={handleModuleClick}
        userRoles={user?.roles || []}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      {/* Navbar - Full Width */}
      <div
        style={{
          background: "white",
          borderBottom: "1px solid #E5E7EB",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
          position: "sticky",
          top: 0,
          zIndex: 100,
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        }}
      >
        <div
          style={{
            maxWidth: "1400px",
            margin: "0 auto",
            padding: windowWidth < 640 ? "16px 20px" : "18px 32px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          {/* Brand and Actions (Bell & Logout) */}
          <div style={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              {/* Tombol hamburger selalu tampil */}
              <MobileHamburger onClick={() => setSidebarOpen(true)} />
              <img 
                src="/unais.png" 
                alt="UNAIS Logo"
                style={{ height: "40px", width: "auto" }}
              />
              {windowWidth >= 640 && (
                <div style={{ borderLeft: "2px solid #E5E7EB", paddingLeft: "14px", height: "40px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                  <h1 style={{ margin: 0, color: "#1F2937", fontSize: "18px", fontWeight: "700", letterSpacing: "-0.3px" }}>
                    miniERP Dashboard
                  </h1>
                  <p style={{ margin: 0, fontSize: "11px", color: "#9CA3AF" }}>
                    Unais Creaasindo Multiverse
                  </p>
                </div>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <NotificationBell />
              <LogoutButton onClick={logout} />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ minHeight: "calc(100vh - 80px)", background: "#F5F7FA", padding: windowWidth < 640 ? "16px" : "24px", fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
        <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
          {user && (
            <>
              <div style={{ marginBottom: "20px" }}>
                <h2 style={{ margin: 0, fontSize: windowWidth < 640 ? "24px" : "32px", fontWeight: "700", color: "#1F2937", marginBottom: "8px", lineHeight: "1.2" }}>
                  Hey {user.email.split("@")[0].charAt(0).toUpperCase() + user.email.split("@")[0].slice(1)}, welcome back! 👋🏻
                </h2>
                <p style={{ margin: 0, fontSize: "16px", color: "#6B7280", lineHeight: "1.5" }}>
                  Ready to manage your day at <strong style={{ color: "#3B82F6" }}>UNAIS ERP</strong>
                </p>
              </div>

              <div style={{ marginBottom: "32px" }}>
                <AttendanceWidget />
              </div>

              {/* Quick Menu */}
              <div style={{ marginBottom: '18px' }}>
                <div style={{ fontSize: windowWidth < 768 ? '15px' : '18px', fontWeight: 700, color: '#1E293B', marginBottom: windowWidth < 768 ? '10px' : '16px' }}>
                  Quick Menu
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: windowWidth < 768 ? 'repeat(3, 1fr)' : windowWidth < 1024 ? 'repeat(4, 1fr)' : 'repeat(6, 1fr)', gap: windowWidth < 768 ? '10px' : '14px', maxWidth: windowWidth < 768 ? '100%' : '520px', margin: '0 auto' }}>
                  <div onClick={() => navigate('/my-attendances')} style={{ cursor: 'pointer', background: '#FFFFFF', borderRadius: '10px', padding: windowWidth < 768 ? '12px 8px' : '16px 10px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid #E5E7EB', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px', transition: 'all 0.2s' }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.08)'; }}>
                    <div style={{ width: windowWidth < 768 ? '36px' : '42px', height: windowWidth < 768 ? '36px' : '42px', borderRadius: '50%', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width={windowWidth < 768 ? "20" : "22"} height={windowWidth < 768 ? "20" : "22"} viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="9"/>
                        <path d="M12 8v4l2.5 2"/>
                      </svg>
                    </div>
                    <span style={{ fontSize: windowWidth < 768 ? '11px' : '13px', fontWeight: 600, color: '#374151', textAlign: 'center' }}>Attendance</span>
                  </div>

                  <div onClick={() => navigate('/my-requests')} style={{ cursor: 'pointer', background: '#FFFFFF', borderRadius: '10px', padding: windowWidth < 768 ? '12px 8px' : '16px 10px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid #E5E7EB', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px', transition: 'all 0.2s' }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.08)'; }}>
                    <div style={{ width: windowWidth < 768 ? '36px' : '42px', height: windowWidth < 768 ? '36px' : '42px', borderRadius: '50%', background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width={windowWidth < 768 ? "20" : "22"} height={windowWidth < 768 ? "20" : "22"} viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="3"/>
                        <path d="M8 8h8M8 12h8M8 16h4"/>
                      </svg>
                    </div>
                    <span style={{ fontSize: windowWidth < 768 ? '11px' : '13px', fontWeight: 600, color: '#374151', textAlign: 'center' }}>Requests</span>
                  </div>

                  <div onClick={() => alert('Fitur Slip Gaji segera hadir!')} style={{ cursor: 'pointer', background: '#FFFFFF', borderRadius: '10px', padding: windowWidth < 768 ? '12px 8px' : '16px 10px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid #E5E7EB', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px', transition: 'all 0.2s' }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.08)'; }}>
                    <div style={{ width: windowWidth < 768 ? '36px' : '42px', height: windowWidth < 768 ? '36px' : '42px', borderRadius: '50%', background: '#D1FAE5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width={windowWidth < 768 ? "20" : "22"} height={windowWidth < 768 ? "20" : "22"} viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="4" y="6" width="16" height="12" rx="2"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    </div>
                    <span style={{ fontSize: windowWidth < 768 ? '11px' : '13px', fontWeight: 600, color: '#374151', textAlign: 'center' }}>Payslip</span>
                  </div>
                </div>
              </div>

              {/* Approval Widgets - Hanya untuk Manager atau HR Admin */}
              {(hasSubordinates || isHRAdmin) && (
                <div style={{ marginBottom: '18px' }}>
                  <div style={{ fontSize: windowWidth < 768 ? '15px' : '18px', fontWeight: 700, color: '#1E293B', marginBottom: windowWidth < 768 ? '10px' : '16px' }}>
                    Approval Management
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: windowWidth < 768 ? '1fr' : 'repeat(2, 1fr)', gap: windowWidth < 768 ? '10px' : '14px', maxWidth: '600px' }}>
                    
                    {/* Team Approvals - Untuk Manager */}
                    {hasSubordinates && (
                      <div 
                        onClick={() => navigate('/approvals')} 
                        style={{ 
                          cursor: 'pointer', 
                          background: 'linear-gradient(135deg, #667EEA 0%, #764BA2 100%)', 
                          borderRadius: '12px', 
                          padding: '20px', 
                          boxShadow: '0 4px 14px rgba(102, 126, 234, 0.4)', 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '16px', 
                          transition: 'all 0.2s' 
                        }} 
                        onMouseEnter={(e) => { 
                          e.currentTarget.style.transform = 'translateY(-2px)'; 
                          e.currentTarget.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.5)'; 
                        }} 
                        onMouseLeave={(e) => { 
                          e.currentTarget.style.transform = 'translateY(0)'; 
                          e.currentTarget.style.boxShadow = '0 4px 14px rgba(102, 126, 234, 0.4)'; 
                        }}
                      >
                        <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                            <circle cx="9" cy="7" r="4"></circle>
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                          </svg>
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '16px', fontWeight: 700, color: '#FFF', marginBottom: '4px' }}>Team Approvals</div>
                          <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.9)' }}>
                            {teamPendingCount > 0 ? `${teamPendingCount} pending requests` : 'No pending requests'}
                          </div>
                        </div>
                        {teamPendingCount > 0 && (
                          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#FFF', color: '#667EEA', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 700 }}>
                            {teamPendingCount}
                          </div>
                        )}
                      </div>
                    )}

                    {/* HR Approvals - Untuk HR Admin */}
                    {isHRAdmin && (
                      <div 
                        onClick={() => navigate('/approvals')} 
                        style={{ 
                          cursor: 'pointer', 
                          background: 'linear-gradient(135deg, #F093FB 0%, #F5576C 100%)', 
                          borderRadius: '12px', 
                          padding: '20px', 
                          boxShadow: '0 4px 14px rgba(240, 147, 251, 0.4)', 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '16px', 
                          transition: 'all 0.2s' 
                        }} 
                        onMouseEnter={(e) => { 
                          e.currentTarget.style.transform = 'translateY(-2px)'; 
                          e.currentTarget.style.boxShadow = '0 6px 20px rgba(240, 147, 251, 0.5)'; 
                        }} 
                        onMouseLeave={(e) => { 
                          e.currentTarget.style.transform = 'translateY(0)'; 
                          e.currentTarget.style.boxShadow = '0 4px 14px rgba(240, 147, 251, 0.4)'; 
                        }}
                      >
                        <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9 11l3 3L22 4"></path>
                            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                          </svg>
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '16px', fontWeight: 700, color: '#FFF', marginBottom: '4px' }}>All Approvals (HR)</div>
                          <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.9)' }}>
                            {allPendingCount > 0 ? `${allPendingCount} pending company-wide` : 'No pending requests'}
                          </div>
                        </div>
                        {allPendingCount > 0 && (
                          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#FFF', color: '#F5576C', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 700 }}>
                            {allPendingCount}
                          </div>
                        )}
                      </div>
                    )}

                  </div>
                </div>
              )}

              {loadingHistory ? (
                <div style={{ marginTop: 24, color: '#888', fontSize: 14 }}>Memuat riwayat absen...</div>
              ) : historyError ? (
                <div style={{ marginTop: 24, color: '#EF4444', fontSize: 14 }}>{historyError}</div>
              ) : (
                <AttendanceHistory records={attendanceHistory} />
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default Dashboard;
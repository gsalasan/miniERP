import React, { useEffect, useState } from "react";

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
}

const Dashboard: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);

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
      url: "http://localhost:3010", // CRM frontend URL (placeholder)
      color: "#3B82F6",
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
      url: "http://localhost:5175", // HR frontend URL (placeholder)
      color: "#F59E0B",
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
      url: "http://localhost:5172", // Finance frontend URL (placeholder)
      color: "#8B5CF6",
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
      url: "http://localhost:5176", // Procurement frontend URL (placeholder)
      color: "#EF4444",
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
      url: "http://localhost:5177", // Project frontend URL (placeholder)
      color: "#6B7280",
    },
  ];


  useEffect(() => {
    // Ambil token dari localStorage
    const token = localStorage.getItem("token");
    if (!token) {
      if (typeof window !== 'undefined') window.location.href = "/"; // redirect ke login jika tidak ada token
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
          if (typeof window !== 'undefined') window.location.href = "/";
        }
      })
      .catch(() => {
        window.location.href = "/";
      });
  }, []);

  const handleModuleClick = (module: Module) => {
    // Store current token for cross-app authentication
    const token = localStorage.getItem("token");

    if (token && user) {
      // Use localStorage for cross-app sharing (since sessionStorage is tab-specific)
      localStorage.setItem("cross_app_token", token);
      localStorage.setItem("cross_app_user", JSON.stringify(user));
      localStorage.setItem("cross_app_timestamp", Date.now().toString());

      // Navigate to the module

      // Clean up cross-app data after a short delay
      setTimeout(() => {
        localStorage.removeItem("cross_app_token");
        localStorage.removeItem("cross_app_user");
        localStorage.removeItem("cross_app_timestamp");
      }, 5000); // 5 seconds cleanup
    } else {
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    window.location.href = "/";
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #334155 100%)",
        padding: "24px",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: "1400px",
          margin: "0 auto",
          backgroundColor: "rgba(255, 255, 255, 0.95)",
          borderRadius: "24px",
          padding: "40px",
          boxShadow: "0 25px 50px rgba(0, 0, 0, 0.15)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255, 255, 255, 0.2)",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "48px",
            borderBottom: "1px solid #E5E7EB",
            paddingBottom: "32px",
          }}
        >
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "16px",
                marginBottom: "12px",
              }}
            >
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  background: "linear-gradient(135deg, #3B82F6, #1D4ED8)",
                  borderRadius: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  fontWeight: "bold",
                  fontSize: "18px",
                  boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)",
                }}
              >
                ERP
              </div>
              <h1
                style={{
                  margin: 0,
                  background: "linear-gradient(135deg, #1F2937, #374151)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  fontSize: "32px",
                  fontWeight: "700",
                  letterSpacing: "-0.02em",
                }}
              >
                miniERP Dashboard
              </h1>
            </div>
            {user && (
              <div style={{ marginLeft: "64px" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    backgroundColor: "linear-gradient(135deg, #F0F9FF, #EFF6FF)",
                    background: "linear-gradient(135deg, #F0F9FF, #EFF6FF)",
                    padding: "12px 20px",
                    borderRadius: "16px",
                    border: "1px solid #DBEAFE",
                  }}
                >
                  <div
                    style={{
                      width: "40px",
                      height: "40px",
                      background: "linear-gradient(135deg, #3B82F6, #1D4ED8)",
                      borderRadius: "12px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "white",
                    }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path d="M10 20V14H14V20H19V12H22L12 3L2 12H5V20H10Z" fill="currentColor" />
                    </svg>
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: "16px", color: "#1F2937", fontWeight: "600" }}>
                      Selamat datang!
                    </p>
                    <p style={{ margin: 0, fontSize: "14px", color: "#6B7280" }}>{user.email}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <button
              onClick={logout}
              style={{
                padding: "12px 24px",
                backgroundColor: "#EF4444",
                color: "white",
                border: "none",
                borderRadius: "12px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "500",
                boxShadow: "0 4px 12px rgba(239, 68, 68, 0.3)",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
              }}
            >
              Logout
            </button>
          </div>
        </div>

        {/* Modules Grid */}
        {user ? (
          <div>
            <div style={{ marginBottom: "32px" }}>
              <h2
                style={{
                  marginBottom: "8px",
                  color: "#1F2937",
                  fontSize: "24px",
                  fontWeight: "600",
                  letterSpacing: "-0.01em",
                }}
              >
                Business Modules
              </h2>
              <p
                style={{
                  margin: 0,
                  color: "#6B7280",
                  fontSize: "16px",
                  lineHeight: "1.5",
                }}
              >
                Select a module to access different areas of your business operations
              </p>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                gap: "24px",
              }}
            >
              {modules.map((module) => (
                <div
                  key={module.id}
                  onClick={() => handleModuleClick(module)}
                  style={{
                    position: "relative",
                    padding: "32px 28px",
                    borderRadius: "20px",
                    backgroundColor: "white",
                    border: "1px solid #E5E7EB",
                    cursor: "pointer",
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                    textAlign: "left",
                    minHeight: "200px",
                    boxShadow:
                      "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                    overflow: "hidden",
                  }}
                  onMouseEnter={(e) => {
                  }}
                >
                  {/* Gradient overlay */}
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      right: 0,
                      width: "100px",
                      height: "100px",
                      background: `linear-gradient(135deg, ${module.color}15, ${module.color}05)`,
                      borderRadius: "0 20px 0 100px",
                    }}
                  />
                  
                  {/* Icon container */}
                  <div
                    style={{
                      width: "64px",
                      height: "64px",
                      backgroundColor: `${module.color}12`,
                      borderRadius: "16px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: "20px",
                      border: `1px solid ${module.color}20`,
                      position: "relative",
                      zIndex: 1,
                    }}
                  >
                    <div style={{ color: module.color }}>{module.icon}</div>
                  </div>
                  
                  <div style={{ flex: 1, position: "relative", zIndex: 1 }}>
                    <h3
                      style={{
                        margin: "0 0 12px 0",
                        color: "#111827",
                        fontSize: "20px",
                        fontWeight: "600",
                        lineHeight: "1.2",
                      }}
                    >
                      {module.name}
                    </h3>
                    <p
                      style={{
                        margin: 0,
                        color: "#6B7280",
                        fontSize: "15px",
                        lineHeight: "1.5",
                      }}
                    >
                      {module.description}
                    </p>
                  </div>

                  {/* Arrow indicator */}
                  <div
                    style={{
                      position: "absolute",
                      bottom: "24px",
                      right: "24px",
                      width: "24px",
                      height: "24px",
                      borderRadius: "6px",
                      backgroundColor: `${module.color}15`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <span
                      style={{
                        color: module.color,
                        fontSize: "12px",
                        fontWeight: "600",
                      }}
                    >
                      →
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div
            style={{
              textAlign: "center",
              padding: "80px 20px",
              color: "#6B7280",
            }}
          >
            <div
              style={{
                width: "64px",
                height: "64px",
                margin: "0 auto 24px",
                border: "4px solid #E5E7EB",
                borderTop: "4px solid #3B82F6",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
              }}
            ></div>
            <style>
              {`
                @keyframes spin {
                  0% { transform: rotate(0deg); }
                  100% { transform: rotate(360deg); }
                }
              `}
            </style>
            <h3
              style={{
                margin: "0 0 8px 0",
                fontSize: "18px",
                fontWeight: "600",
                color: "#374151",
              }}
            >
              Loading Dashboard
            </h3>
            <p style={{ margin: 0, fontSize: "14px" }}>Please wait while we load your profile...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;

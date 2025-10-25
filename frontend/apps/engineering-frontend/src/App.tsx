import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { CssBaseline, ThemeProvider, createTheme } from "@mui/material";
import { Layout } from "./layouts/Layout";
import { DashboardPage } from "./pages/DashboardPage";
import { ItemsPage } from "./pages/items";
import { MaterialsPage } from "./pages/materials";

// Create MUI theme
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // For now, skip authentication to test the app works
    setIsAuthenticated(true);
    setLoading(false);
    
    // TODO: Re-enable authentication once cross-app navigation is working
    // checkAuthentication();
  }, []);

  const checkAuthentication = () => {
    try {
      // Check for cross-app token first
      let crossToken = localStorage.getItem("cross_app_token");
      let crossUser = localStorage.getItem("cross_app_user");
      
      if (crossToken && crossUser) {
        // Use cross-app data
        localStorage.setItem("token", crossToken);
        localStorage.setItem("user", crossUser);
        // Clean up cross-app data
        localStorage.removeItem("cross_app_token");
        localStorage.removeItem("cross_app_user");
        localStorage.removeItem("cross_app_timestamp");
        setIsAuthenticated(true);
        setLoading(false);
        return;
      }

      // Check existing token
      const token = localStorage.getItem("token");
      const user = localStorage.getItem("user");
      
      if (token && user) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error("Auth error:", error);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        <div style={{ fontSize: "24px" }}>⏳</div>
        <div>Memuat aplikasi Cost Estimation...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          flexDirection: "column",
          gap: "16px",
          textAlign: "center",
          padding: "20px",
        }}
      >
        <div style={{ fontSize: "48px" }}>🔒</div>
        <h2>Akses Tidak Diizinkan</h2>
        <p>Silakan login melalui aplikasi utama terlebih dahulu.</p>
        <button
          onClick={() => (window.location.href = "http://localhost:3000")}
          style={{
            padding: "12px 24px",
            backgroundColor: "#1976d2",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "16px",
          }}
        >
          Kembali ke Login
        </button>
      </div>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/items" element={<ItemsPage />} />
            <Route path="/items/materials" element={<MaterialsPage />} />
            {/* Add more routes as needed */}
          </Routes>
        </Layout>
      </Router>
    </ThemeProvider>
  );
}

export default App;

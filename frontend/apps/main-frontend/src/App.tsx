import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import MyAttendances from "./pages/MyAttendances";
import MyRequests from "./pages/MyRequests";
import Approvals from "./pages/Approvals";
import { AuthProvider } from "./contexts/AuthContext";
import { useAuth } from "./contexts/AuthContext";
import NotFound from '@shared/pages/NotFound';
import Forbidden from '@shared/pages/Forbidden';

// Component to handle authentication redirect
const AuthGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        Loading...
      </div>
    );
  }

  if (!isAuthenticated) {
    window.location.href = `${import.meta.env.VITE_DEV_URL}:${import.meta.env.VITE_FE_MAIN_PORT}/login`;
    return null;
  }

  return <>{children}</>;

};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={
            <AuthGuard>
              <Dashboard />
            </AuthGuard>
          } />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={
            <AuthGuard>
              <Dashboard />
            </AuthGuard>
          } />
          <Route path="/my-attendances" element={
            <AuthGuard>
              <MyAttendances />
            </AuthGuard>
          } />
          <Route path="/my-requests" element={
            <AuthGuard>
              <MyRequests />
            </AuthGuard>
          } />
          <Route path="/approvals" element={
            <AuthGuard>
              <Approvals />
            </AuthGuard>
          } />

          {/* Fallback */}
          <Route path="/403" element={<Forbidden />} />
          <Route path="*" element={<NotFound />} />
          
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

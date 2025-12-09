import React from "react";
import { BrowserRouter as Router, Routes, Route} from "react-router-dom";
import Layout from "../layouts/MainLayout";
import Dashboard from '../pages/Dashboard';
import { useAuth } from "../contexts/AuthContext";
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
    window.location.href = `${import.meta.env.VITE_DEV_URL}:${import.meta.env.VITE_FE_MAIN_PORT}`;
    return null;
  }

  return <>{children}</>;

};

const AppRouter: React.FC = () => {
  return (
    <Router>
      <AuthGuard>
        <Layout>
          <Routes>
              {/* Identity module routes */}
              <Route path="/" element={
                <AuthGuard>
                  <Dashboard />
                </AuthGuard>
              } />
              <Route path="/dashboard" element={
                <AuthGuard>
                  <Dashboard />
                </AuthGuard>
              } />
      
              {/* Fallback */}
              <Route path="/403" element={<Forbidden />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
        </Layout>
      </AuthGuard>
    </Router>
  );
};

export default AppRouter;

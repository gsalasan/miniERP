import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Layout from "../layouts/MainLayout";
import CustomersPage from "../pages/customers";
import NewCustomerPage from "../pages/customers/NewCustomerPage";
import CustomerDetailPage from "../pages/customers/CustomerDetailPage";
import EditCustomerPage from "../pages/customers/EditCustomerPage";
import HomePage from "../pages/HomePage";
import PipelinePage from "../pages/pipeline/PipelinePage";
import SalesOrdersPage from "../pages/SalesOrdersPage";
import { withAuth, useAuth } from "../contexts/AuthContext";
import { auth } from "../config";

// Protect pages that require authentication
const ProtectedPipelinePage = withAuth(PipelinePage);
const ProtectedCustomersPage = withAuth(CustomersPage);
const ProtectedNewCustomerPage = withAuth(NewCustomerPage);
const ProtectedCustomerDetailPage = withAuth(CustomerDetailPage);
const ProtectedEditCustomerPage = withAuth(EditCustomerPage);
const ProtectedHomePage = withAuth(HomePage);
const ProtectedSalesOrdersPage = withAuth(SalesOrdersPage);

// Component to handle authentication redirect
const AuthGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // Redirect to main frontend login
      window.location.href = auth.LOGIN_URL;
    }
  }, [isAuthenticated, isLoading]);

  if (isLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        Loading...
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect via useEffect
  }

  return <>{children}</>;
};

const AppRouter: React.FC = () => {
  return (
    <Router>
      <AuthGuard>
        <Layout>
          <Routes>
            <Route path="/" element={<ProtectedHomePage />} />
            <Route path="/pipeline" element={<ProtectedPipelinePage />} />
            <Route path="/customers" element={<ProtectedCustomersPage />} />
            <Route path="/customers/new" element={<ProtectedNewCustomerPage />} />
            <Route path="/customers/:id" element={<ProtectedCustomerDetailPage />} />
            <Route path="/customers/:id/edit" element={<ProtectedEditCustomerPage />} />
            <Route path="/sales-orders" element={<ProtectedSalesOrdersPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </AuthGuard>
    </Router>
  );
};

export default AppRouter;

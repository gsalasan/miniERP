import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Layout from "../layouts/MainLayout";
import CustomersPage from "../pages/customers";
import NewCustomerPage from "../pages/customers/NewCustomerPage";
import CustomerDetailPage from "../pages/customers/CustomerDetailPage";
import EditCustomerPage from "../pages/customers/EditCustomerPage";
import HomePage from "../pages/HomePage";

const AppRouter: React.FC = () => {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/customers" element={<CustomersPage />} />
          <Route path="/customers/new" element={<NewCustomerPage />} />
          <Route path="/customers/:id" element={<CustomerDetailPage />} />
          <Route path="/customers/:id/edit" element={<EditCustomerPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </Router>
  );
};

export default AppRouter;
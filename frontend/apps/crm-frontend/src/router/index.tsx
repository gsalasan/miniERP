import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import Layout from '../layouts/MainLayout';
import CustomersPage from '../pages/customers';
import NewCustomerPage from '../pages/customers/NewCustomerPage';
import CustomerDetailPage from '../pages/customers/CustomerDetailPage';
import EditCustomerPage from '../pages/customers/EditCustomerPage';
import HomePage from '../pages/HomePage';
import PipelinePage from '../pages/pipeline/PipelinePage';
import { withAuth } from '../contexts/AuthContext';

// Protect pages that require authentication
const ProtectedPipelinePage = withAuth(PipelinePage);
const ProtectedCustomersPage = withAuth(CustomersPage);
const ProtectedNewCustomerPage = withAuth(NewCustomerPage);
const ProtectedCustomerDetailPage = withAuth(CustomerDetailPage);
const ProtectedEditCustomerPage = withAuth(EditCustomerPage);
const ProtectedHomePage = withAuth(HomePage);

const AppRouter: React.FC = () => {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path='/' element={<ProtectedHomePage />} />
          <Route path='/pipeline' element={<ProtectedPipelinePage />} />
          <Route path='/customers' element={<ProtectedCustomersPage />} />
          <Route path='/customers/new' element={<ProtectedNewCustomerPage />} />
          <Route
            path='/customers/:id'
            element={<ProtectedCustomerDetailPage />}
          />
          <Route
            path='/customers/:id/edit'
            element={<ProtectedEditCustomerPage />}
          />
          <Route path='*' element={<Navigate to='/' replace />} />
        </Routes>
      </Layout>
    </Router>
  );
};

export default AppRouter;

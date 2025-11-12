import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import EmployeesList from './pages/EmployeesList';
import EmployeeNew from './pages/EmployeeNew';
import EmployeeDetail from './pages/EmployeeDetail';
import EmployeeEdit from './pages/EmployeeEdit';

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/hr" element={<Dashboard />} />
        <Route path="/hr/dashboard" element={<Dashboard />} />
        <Route path="/hr/employees" element={<EmployeesList />} />
        <Route path="/hr/employees/new" element={<EmployeeNew />} />
        <Route path="/hr/employees/:id" element={<EmployeeDetail />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

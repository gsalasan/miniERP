import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import EmployeesList from './pages/EmployeesList';
import EmployeeNew from './pages/EmployeeNew';
import EmployeeDetail from './pages/EmployeeDetail';
import EmployeeEdit from './pages/EmployeeEdit';

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/hr/employees" element={<EmployeesList />} />
        <Route path="/hr/employees/new" element={<EmployeeNew />} />
  <Route path="/hr/employees/:id" element={<EmployeeDetail />} />
        <Route path="*" element={<Navigate to="/hr/employees" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

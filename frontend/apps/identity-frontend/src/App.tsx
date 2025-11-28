import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import UserManagement from './pages/users/UserManagement';
import { useTokenSync } from './hooks/useTokenSync';

function App() {
  // Sync cross_app_token to token on app mount
  useTokenSync();

  return (
    <Router>
      <Routes>
        {/* Identity module routes */}
        <Route path="/" element={<Dashboard />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/users" element={<UserManagement />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;

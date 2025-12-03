import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from 'react-router-dom';
import ProjectsListPage from '../pages/ProjectsListPage';
import ProjectDetailPage from '../pages/ProjectDetailPage';
import ProjectDashboardPage from '../pages/ProjectDashboardPage';
import OperationsDashboardPage from '../pages/OperationsDashboardPage';
import { useAuth } from '../contexts/AuthContext';

// Protected Route Component
const ProtectedRoute: React.FC<{ element: React.ReactElement }> = ({
  element,
}) => {
  const { isAuthenticated, isLoading, token } = useAuth();

  // Show loading while auth is initializing
  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        <div style={{ fontSize: '24px' }}>🔐</div>
        <div>Authenticating...</div>
      </div>
    );
  }

  // After loading completes, check if authenticated
  if (!isAuthenticated) {
    // TEMPORARILY DISABLED REDIRECT - DEBUGGING
    console.error('❌ [PROTECTED ROUTE] Not authenticated!');
    console.error('   - isAuthenticated:', isAuthenticated);
    console.error('   - token:', token);
    console.error('   - localStorage token:', localStorage.getItem('token'));
    console.error(
      '   - localStorage cross_app_token:',
      localStorage.getItem('cross_app_token')
    );

    return (
      <div
        style={{
          padding: '40px',
          maxWidth: '800px',
          margin: '0 auto',
          fontFamily: 'monospace',
        }}
      >
        <h2 style={{ color: 'red' }}>❌ Not Authenticated</h2>
        <div
          style={{
            background: '#f5f5f5',
            padding: '20px',
            marginTop: '20px',
            borderRadius: '8px',
          }}
        >
          <h3>Debug Info:</h3>
          <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
            {JSON.stringify(
              {
                isAuthenticated,
                hasToken: !!token,
                tokenLength: token?.length || 0,
                localStorageToken:
                  localStorage.getItem('token')?.substring(0, 50) + '...',
                localStorageCrossAppToken:
                  localStorage.getItem('cross_app_token')?.substring(0, 50) +
                  '...',
                localStorageUser: localStorage.getItem('user'),
                localStorageCrossAppUser:
                  localStorage.getItem('cross_app_user'),
                currentURL: window.location.href,
                urlParams: Object.fromEntries(
                  new URLSearchParams(window.location.search)
                ),
              },
              null,
              2
            )}
          </pre>
        </div>
        <p style={{ marginTop: '20px', color: '#666' }}>
          Redirect disabled for debugging. Check console for [AUTH] logs.
        </p>
      </div>
    );
  }

  return element;
};

// Redirect component that preserves any existing search/query string
const RedirectPreserveSearch: React.FC<{ to: string }> = ({ to }) => {
  const location = useLocation();
  return <Navigate to={{ pathname: to, search: location.search }} replace />;
};

const AppRouter: React.FC = () => {
  return (
    <Router>
      <Routes>
        {/* New canonical list route at /project (singular) */}
        <Route
          path="/project"
          element={<ProtectedRoute element={<ProjectsListPage />} />}
        />

        {/* Project detail route unchanged */}
        <Route
          path="/projects/:projectId"
          element={<ProtectedRoute element={<ProjectDetailPage />} />}
        />

        {/* Project dashboard */}
        <Route
          path="/projects/:projectId/dashboard"
          element={<ProtectedRoute element={<ProjectDashboardPage />} />}
        />

        {/* Operations dashboard (Operational Manager) */}
        <Route
          path="/dashboard/operations"
          element={<ProtectedRoute element={<OperationsDashboardPage />} />}
        />

        {/* Root redirects to /project so the list page is served at /project
            Preserve query string (e.g. cross_app_token) so AuthProvider can read it */}
        <Route path="/" element={<RedirectPreserveSearch to="/project" />} />

        {/* Fallback - also preserve any search */}
        <Route path="*" element={<RedirectPreserveSearch to="/project" />} />
      </Routes>
    </Router>
  );
};

export default AppRouter;

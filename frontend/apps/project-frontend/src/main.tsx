import React from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { theme } from './theme';
import AppRouter from './router';
import { AuthProvider } from './contexts/AuthContext';

const container = document.getElementById('root');
if (!container) {
  throw new Error('Root element with id "root" not found');
}

const root = createRoot(container);
root.render(
  <React.StrictMode>
    <AuthProvider>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AppRouter />
      </ThemeProvider>
    </AuthProvider>
  </React.StrictMode>
);

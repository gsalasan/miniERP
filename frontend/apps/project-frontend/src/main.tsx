import React from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { theme } from './theme';
import AppRouter from './router';
import { AuthProvider } from './contexts/AuthContext';
import './styles/globals.css';

const container = document.getElementById('root');
if (!container) {
  throw new Error('Root element with id "root" not found');
}

const root = createRoot(container);
const queryClient = new QueryClient();

root.render(
  <React.StrictMode>
    <AuthProvider>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <QueryClientProvider client={queryClient}>
          <AppRouter />
        </QueryClientProvider>
      </ThemeProvider>
    </AuthProvider>
  </React.StrictMode>
);

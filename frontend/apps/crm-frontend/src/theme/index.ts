import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
      light: '#42a5f5',
      dark: '#1565c0',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#dc004e',
      light: '#ff5983',
      dark: '#9a0036',
      contrastText: '#ffffff',
    },
    background: {
      default: '#fafafa',
      paper: '#ffffff',
    },
    text: {
      primary: '#212121',
      secondary: '#757575',
    },
  },
  typography: {
    fontFamily: ''Inter', 'Roboto', 'Helvetica', 'Arial', sans-serif',
    h1: {
      fontSize: '2.125rem',
      fontWeight: 600,
      lineHeight: 1.235,
    },
    h2: {
      fontSize: '1.5rem',
      fontWeight: 600,
      lineHeight: 1.334,
    },
    h3: {
      fontSize: '1.25rem',
      fontWeight: 600,
      lineHeight: 1.6,
    },
    h4: {
      fontSize: '1.125rem',
      fontWeight: 600,
      lineHeight: 1.5,
    },
    body1: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          borderRadius: 8,
          padding: '8px 16px',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          borderRadius: 12,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          '&.MuiDataGrid-root': {
            border: 'none',
            borderRadius: 12,
            '& .MuiDataGrid-columnHeaders': {
              backgroundColor: '#f8f9fa',
              fontSize: '0.875rem',
              fontWeight: 600,
              color: '#495057',
            },
            '& .MuiDataGrid-cell': {
              fontSize: '0.875rem',
              borderBottom: '1px solid #e9ecef',
            },
            '& .MuiDataGrid-row:hover': {
              backgroundColor: '#f8f9fa',
            },
          },
        },
      },
    },
  },
});

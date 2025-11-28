import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { CssBaseline, ThemeProvider, createTheme } from "@mui/material";
import { Layout } from "./layouts/Layout";
import { DashboardPage } from "./pages/DashboardPage";
import { ItemsPage } from "./pages/items";
import { MaterialsPage } from "./pages/materials";
import { ServicesPage } from "./pages/services";
import {
  EstimationCalculatorPage,
  EstimationsListPage,
  EstimationQueuePage,
  EstimationRequestDemoPage,
  ApprovalQueuePage,
  EstimationReviewPage,
} from "./pages/estimations";
import { EngineeringDashboardPage } from "./pages/dashboard/EngineeringDashboardPage";
import { NotificationProvider } from "./contexts/NotificationContext";
import { AuthProvider } from "./context/AuthContext";

// Create modern MUI theme
const theme = createTheme({
  palette: {
    mode: "light",
    // Palette tuned to match Unais logo colors (deep navy + light blue)
    primary: {
      main: "#08306B", // deep navy
      light: "#4EA8FF", // lighter sky blue for accents
      dark: "#042A4A",
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#5BC0FF", // soft cyan/sky blue
      light: "#8EE6FF",
      dark: "#2E9ECF",
      contrastText: "#05233A",
    },
    background: {
      default: "#f8fafc",
      paper: "#ffffff",
    },
    text: {
      primary: "#05233A",
      secondary: "#475569",
    },
    success: {
      main: "#10b981",
      light: "#34d399",
      dark: "#059669",
    },
    warning: {
      main: "#f59e0b",
      light: "#fbbf24",
      dark: "#d97706",
    },
    error: {
      main: "#ef4444",
      light: "#f87171",
      dark: "#dc2626",
    },
    grey: {
      50: "#f8fafc",
      100: "#f1f5f9",
      200: "#e2e8f0",
      300: "#cbd5e1",
      400: "#94a3b8",
      500: "#64748b",
      600: "#475569",
      700: "#334155",
      800: "#1e293b",
      900: "#0f172a",
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: "2.5rem",
      fontWeight: 700,
      lineHeight: 1.2,
      color: "#1e293b",
    },
    h2: {
      fontSize: "2rem",
      fontWeight: 600,
      lineHeight: 1.3,
      color: "#1e293b",
    },
    h3: {
      fontSize: "1.75rem",
      fontWeight: 600,
      lineHeight: 1.3,
      color: "#1e293b",
    },
    h4: {
      fontSize: "1.5rem",
      fontWeight: 600,
      lineHeight: 1.4,
      color: "#1e293b",
    },
    h5: {
      fontSize: "1.25rem",
      fontWeight: 600,
      lineHeight: 1.4,
      color: "#1e293b",
    },
    h6: {
      fontSize: "1.125rem",
      fontWeight: 600,
      lineHeight: 1.4,
      color: "#08306B",
    },
    body1: {
      fontSize: "1rem",
      lineHeight: 1.6,
      color: "#475569",
    },
    body2: {
      fontSize: "0.875rem",
      lineHeight: 1.5,
      color: "#64748b",
    },
    button: {
      textTransform: "none",
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 4,
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
          borderRadius: 16,
          border: "1px solid #e2e8f0",
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: ({ theme }) => ({
          // slightly larger radius than the global shape so dialogs match the
          // detail modal appearance (keeps other small elements using theme.shape)
          // Increased per request to better match detail modal visuals
          // nudged slightly again to match screenshot
          borderRadius: 14,
          padding: 0,
          backgroundColor: theme.palette.background.paper,
          position: "fixed",
          // hide overflow so internal elements don't visually break the rounded corners
          overflow: "hidden",
          // Note: no full-width header strip here; per-modal header should render its own accent if needed
          // On desktop center within the available content area (viewport minus sidebar)
          // Sidebar width is 280px; center = 280px + (100% - 280px)/2 = calc(50% + 140px)
          "@media (min-width:960px)": {
            top: "50%",
            left: "calc(50% + 100px)",
            transform: "translate(-50%, -50%)",
            // Make dialog noticeably larger on desktop while still leaving space for sidebar
            width: "min(1200px, calc(100% - 360px))",
            maxHeight: "80vh",
            overflowY: "auto",
          },
        }),
      },
    },
    MuiBackdrop: {
      styleOverrides: {
        root: ({ theme }) => ({
          backgroundColor: "rgba(0,0,0,0.45)",
          // By default cover full viewport on small screens.
          // On desktop, limit the backdrop to the content area so the sidebar stays undimmed.
          "@media (min-width:960px)": {
            left: 280,
            right: "auto",
            width: "calc(100% - 280px)",
          },
        }),
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: ({ theme }) => ({
          // keep title area compact and transparent so it doesn't become a full-width bar
          padding: "12px 20px",
          backgroundColor: "transparent",
          color: theme.palette.text.primary,
          position: "relative",
          marginTop: 4,
          "& .MuiTypography-root": {
            fontWeight: 700,
            color: theme.palette.text.primary,
          },
        }),
      },
    },
    MuiDialogContent: {
      styleOverrides: {
        root: ({ theme }) => ({
          padding: "20px",
          color: theme.palette.text.primary,
        }),
      },
    },
    MuiDialogActions: {
      styleOverrides: {
        root: {
          padding: "12px 20px",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          fontWeight: 500,
          textTransform: "none",
          boxShadow: "none",
          "&:hover": {
            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
          },
        },
        contained: {
          "&:hover": {
            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            borderRadius: 10,
            "& fieldset": {
              borderColor: "#e2e8f0",
            },
            "&:hover fieldset": {
              borderColor: "#cbd5e1",
            },
            "&.Mui-focused fieldset": {
              borderColor: "#2563eb",
              borderWidth: 2,
            },
          },
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          "& .MuiTableCell-head": {
            backgroundColor: "#f8fafc",
            fontWeight: 600,
            fontSize: "0.875rem",
            color: "#475569",
            borderBottom: "2px solid #e2e8f0",
          },
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          "&:hover": {
            backgroundColor: "#f8fafc",
          },
          "&:last-child td": {
            borderBottom: 0,
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: "1px solid #f1f5f9",
          padding: "16px",
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 500,
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
  },
});

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  // On initial load, accept token passed via URL (?token=...) and store it in localStorage
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const token = params.get('token');
      if (token) {
        localStorage.setItem('token', token);
        // Remove token from URL to avoid leaking it in history
        params.delete('token');
        const newSearch = params.toString();
        const newUrl = window.location.pathname + (newSearch ? `?${newSearch}` : '') + window.location.hash;
        window.history.replaceState({}, document.title, newUrl);
      }
    } catch (e) {
      // ignore
    }
  }, []);

  useEffect(() => {
    // For now, skip authentication to test the app works
    setIsAuthenticated(true);
    setLoading(false);

    // TODO: Re-enable authentication once cross-app navigation is working
    // checkAuthentication();
  }, []);

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        <div style={{ fontSize: "24px" }}>⏳</div>
        <div>Memuat aplikasi Cost Estimation...</div>
      </div>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <NotificationProvider>
          <Router>
            <Layout>
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/dashboard/engineering" element={<EngineeringDashboardPage />} />
                <Route path="/items" element={<ItemsPage />} />
                <Route path="/items/materials" element={<MaterialsPage />} />
                <Route path="/items/services" element={<ServicesPage />} />
                <Route path="/estimations" element={<EstimationsListPage />} />
                <Route path="/estimations/queue" element={<EstimationQueuePage />} />
                <Route path="/estimations/approval-queue" element={<ApprovalQueuePage />} />
                <Route path="/estimations/request-demo" element={<EstimationRequestDemoPage />} />
                <Route path="/estimations/:id" element={<EstimationCalculatorPage />} />
                <Route path="/estimations/:id/view" element={<EstimationCalculatorPage />} />
                <Route path="/estimations/:id/review" element={<EstimationReviewPage />} />
                {/* Add more routes as needed */}
              </Routes>
            </Layout>
          </Router>
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;

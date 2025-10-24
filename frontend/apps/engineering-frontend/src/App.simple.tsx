import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { CssBaseline, ThemeProvider, createTheme, Typography, Box } from "@mui/material";

// Create MUI theme
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

// Simple test components
const Dashboard = () => <Typography variant="h1">Dashboard Page</Typography>;
const Materials = () => (
  <Box sx={{ p: 3 }}>
    <Typography variant="h1">Materials Page</Typography>
    <Typography variant="body1">This is the materials page - it works!</Typography>
  </Box>
);

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/items/materials" element={<Materials />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
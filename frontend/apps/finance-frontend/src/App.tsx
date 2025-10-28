<<<<<<< HEAD
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import COA from "./pages/COA";
import FinancialCockpit from "./pages/FinancialCockpit";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/coa" element={<COA />} />
        <Route path="/financial-cockpit" element={<FinancialCockpit />} />
        <Route path="/admin/policies/finance" element={<FinancialCockpit />} />
        <Route path="/journal" element={<Dashboard />} />
        <Route path="/reports" element={<Dashboard />} />
        <Route path="/settings" element={<Dashboard />} />
      </Routes>
    </Router>
=======
import React from "react";
import { CssBaseline, Container, Typography } from "@mui/material";

function App() {
  return (
    <Container maxWidth="sm">
      <CssBaseline />
      <Typography variant="h3" align="center" gutterBottom>
        Finance Frontend
      </Typography>
      <Typography align="center">Modul Finance miniERP</Typography>
    </Container>
>>>>>>> main
  );
}

export default App;

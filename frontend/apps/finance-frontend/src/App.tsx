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
  );
}

export default App;

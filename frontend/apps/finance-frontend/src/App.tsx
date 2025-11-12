import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import COA from "./pages/COA";
<<<<<<< HEAD
import PolicyCockpit from "./pages/PolicyCockpit";
// Legacy pages (kept for backward compatibility)
import PricingRules from "./pages/PricingRules";
import OverheadAllocations from "./pages/OverheadAllocations";
import DiscountPolicies from "./pages/DiscountPolicies";
=======
import FinancialCockpit from "./pages/FinancialCockpit";
>>>>>>> origin/main

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/coa" element={<COA />} />
<<<<<<< HEAD
        <Route path="/policy-cockpit" element={<PolicyCockpit />} />
        <Route path="/admin/policies/finance" element={<PolicyCockpit />} />
        {/* Legacy routes - redirect to PolicyCockpit */}
        <Route path="/pricing-rules" element={<PricingRules />} />
        <Route path="/overhead-allocations" element={<OverheadAllocations />} />
        <Route path="/discount-policies" element={<DiscountPolicies />} />
=======
        <Route path="/financial-cockpit" element={<FinancialCockpit />} />
        <Route path="/admin/policies/finance" element={<FinancialCockpit />} />
>>>>>>> origin/main
        <Route path="/journal" element={<Dashboard />} />
        <Route path="/reports" element={<Dashboard />} />
        <Route path="/settings" element={<Dashboard />} />
      </Routes>
    </Router>
  );
}

export default App;

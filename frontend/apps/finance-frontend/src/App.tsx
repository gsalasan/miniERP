import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import COA from "./pages/COA";
import FinancialCockpit from "./pages/FinancialCockpit";
import GeneralJournalForm from "./pages/JournalEntry/GeneralJournalForm";
import GeneralJournalEntry from "./pages/Journal/GeneralJournalEntry";
import InvoiceManagementComplete from "./pages/Invoice/InvoiceManagementComplete";
import InvoiceDetail from "./pages/Invoice/InvoiceDetail";
import InvoiceTemplateView from "./pages/Invoice/InvoiceTemplateView";
import InvoiceDetailTabs from "./pages/Invoice/InvoiceDetailTabs";
import SalesQuotation from "./pages/Sales/SalesQuotation";
import PayablesManagement from "./pages/Payables/PayablesNew";
import PaymentGateway from "./pages/Payables/PaymentGateway";
import FinanceDashboard from "./pages/Dashboard/FinanceDashboard";
import BankReconciliation from "./pages/BankReconciliation/BankReconciliation";
import IncentiveSimulation from "./pages/Incentives/IncentiveSimulation";
import FinancialReports from "./pages/Reports/FinancialReports";
import AssetManagement from "./pages/Assets/AssetManagement";

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<FinanceDashboard />} />
          <Route path="/coa" element={<COA />} />
          <Route path="/financial-cockpit" element={<FinancialCockpit />} />
          <Route path="/admin/policies/finance" element={<FinancialCockpit />} />
          <Route path="/journals/new" element={<GeneralJournalEntry />} />
          <Route path="/finance/journals/new" element={<GeneralJournalEntry />} />
          <Route path="/sales/quotation" element={<SalesQuotation />} />
          <Route path="/invoices" element={<InvoiceManagementComplete />} />
          <Route path="/invoices/:id" element={<InvoiceDetail />} />
          <Route path="/invoices/:id/template" element={<InvoiceTemplateView />} />
          <Route path="/invoices/new-from-quotation" element={<InvoiceDetailTabs />} />
          <Route path="/payables" element={<PayablesManagement />} />
          <Route path="/finance/payables" element={<PayablesManagement />} />
          <Route path="/finance/payment/:id" element={<PaymentGateway />} />
          <Route path="/bank-reconciliation" element={<BankReconciliation />} />
          <Route path="/assets" element={<AssetManagement />} />
          <Route path="/incentives/simulate" element={<IncentiveSimulation />} />
          <Route path="/journal" element={<Dashboard />} />
          <Route path="/journals" element={<Dashboard />} />
          <Route path="/reports" element={<FinancialReports />} />
          <Route path="/settings" element={<Dashboard />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;

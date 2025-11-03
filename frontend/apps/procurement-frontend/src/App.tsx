import React from "react";
import { CssBaseline } from "@mui/material";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { SnackbarProvider } from "notistack";
import DashboardPage from "./pages/DashboardPage";
import VendorsPage from "./pages/vendors";
import NewVendorPage from "./pages/vendors/NewVendorPage";
import NewVendorPricePage from "./pages/vendor-pricelist/NewVendorPricePage";
import VendorDetailPage from "./pages/vendors/VendorDetailPage";
import EditVendorPage from "./pages/vendors/EditVendorPage";
import MainLayout from "./layouts/MainLayout";

function App() {
  return (
    <SnackbarProvider
      maxSnack={3}
      anchorOrigin={{
        vertical: "top",
        horizontal: "right",
      }}
      autoHideDuration={3000}
      style={{
        marginTop: "64px",
      }}
    >
      <Router>
        <CssBaseline />
        <MainLayout>
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/vendors" element={<VendorsPage />} />
            <Route path="/vendors/new" element={<NewVendorPage />} />
            <Route path="/vendors/:id" element={<VendorDetailPage />} />
            <Route path="/vendors/:id/edit" element={<EditVendorPage />} />
            <Route path="/vendor-pricelist/new" element={<NewVendorPricePage />} />
          </Routes>
        </MainLayout>
      </Router>
    </SnackbarProvider>
  );
}

export default App;

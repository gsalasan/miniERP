import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/login";
import Dashboard from "./pages/dashboard";
import MyAttendances from "./pages/MyAttendances";
import MyRequests from "./pages/MyRequests";
import Approvals from "./pages/Approvals";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/my-attendances" element={<MyAttendances />} />
        <Route path="/my-requests" element={<MyRequests />} />
        <Route path="/approvals" element={<Approvals />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

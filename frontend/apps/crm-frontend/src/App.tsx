import React from 'react';
import { CssBaseline, Container, Typography, Box } from '@mui/material';

// Contoh komponen
function Header() {
  return (
    <Box sx={{ bgcolor: '#1976d2', color: 'white', p: 2 }}>
      <Typography variant="h5">CRM Header</Typography>
    </Box>
  );
}

function Sidebar() {
  return (
    <Box sx={{ width: 200, bgcolor: '#eeeeee', p: 2, minHeight: '100vh' }}>
      <Typography variant="subtitle1">Sidebar Menu</Typography>
      <ul>
        <li>Customers</li>
        <li>Pipeline</li>
        <li>Sales Order</li>
        <li>Quotations</li>
      </ul>
    </Box>
  );
}

function MainContent() {
  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" gutterBottom>
        Selamat datang di CRM miniERP
      </Typography>
      <Typography>
        Ini adalah halaman utama CRM. Silakan pilih menu di sidebar.
      </Typography>
    </Box>
  );
}

function App() {
  return (
    <Box>
      <CssBaseline />
      <Header />
      <Box sx={{ display: 'flex' }}>
        <Sidebar />
        <MainContent />
      </Box>
    </Box>
  );
}

export default App;

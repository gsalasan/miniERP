import React from 'react';
import { CssBaseline, Container, Typography } from '@mui/material';

function App() {
  return (
    <Container maxWidth="sm">
      <CssBaseline />
      <Typography variant="h3" align="center" gutterBottom>
        Welcome to miniERP Frontend
      </Typography>
      <Typography align="center">
        Start building your ERP modules here!
      </Typography>
    </Container>
  );
}

export default App;

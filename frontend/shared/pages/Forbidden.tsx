import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const Forbidden: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        px: 2,
      }}
    >
      <Typography variant="h1" sx={{ fontSize: 96, fontWeight: 'bold', mb: 2 }}>
        403
      </Typography>
      <Typography variant="h5" sx={{ mb: 3 }}>
        Access Forbidden
      </Typography>
      <Button variant="contained" onClick={() => navigate('/')}>
        Go to Home
      </Button>
    </Box>
  );
};

export default Forbidden;

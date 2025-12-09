import React, { useState } from 'react';
import { Box } from '@mui/material';
import WorkIcon from '@mui/icons-material/Work';

const Logo: React.FC = () => {
  const [imageError, setImageError] = useState(false);

  return (
    <Box sx={{ p: 2, textAlign: 'center' }}>
      {!imageError ? (
        <img
          src="/unais.png"
          alt="Company Logo"
          style={{ width: 160, height: 80, objectFit: 'contain' }}
          onError={() => setImageError(true)}
        />
      ) : (
        <WorkIcon sx={{ fontSize: 56, color: '#1976d2' }} />
      )}
    </Box>
  );
};

export default Logo;

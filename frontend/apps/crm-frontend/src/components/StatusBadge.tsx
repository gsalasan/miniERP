import React from 'react';
import { Box, BoxProps } from '@mui/material';

export type StatusType =
  | 'ACTIVE'
  | 'INACTIVE'
  | 'PROSPECT'
  | 'SUCCESS'
  | 'ERROR'
  | 'WARNING'
  | 'INFO';

interface StatusBadgeProps extends Omit<BoxProps, 'color'> {
  status: StatusType;
  label?: string;
}

const statusConfig = {
  ACTIVE: {
    backgroundColor: '#e8f5e8',
    color: '#2e7d32',
    label: 'Active',
  },
  INACTIVE: {
    backgroundColor: '#ffebee',
    color: '#c62828',
    label: 'Inactive',
  },
  PROSPECT: {
    backgroundColor: '#fff3e0',
    color: '#f57c00',
    label: 'Prospect',
  },
  SUCCESS: {
    backgroundColor: '#e8f5e8',
    color: '#2e7d32',
    label: 'Success',
  },
  ERROR: {
    backgroundColor: '#ffebee',
    color: '#c62828',
    label: 'Error',
  },
  WARNING: {
    backgroundColor: '#fff3e0',
    color: '#f57c00',
    label: 'Warning',
  },
  INFO: {
    backgroundColor: '#e3f2fd',
    color: '#1976d2',
    label: 'Info',
  },
};

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, label, sx, ...props }) => {
  const config = statusConfig[status];

  return (
    <Box
      sx={{
        backgroundColor: config.backgroundColor,
        color: config.color,
        px: 1.5,
        py: 0.5,
        borderRadius: 2,
        fontSize: '0.75rem',
        fontWeight: 'medium',
        textAlign: 'center',
        minWidth: 70,
        display: 'inline-block',
        textTransform: 'capitalize',
        ...sx,
      }}
      {...props}
    >
      {label || config.label}
    </Box>
  );
};

export default StatusBadge;

import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { Add as AddIcon, Inbox as InboxIcon } from '@mui/icons-material';

interface EmptyStateProps {
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionText,
  onAction,
  icon = <InboxIcon sx={{ fontSize: 64, color: 'text.disabled' }} />,
}) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        py: 8,
        px: 3,
        minHeight: 300,
      }}
    >
      {icon}
      <Typography
        variant='h4'
        sx={{ mt: 3, mb: 1, fontWeight: 600, color: 'text.primary' }}
      >
        {title}
      </Typography>
      <Typography
        variant='body1'
        color='text.secondary'
        sx={{ mb: 3, maxWidth: 400 }}
      >
        {description}
      </Typography>
      {actionText && onAction && (
        <Button
          variant='contained'
          size='large'
          startIcon={<AddIcon />}
          onClick={onAction}
          sx={{
            borderRadius: 3,
            textTransform: 'none',
            fontWeight: 600,
            px: 4,
            py: 1.5,
          }}
        >
          {actionText}
        </Button>
      )}
    </Box>
  );
};

export default EmptyState;

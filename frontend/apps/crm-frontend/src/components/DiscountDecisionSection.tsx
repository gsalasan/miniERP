import React, { useState } from 'react';
import {
  Box,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Paper,
  Divider,
} from '@mui/material';
import {
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  DiscountOutlined as DiscountIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

interface DiscountDecisionSectionProps {
  estimationId: string;
  currentStatus: string;
  requestedDiscount: number | null;
  approvedDiscount: number | null;
  onSuccess: () => void;
}

const DiscountDecisionSection: React.FC<DiscountDecisionSectionProps> = ({
  estimationId,
  currentStatus,
  requestedDiscount,
  approvedDiscount,
  onSuccess,
}) => {
  const { token, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const isCEO = user?.roles?.includes('CEO');
  const isPending = currentStatus === 'PENDING_DISCOUNT_APPROVAL';
  const isApproved = currentStatus === 'DISCOUNT_APPROVED';
  const isRejected = currentStatus === 'DISCOUNT_REJECTED';

  const handleDecision = async (decision: 'APPROVED' | 'REJECTED') => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(
        `http://localhost:4001/api/v1/estimations/${estimationId}/decide-discount`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ 
            decision: decision === 'APPROVED' ? 'Approved' : 'Rejected' 
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Gagal memproses keputusan');
      }

      setSuccess(
        decision === 'APPROVED'
          ? 'Diskon berhasil disetujui'
          : 'Diskon berhasil ditolak'
      );

      // Wait 1 second before refreshing
      setTimeout(() => {
        onSuccess();
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  // Only show to CEO
  if (!isCEO) {
    return null;
  }

  // Show status if already decided
  if (isApproved || isRejected) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: 2,
          bgcolor: isApproved ? 'success.50' : 'error.50',
          border: 1,
          borderColor: isApproved ? 'success.200' : 'error.200',
          mb: 2,
        }}
      >
        <Box display='flex' alignItems='center' gap={1} mb={1}>
          {isApproved ? (
            <ApproveIcon color='success' />
          ) : (
            <RejectIcon color='error' />
          )}
          <Typography variant='subtitle2' fontWeight='bold'>
            {isApproved ? 'Diskon Disetujui' : 'Diskon Ditolak'}
          </Typography>
        </Box>
        
        {isApproved && (
          <Typography variant='body2'>
            Diskon yang disetujui: <strong>{approvedDiscount}%</strong>
          </Typography>
        )}
      </Paper>
    );
  }

  // Show pending approval
  if (!isPending) {
    return null;
  }

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        bgcolor: 'warning.50',
        border: 1,
        borderColor: 'warning.200',
        mb: 2,
      }}
    >
      <Box display='flex' alignItems='center' gap={1} mb={1}>
        <DiscountIcon color='warning' />
        <Typography variant='subtitle2' fontWeight='bold'>
          CEO Approval Required
        </Typography>
      </Box>

      <Typography variant='body2' sx={{ mb: 2 }}>
        Sales telah mengajukan permintaan diskon:{' '}
        <strong>{requestedDiscount}%</strong>
      </Typography>

      <Divider sx={{ my: 2 }} />

      <Typography variant='caption' color='text.secondary' display='block' sx={{ mb: 2 }}>
        Sebagai CEO, Anda dapat menyetujui atau menolak permintaan diskon ini.
      </Typography>

      <Box display='flex' gap={2}>
        <Button
          variant='contained'
          color='success'
          onClick={() => handleDecision('APPROVED')}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={16} /> : <ApproveIcon />}
        >
          Setujui Diskon
        </Button>

        <Button
          variant='outlined'
          color='error'
          onClick={() => handleDecision('REJECTED')}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={16} /> : <RejectIcon />}
        >
          Tolak Diskon
        </Button>
      </Box>

      {error && (
        <Alert severity='error' sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity='success' sx={{ mt: 2 }}>
          {success}
        </Alert>
      )}
    </Paper>
  );
};

export default DiscountDecisionSection;

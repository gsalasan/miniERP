import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Alert,
  CircularProgress,
  Paper,
  InputAdornment,
} from '@mui/material';
import { DiscountOutlined as DiscountIcon } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

interface DiscountRequestSectionProps {
  estimationId: string;
  currentStatus: string;
  currentDiscount: number | null;
  requestedDiscount: number | null;
  onSuccess: () => void;
}

const DiscountRequestSection: React.FC<DiscountRequestSectionProps> = ({
  estimationId,
  currentStatus,
  currentDiscount,
  requestedDiscount,
  onSuccess,
}) => {
  const { token } = useAuth();
  const [discountPolicy, setDiscountPolicy] = useState<{ authorityLimit: number; maxDiscountLimit: number } | null>(null);
  const [discount, setDiscount] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const canRequestDiscount = [
    'APPROVED',
    'DISCOUNT_REJECTED',
  ].includes(currentStatus);

  const isPending = currentStatus === 'PENDING_DISCOUNT_APPROVAL';
  const isApproved = currentStatus === 'DISCOUNT_APPROVED';
  const isRejected = currentStatus === 'DISCOUNT_REJECTED';

  const handleRequestDiscount = async () => {
    if (!discount || parseFloat(discount) <= 0) {
      setError('Masukkan nilai diskon yang valid');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // ensure discount policy loaded
      if (!discountPolicy) {
        try {
          const resp = await fetch('http://localhost:4001/api/v1/discount-policies/SALES', {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (resp.ok) {
            const r = await resp.json();
            const d = r.data || r;
            setDiscountPolicy({ authorityLimit: Number(d.authority_limit || 0), maxDiscountLimit: Number(d.max_discount_limit || 0) });
          }
        } catch {
          // ignore, proceed to server validation
        }
      }

      // client-side block if exceeds max
      if (discountPolicy && parseFloat(discount) > discountPolicy.maxDiscountLimit) {
        throw new Error(`Diskon melebihi batas maksimal ${discountPolicy.maxDiscountLimit}%`);
      }

      const response = await fetch(
        `http://localhost:4001/api/v1/estimations/${estimationId}/request-discount-approval`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            discountPercentage: parseFloat(discount),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Gagal request discount');
      }

      setSuccess(data.message || data.data?.message || 'Permintaan approval diskon berhasil dikirim');
      setDiscount('');
      
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

  // Show current status if already requested/approved
  // Note: when rejected we still want to show the request form so sales can submit again
  if (isPending || isApproved) {
    return (
      <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.default', mb: 2 }}>
        <Typography variant='subtitle2' gutterBottom>
          Status Discount Approval
        </Typography>

        {isPending && (
          <Alert severity='warning' icon={<DiscountIcon />}>
            <Typography variant='body2'>
              <strong>Menunggu Approval CEO</strong>
            </Typography>
            <Typography variant='body2'>
              Diskon yang diminta: <strong>{requestedDiscount}%</strong>
            </Typography>
          </Alert>
        )}

        {isApproved && (
          <Alert severity='success' icon={<DiscountIcon />}>
            <Typography variant='body2'>
              <strong>Diskon Disetujui</strong>
            </Typography>
            <Typography variant='body2'>
              Diskon yang disetujui: <strong>{currentDiscount}%</strong>
            </Typography>
          </Alert>
        )}
      </Paper>
    );
  }

  // Show request form
  if (!canRequestDiscount) {
    return null;
  }

  return (
    <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.default', mb: 2 }}>
      <Typography variant='subtitle2' gutterBottom>
        Request Discount Approval
      </Typography>
      <Typography variant='caption' color='text.secondary' display='block' sx={{ mb: 2 }}>
        Ajukan permintaan diskon untuk estimasi ini. Diskon akan direview oleh CEO.
      </Typography>

      {/* If previously rejected, show rejection alert above the form so user can re-submit */}
      {isRejected && (
        <Alert severity='error' icon={<DiscountIcon />} sx={{ mb: 2 }}>
          <Typography variant='body2'>
            <strong>Diskon Ditolak</strong>
          </Typography>
          <Typography variant='body2' sx={{ mt: 1 }}>
            Anda dapat mengajukan permintaan diskon baru dengan nilai yang berbeda.
          </Typography>
        </Alert>
      )}

      <Box display='flex' gap={2} alignItems='flex-start'>
        <TextField
          size='small'
          type='number'
          label='Diskon (%)'
          value={discount}
          onChange={(e) => setDiscount(e.target.value)}
          disabled={loading}
          InputProps={{
            endAdornment: <InputAdornment position='end'>%</InputAdornment>,
          }}
          inputProps={{
            min: 0,
            max: 100,
            step: 0.1,
          }}
          sx={{ width: 180 }}
        />
        
        <Button
          variant='contained'
          color='primary'
          onClick={handleRequestDiscount}
          disabled={loading || !discount}
          startIcon={loading ? <CircularProgress size={16} /> : <DiscountIcon />}
        >
          {loading ? 'Mengirim...' : 'Request Approval'}
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

export default DiscountRequestSection;

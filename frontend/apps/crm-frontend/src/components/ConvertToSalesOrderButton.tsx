import React, { useState } from 'react';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Alert,
  Box,
  Typography,
  Link,
} from '@mui/material';
import { CheckCircle as CheckCircleIcon } from '@mui/icons-material';
import axios from 'axios';
import config from '../config';

interface ConvertToSalesOrderButtonProps {
  opportunityId: string;
  opportunityName: string;
  stageName?: string;
  onSuccess?: () => void;
}

interface ConversionResult {
  soId: string;
  soNumber: string;
  projectId: string | null;
  estimationId: string | null;
  status: 'CREATED' | 'PENDING_PROJECT' | 'ERROR';
  message?: string;
}

const ConvertToSalesOrderButton: React.FC<ConvertToSalesOrderButtonProps> = ({
  opportunityId,
  opportunityName,
  stageName,
  onSuccess,
}) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ConversionResult | null>(null);
  
  // Form fields
  const [projectName, setProjectName] = useState(opportunityName);
  const [topDays, setTopDays] = useState(30);
  const [signedDate, setSignedDate] = useState(new Date().toISOString().split('T')[0]);

  const isWon = stageName?.toUpperCase() === 'WON';

  const handleOpen = () => {
    setOpen(true);
    setError(null);
    setResult(null);
    setProjectName(opportunityName);
  };

  const handleClose = () => {
    setOpen(false);
    setError(null);
    setResult(null);
  };

  const handleConvert = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${config.API_BASE_URL}/api/v1/sales-orders/convert-from-opportunity`,
        {
          opportunityId,
          projectName: opportunityName.trim(),
          topDays: 30, // Default 30 days
          signedDate: new Date().toISOString().split('T')[0], // Today
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        setResult(response.data.data);
        setOpen(true); // Show success dialog
        
        if (onSuccess) {
          setTimeout(() => {
            onSuccess();
          }, 2000);
        }
      }
    } catch (err: any) {
      console.error('Error converting to SO:', err);
      
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Gagal mengkonversi Opportunity ke Sales Order');
      }
    } finally {
      setLoading(false);
    }
  };

  // Don't show button if not WON
  if (!isWon) {
    return null;
  }

  return (
    <>
      <Button
        variant="contained"
        color="success"
        startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <CheckCircleIcon />}
        onClick={handleConvert}
        fullWidth
        disabled={loading}
      >
        {loading ? 'Membuat Sales Order...' : 'Buat Sales Order'}
      </Button>

      {/* Success Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          Sales Order Berhasil Dibuat
        </DialogTitle>

        <DialogContent>
          {result && (
            <Box sx={{ mt: 2 }}>
              <Alert severity="success" icon={<CheckCircleIcon />} sx={{ mb: 2 }}>
                Sales Order berhasil dibuat!
              </Alert>

              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>SO Number:</strong> {result.soNumber}
              </Typography>

              {result.projectId && (
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Project ID:</strong>{' '}
                  <Link
                    href={`${config.API_BASE_URL}/projects/${result.projectId}`}
                    target="_blank"
                    rel="noopener"
                  >
                    {result.projectId}
                  </Link>
                </Typography>
              )}

              {result.estimationId && (
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Estimation ID:</strong>{' '}
                  <Link
                    href={`${config.API_BASE_URL}/estimations/${result.estimationId}`}
                    target="_blank"
                    rel="noopener"
                  >
                    {result.estimationId}
                  </Link>
                </Typography>
              )}

              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Status:</strong>{' '}
                <Chip
                  label={result.status}
                  color={
                    result.status === 'CREATED'
                      ? 'success'
                      : result.status === 'PENDING_PROJECT'
                      ? 'warning'
                      : 'error'
                  }
                  size="small"
                />
              </Typography>

              {result.message && (
                <Alert
                  severity={result.status === 'CREATED' ? 'info' : 'warning'}
                  sx={{ mt: 2 }}
                >
                  {result.message}
                </Alert>
              )}
            </Box>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose} variant="contained" color="primary">
            Tutup
          </Button>
        </DialogActions>
      </Dialog>

      {/* Error Alert */}
      {error && !loading && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
    </>
  );
};

export default ConvertToSalesOrderButton;

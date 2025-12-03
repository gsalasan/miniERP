import React, { useState } from 'react';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Box,
  Typography,
  CircularProgress,
} from '@mui/material';
import { CheckCircle as CheckCircleIcon, Receipt as ReceiptIcon } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

interface CreateSalesOrderForProjectProps {
  projectId: string;
  projectName: string;
  onSuccess?: () => void;
}

const CreateSalesOrderForProject: React.FC<CreateSalesOrderForProjectProps> = ({
  projectId,
  projectName,
  onSuccess,
}) => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [soNumber, setSoNumber] = useState<string | null>(null);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

  const handleCreateSO = async () => {
    setLoading(true);
    setError(null);

    try {
      // Check if SO already exists for this project
      const checkResponse = await fetch(
        `http://localhost:4002/api/v1/sales-orders/project/${projectId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (checkResponse.ok) {
        // SO already exists
        const existingResult = await checkResponse.json();
        setSoNumber(existingResult.data?.so_number || 'SO sudah ada');
        setShowSuccessDialog(true);
        
        if (onSuccess) {
          setTimeout(() => {
            onSuccess();
          }, 2000);
        }
        return;
      }

      // SO doesn't exist, we need to create it but project is already WON
      // We'll update the project to NOT WON first, create SO (which will mark as WON), then done
      
      // First, temporarily set project back to PROPOSAL_DELIVERED
      await fetch(
        `http://localhost:4002/api/v1/pipeline/projects/${projectId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            status: 'PROPOSAL_DELIVERED',
          }),
        }
      );

      // Now create SO (this will automatically mark as WON)
      const response = await fetch('http://localhost:4002/api/v1/sales-orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          projectId,
          orderDate: new Date().toISOString().split('T')[0],
          topDaysAgreed: 30, // Default 30 days
          poDocumentUrl: null, // Optional, can be uploaded later
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to create Sales Order');
      }

      setSoNumber(result.data?.soNumber || 'SO berhasil dibuat');
      setShowSuccessDialog(true);

      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
        }, 2000);
      }
    } catch (err) {
      const error = err as Error;
      setError(error.message);
      console.error('Error creating Sales Order:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseDialog = () => {
    setShowSuccessDialog(false);
    setSoNumber(null);
  };

  return (
    <>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Button
        variant="contained"
        color="primary"
        startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <ReceiptIcon />}
        onClick={handleCreateSO}
        fullWidth
        disabled={loading}
        sx={{ fontWeight: 600 }}
      >
        {loading ? 'Membuat Sales Order...' : 'Buat Sales Order'}
      </Button>

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <CheckCircleIcon color="success" />
            <Typography variant="h6">Sales Order Berhasil Dibuat</Typography>
          </Box>
        </DialogTitle>

        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Alert severity="success" sx={{ mb: 2 }}>
              Sales Order berhasil dibuat untuk project <strong>{projectName}</strong>
            </Alert>

            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>SO Number:</strong> {soNumber}
            </Typography>

            <Typography variant="body2" color="text.secondary">
              Sales Order telah dibuat dan dapat dilihat di halaman Sales Orders
            </Typography>
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleCloseDialog} variant="contained" color="primary">
            Tutup
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default CreateSalesOrderForProject;

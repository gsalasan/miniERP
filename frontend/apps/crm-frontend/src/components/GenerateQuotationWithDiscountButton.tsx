/**
 * Generate Quotation with Discount Button Component
 * Allows Sales to generate quotation with discount after estimation approval
 */

import React, { useState, useEffect } from 'react';
import {
  Button,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Box,
  Typography,
  TextField,
  InputAdornment,
  Snackbar,
} from '@mui/material';
import {
  PictureAsPdf as PdfIcon,
  DiscountOutlined as DiscountIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { generateQuotationPDF } from '../utils/quotationPdfGenerator';

interface GenerateQuotationWithDiscountButtonProps {
  estimationId: string;
  estimationStatus: string;
  approvedDiscount?: number | null;
  projectName?: string;
  subtotal?: number | null;
  opportunityId?: string;
  projectStatus?: string;
  variant?: 'contained' | 'outlined' | 'text';
  size?: 'small' | 'medium' | 'large';
}

const GenerateQuotationWithDiscountButton: React.FC<
  GenerateQuotationWithDiscountButtonProps
> = ({
  estimationId,
  estimationStatus,
  approvedDiscount,
  projectName = 'Project',
  subtotal = 0,
  projectStatus,
  variant = 'contained',
  size = 'medium',
}) => {
  const { token, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [discount, setDiscount] = useState<string>('0');
  const [discountPolicy, setDiscountPolicy] = useState<{
    authorityLimit: number;
    maxDiscountLimit: number;
  } | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'info' | 'warning'>('info');

  // Fetch discount policy based on user's role
  useEffect(() => {
    const fetchDiscountPolicy = async () => {
      try {
        // Get user's primary role for discount policy
        const userRole = user?.roles?.[0] || 'SALES';
        
        const response = await fetch(
          `http://localhost:4002/api/v1/discount-policies/${userRole}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          const result = await response.json();
          const data = result.data || result; // Handle both {data: ...} and direct response
          setDiscountPolicy({
            authorityLimit: Number(data.authority_limit || 0),
            maxDiscountLimit: Number(data.max_discount_limit || 0),
          });
          console.log(`Discount policy loaded for ${userRole}:`, {
            authorityLimit: Number(data.authority_limit || 0),
            maxDiscountLimit: Number(data.max_discount_limit || 0),
          });
        } else {
          console.error('Failed to fetch discount policy:', response.status);
        }
      } catch (err) {
        console.error('Failed to fetch discount policy:', err);
      }
    };

    if (token && user) {
      fetchDiscountPolicy();
    }
  }, [token, user]);

  // Set initial discount value based on estimation status
  useEffect(() => {
    if (estimationStatus === 'DISCOUNT_APPROVED' && approvedDiscount) {
      setDiscount(approvedDiscount.toString());
    }
  }, [estimationStatus, approvedDiscount]);

  // compute real-time final price from subtotal (fallback to 0)
  const subtotalValue = subtotal || 0;
  const discountValue = parseFloat(discount) || 0;
  const subtotalAfterDiscount = subtotalValue * (1 - discountValue / 100);

  // Debug log
  useEffect(() => {
    console.log('GenerateQuotationWithDiscountButton - subtotal:', subtotal);
    console.log('GenerateQuotationWithDiscountButton - subtotalValue:', subtotalValue);
    console.log('GenerateQuotationWithDiscountButton - discountValue:', discountValue);
    console.log('GenerateQuotationWithDiscountButton - subtotalAfterDiscount:', subtotalAfterDiscount);
  }, [subtotal, discount]);

  const canGenerate =
    estimationStatus === 'APPROVED' || estimationStatus === 'DISCOUNT_APPROVED';

  const needsApproval =
    !!discountPolicy && discountValue > discountPolicy.authorityLimit && discountValue <= discountPolicy.maxDiscountLimit;

  const exceedsMax = !!discountPolicy && discountValue > discountPolicy.maxDiscountLimit;

  const handleOpenDialog = () => {
    setShowDialog(true);
    setError(null);
  };

  const handleCloseDialog = () => {
    setShowDialog(false);
    setError(null);
  };

  const handleGenerateQuotation = async () => {
    try {
      setLoading(true);
      setError(null);

      const discountValue = parseFloat(discount) || 0;

      // Skip validation if discount already approved by CEO
      if (estimationStatus !== 'DISCOUNT_APPROVED') {
        // Validate discount only for APPROVED status
        if (exceedsMax) {
          throw new Error(
            `Diskon melebihi batas maksimal ${discountPolicy?.maxDiscountLimit}%`
          );
        }
      }

      // Generate quotation via CRM service
      // FITUR 3.1.E: Use estimationId instead of opportunityId
      const response = await fetch('http://localhost:4002/api/v1/quotations/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          estimationId: estimationId,
          discountPercentage: discountValue,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Gagal generate quotation');
      }

      // Success - Generate and download PDF
      const quotationData = result.data;

      // Generate PDF
      try {
        generateQuotationPDF(quotationData);
        setSnackbarSeverity('success');
        setSnackbarMessage(`Quotation ${quotationData.quotationNumber} berhasil dibuat. PDF telah didownload.`);
        setSnackbarOpen(true);
      } catch (pdfError) {
        console.error('Error generating PDF:', pdfError);
        setSnackbarSeverity('warning');
        setSnackbarMessage('Quotation berhasil dibuat, tetapi gagal generate PDF di browser.');
        setSnackbarOpen(true);
      }

      handleCloseDialog();

      // Reload page to show updated status
      setTimeout(() => {
        window.location.reload();
      }, 800);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Gagal generate quotation';
      console.error('Error generating quotation:', err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Request approval handler (calls engineering service)
  const handleRequestApproval = async () => {
    try {
      setLoading(true);
      setError(null);

      const discountValue = parseFloat(discount) || 0;

      if (!discountPolicy) {
        throw new Error('Discount policy belum dimuat');
      }

      if (discountValue > discountPolicy.maxDiscountLimit) {
        throw new Error(`Diskon melebihi batas maksimal ${discountPolicy.maxDiscountLimit}%`);
      }

      const resp = await fetch(
        `http://localhost:4001/api/v1/estimations/${estimationId}/request-discount-approval`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ discountPercentage: discountValue }),
        }
      );

      const rr = await resp.json();
      if (!resp.ok) throw new Error(rr.message || 'Gagal request approval');

      setSnackbarSeverity('success');
      setSnackbarMessage(rr.message || 'Permintaan approval diskon berhasil dikirim');
      setSnackbarOpen(true);
      handleCloseDialog();
      setTimeout(() => window.location.reload(), 800);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mengirim request approval');
    } finally {
      setLoading(false);
    }
  };

  // Hide button if quotation already generated
  if (!canGenerate || projectStatus === 'PROPOSAL_DELIVERED') {
    return null;
  }

  // Check if this is for viewing existing quotation (project already delivered)
  const isViewMode = projectStatus === 'APPROVED' && estimationStatus === 'DISCOUNT_APPROVED';

  return (
    <>
      <Button
        variant={variant}
        color="primary"
        size={size}
        onClick={handleOpenDialog}
        startIcon={<PdfIcon />}
        sx={{
          textTransform: 'none',
          fontWeight: 600,
        }}
      >
        {isViewMode ? 'Lihat/Regenerate PDF' : 'Generate Penawaran'}
      </Button>

      {/* Dialog for discount input */}
      <Dialog open={showDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <PdfIcon color="primary" />
            <Typography variant="h6">Generate Penawaran</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Project: <strong>{projectName}</strong>
          </Typography>

          {/* Discount input */}
          <Box sx={{ mb: 3 }}>
            <TextField
              fullWidth
              type="number"
              label="Diskon (%)"
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
              disabled={
                loading || estimationStatus === 'DISCOUNT_APPROVED'
              }
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <DiscountIcon />
                  </InputAdornment>
                ),
                endAdornment: <InputAdornment position="end">%</InputAdornment>,
              }}
              inputProps={{
                min: 0,
                max: 100,
                step: 0.1,
              }}
              helperText={
                estimationStatus === 'DISCOUNT_APPROVED'
                  ? 'Diskon telah disetujui CEO'
                  : `Batas wewenang Anda: ${discountPolicy?.authorityLimit || 0}%`
              }
            />
          </Box>

          {/* Real-time final price */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2">
              Harga sebelum diskon: <strong>{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(subtotalValue)}</strong>
            </Typography>
            <Typography variant="body1" sx={{ mt: 0.5 }}>
              Harga Final setelah diskon: <strong>{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(subtotalAfterDiscount)}</strong>
            </Typography>
          </Box>

          {/* Information about discount authority */}
          {discountPolicy && (
            <Alert
              severity={
                estimationStatus === 'DISCOUNT_APPROVED'
                  ? 'success'
                  : exceedsMax
                    ? 'error'
                    : needsApproval
                      ? 'warning'
                      : 'info'
              }
              sx={{ mb: 2 }}
            >
              {estimationStatus === 'DISCOUNT_APPROVED' ? (
                <Typography variant="body2">
                  Diskon {discount}% telah <strong>disetujui oleh CEO</strong>.
                  Quotation siap di-generate.
                </Typography>
              ) : exceedsMax ? (
                <Typography variant="body2">
                  Diskon {discount}% <strong>melebihi batas maksimal</strong> (
                  {discountPolicy.maxDiscountLimit}%). Tidak dapat diproses.
                </Typography>
              ) : needsApproval ? (
                <Typography variant="body2">
                  Diskon {discount}% <strong>memerlukan approval CEO</strong> karena
                  melebihi wewenang Anda ({discountPolicy.authorityLimit}%). Silakan
                  request approval terlebih dahulu.
                </Typography>
              ) : (
                <Typography variant="body2">
                  Diskon {discount}% <strong>dalam batas wewenang Anda</strong>.
                  Quotation dapat langsung di-generate.
                </Typography>
              )}
            </Alert>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Typography variant="caption" color="text.secondary" display="block">
            Setelah quotation di-generate, status project akan otomatis berubah menjadi
            "Proposal Delivered".
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={loading}>
            Batal
          </Button>

          {/* Request Approval button: visible when discount requires approval */}
          {estimationStatus !== 'DISCOUNT_APPROVED' && needsApproval && (
            <Button
              onClick={handleRequestApproval}
              variant="outlined"
              color="primary"
              disabled={loading}
              startIcon={<DiscountIcon />}
            >
              {loading ? 'Mengirim...' : 'Request Approval'}
            </Button>
          )}

          <Button
            onClick={handleGenerateQuotation}
            variant="contained"
            color="primary"
            disabled={
              loading ||
              (estimationStatus !== 'DISCOUNT_APPROVED' && (!!discountPolicy ? (exceedsMax || needsApproval) : false))
            }
            startIcon={loading ? <CircularProgress size={20} /> : <PdfIcon />}
          >
            {loading ? 'Generating...' : 'Generate Penawaran'}
          </Button>
        </DialogActions>
      </Dialog>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnackbarOpen(false)} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
};

export default GenerateQuotationWithDiscountButton;

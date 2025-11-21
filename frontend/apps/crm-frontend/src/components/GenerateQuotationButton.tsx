/**
 * Generate Quotation Button Component
 * Button to trigger quotation PDF generation
 */

import React, { useState } from 'react';
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
} from '@mui/material';
import { PictureAsPdf as PdfIcon } from '@mui/icons-material';
import { getQuotationData } from '../api/quotation';
import { generateQuotationPDF } from '../utils/pdfGenerator';
import { useAuth } from '../contexts/AuthContext';

interface GenerateQuotationButtonProps {
  opportunityId: string;
  projectName?: string;
  disabled?: boolean;
  variant?: 'contained' | 'outlined' | 'text';
  size?: 'small' | 'medium' | 'large';
  fullWidth?: boolean;
}

const GenerateQuotationButton: React.FC<GenerateQuotationButtonProps> = ({
  opportunityId,
  projectName = 'Project',
  disabled = false,
  variant = 'contained',
  size = 'medium',
  fullWidth = false,
}) => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showErrorDialog, setShowErrorDialog] = useState(false);

  const handleGenerateQuotation = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check if user is authenticated
      if (!token) {
        throw new Error('Authentication required. Please login again.');
      }

      // Fetch quotation data from backend
      const quotationData = await getQuotationData(opportunityId, token);

      // Generate PDF in browser
      generateQuotationPDF(quotationData);

      // Success feedback
      console.log('Quotation PDF generated successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate quotation';
      console.error('Error generating quotation:', err);
      setError(errorMessage);
      setShowErrorDialog(true);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseErrorDialog = () => {
    setShowErrorDialog(false);
    setError(null);
  };

  return (
    <>
      <Button
        variant={variant}
        color='primary'
        size={size}
        fullWidth={fullWidth}
        disabled={disabled || loading}
        onClick={handleGenerateQuotation}
        startIcon={loading ? <CircularProgress size={20} /> : <PdfIcon />}
        sx={{
          textTransform: 'none',
          fontWeight: 600,
        }}
      >
        {loading ? 'Generating...' : 'Generate Quotation'}
      </Button>

      {/* Error Dialog */}
      <Dialog open={showErrorDialog} onClose={handleCloseErrorDialog} maxWidth='sm' fullWidth>
        <DialogTitle>
          <Box display='flex' alignItems='center' gap={1}>
            <PdfIcon color='error' />
            <Typography variant='h6'>Failed to Generate Quotation</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity='error' sx={{ mb: 2 }}>
            {error}
          </Alert>
          <Typography variant='body2' color='text.secondary'>
            <strong>Possible reasons:</strong>
          </Typography>
          <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
            <li>
              <Typography variant='body2'>Estimation has not been approved yet</Typography>
            </li>
            <li>
              <Typography variant='body2'>Project data is incomplete</Typography>
            </li>
            <li>
              <Typography variant='body2'>Network connection issue</Typography>
            </li>
            <li>
              <Typography variant='body2'>Authentication token expired</Typography>
            </li>
          </ul>
          <Typography variant='body2' color='text.secondary' sx={{ mt: 2 }}>
            Please ensure the estimation is approved and try again.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseErrorDialog} color='primary'>
            Close
          </Button>
          <Button onClick={handleGenerateQuotation} variant='contained' color='primary'>
            Retry
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default GenerateQuotationButton;

/**
 * MarkAsWonLostButtons - Tombol untuk menandai project sebagai WON atau LOST
 * Muncul setelah proposal dikirim (status: Proposal Delivered)
 */

import React, { useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Typography,
  Alert,
} from '@mui/material';
import {
  CheckCircle as WonIcon,
  Cancel as LostIcon,
} from '@mui/icons-material';
import CreateSalesOrderModal from './CreateSalesOrderModal';
import { useAuth } from '../contexts/AuthContext';

interface MarkAsWonLostButtonsProps {
  projectId: string;
  projectName: string;
  projectStatus: string;
  contractValue: number;
  onSuccess: () => void;
}

const MarkAsWonLostButtons: React.FC<MarkAsWonLostButtonsProps> = ({
  projectId,
  projectName,
  projectStatus,
  contractValue,
  onSuccess,
}) => {
  const { token } = useAuth();
  const [showWonModal, setShowWonModal] = useState(false);
  const [showLostDialog, setShowLostDialog] = useState(false);
  const [lostReason, setLostReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Only show buttons if status is Proposal Delivered
  if (projectStatus !== 'PROPOSAL_DELIVERED') {
    return null;
  }

  const handleMarkAsLost = async () => {
    if (!lostReason.trim()) {
      setError('Alasan wajib diisi');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `http://localhost:4002/api/v1/pipeline/projects/${projectId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            status: 'LOST',
            notes: lostReason,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to mark project as LOST');
      }

      onSuccess();
      setShowLostDialog(false);
      setLostReason('');
    } catch (err) {
      const error = err as Error;
      setError(error.message);
      console.error('Error marking as LOST:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Box
        sx={{
          display: 'flex',
          gap: 2,
          p: 2,
          bgcolor: 'background.paper',
          borderRadius: 1,
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Button
          variant="contained"
          color="success"
          startIcon={<WonIcon />}
          onClick={() => setShowWonModal(true)}
          fullWidth
          sx={{ fontWeight: 600 }}
        >
          Tandai sebagai WON
        </Button>
        <Button
          variant="outlined"
          color="error"
          startIcon={<LostIcon />}
          onClick={() => setShowLostDialog(true)}
          fullWidth
        >
          Tandai sebagai LOST
        </Button>
      </Box>

      {/* Modal untuk WON - Buat Sales Order */}
      <CreateSalesOrderModal
        open={showWonModal}
        onClose={() => setShowWonModal(false)}
        projectId={projectId}
        projectName={projectName}
        contractValue={contractValue}
        onSuccess={onSuccess}
      />

      {/* Dialog untuk LOST */}
      <Dialog
        open={showLostDialog}
        onClose={() => !loading && setShowLostDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <LostIcon color="error" />
            <Typography variant="h6">Tandai sebagai LOST</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Proyek: <strong>{projectName}</strong>
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Alasan Proyek LOST"
            value={lostReason}
            onChange={(e) => setLostReason(e.target.value)}
            placeholder="contoh: Harga tidak kompetitif, pelanggan memilih vendor lain, dll"
            disabled={loading}
            required
            helperText="Jelaskan mengapa proyek ini tidak berhasil dimenangkan"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowLostDialog(false)} disabled={loading}>
            Batal
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleMarkAsLost}
            disabled={loading || !lostReason.trim()}
          >
            {loading ? 'Memproses...' : 'Konfirmasi LOST'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default MarkAsWonLostButtons;

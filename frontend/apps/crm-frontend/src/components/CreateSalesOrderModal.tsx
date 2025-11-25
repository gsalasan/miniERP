/**
 * CreateSalesOrderModal - Modal untuk membuat Sales Order ketika project di-mark sebagai WON
 * Fitur 3.1.F - Proses Penutupan (Closing) & Pembuatan Sales Order
 */

import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Alert,
  CircularProgress,
  InputAdornment,
  MenuItem,
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  CloudUpload as UploadIcon,
  Description as DocIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { estimationsApi } from '../api/engineering';

interface CreateSalesOrderModalProps {
  open: boolean;
  onClose: () => void;
  projectId: string;
  projectName: string;
  contractValue: number;
  onSuccess: () => void;
}

const CreateSalesOrderModal: React.FC<CreateSalesOrderModalProps> = ({
  open,
  onClose,
  projectId,
  projectName,
  contractValue,
  onSuccess,
}) => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [computedContractValue, setComputedContractValue] = useState<number | null>(null);
  
  // Form state
  const [customerPoNumber, setCustomerPoNumber] = useState('');
  const [orderDate, setOrderDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [topDaysAgreed, setTopDaysAgreed] = useState('30');
  const [poDocumentUrl, setPoDocumentUrl] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState('');

  // TOP options
  const topOptions = [
    { value: '0', label: 'Cash / Bayar Dimuka' },
    { value: '14', label: '14 Hari' },
    { value: '30', label: '30 Hari' },
    { value: '45', label: '45 Hari' },
    { value: '60', label: '60 Hari' },
    { value: 'custom', label: 'Custom (DP + Sisa)' },
  ];

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validasi ukuran file (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('Ukuran file maksimal 10MB');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append('file', file);

      // Upload ke local storage backend
      const response = await fetch('http://localhost:4002/api/v1/pipeline/uploads/local', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to upload file');
      }

      // Simpan URL file yang dikembalikan dari server
      setPoDocumentUrl(result.data.url);
      setUploadedFileName(file.name);
      
      console.log('File uploaded successfully:', result.data);
    } catch (err) {
      const error = err as Error;
      setError(error.message || 'Gagal mengupload file');
      console.error('Upload error:', error);
    } finally {
      setLoading(false);
    }
  };

  // When modal opens, recompute contract value from latest estimation (subtotal - discount + 11% VAT)
  useEffect(() => {
    const loadAndCompute = async () => {
      try {
        if (!open) return;
        const list = await estimationsApi.listByProject(projectId);
        if (!Array.isArray(list) || list.length === 0) {
          setComputedContractValue(null);
          return;
        }
        const chosen: any =
          list.find((e: any) => e.status === 'DISCOUNT_APPROVED') ||
          list.find((e: any) => e.status === 'APPROVED') ||
          list[0];
        // Prefer backend computed total with discount + tax if provided
        const backendTotal = Number(chosen?.computed_total_with_tax ?? 0);
        let total = backendTotal;
        if (!Number.isFinite(total) || total <= 0) {
          const subtotal = Number(chosen?.subtotal ?? chosen?.total_sell_price ?? 0);
          const discPct = Number(chosen?.approved_discount ?? chosen?.requested_discount ?? 0);
          const afterDisc = subtotal - subtotal * (discPct / 100);
          const VAT_RATE = 0.11;
          total = afterDisc + afterDisc * VAT_RATE;
        }
        setComputedContractValue(Number.isFinite(total) ? total : null);
      } catch (e) {
        setComputedContractValue(null);
      }
    };
    loadAndCompute();
  }, [open, projectId]);

  const handleSubmit = async () => {
    // Validation
    if (!customerPoNumber.trim()) {
      setError('Nomor PO Pelanggan wajib diisi');
      return;
    }

    if (!orderDate) {
      setError('Tanggal Order wajib diisi');
      return;
    }

    if (!poDocumentUrl) {
      setError('Dokumen PO/Kontrak wajib diupload');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:4002/api/v1/sales-orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          projectId,
          customerPoNumber,
          orderDate,
          topDaysAgreed: topDaysAgreed === 'custom' ? null : parseInt(topDaysAgreed),
          poDocumentUrl,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to create Sales Order');
      }

      // Success
      console.log('Sales Order created:', result.data);
      onSuccess();
      handleClose();
    } catch (err) {
      const error = err as Error;
      setError(error.message);
      console.error('Error creating Sales Order:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setCustomerPoNumber('');
      setOrderDate(new Date().toISOString().split('T')[0]);
      setTopDaysAgreed('30');
      setPoDocumentUrl('');
      setUploadedFileName('');
      setError(null);
      onClose();
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <CheckIcon color="success" />
          <Typography variant="h6">Konfirmasi WON & Buat Sales Order</Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Project Info (non-editable) */}
        <Box sx={{ mb: 3, p: 2, bgcolor: 'success.50', borderRadius: 1 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
            Informasi Proyek
          </Typography>
          <Typography variant="body2" color="text.secondary">
            <strong>Nama Proyek:</strong> {projectName}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            <strong>Nilai Kontrak:</strong> {formatCurrency(
              computedContractValue ?? contractValue
            )}
          </Typography>
        </Box>

        {/* Form Fields */}
        <TextField
          fullWidth
          required
          label="Nomor PO Pelanggan"
          value={customerPoNumber}
          onChange={(e) => setCustomerPoNumber(e.target.value)}
          placeholder="contoh: PO-2025-001"
          disabled={loading}
          sx={{ mb: 2 }}
          helperText="Nomor Purchase Order dari pelanggan"
        />

        <TextField
          fullWidth
          required
          type="date"
          label="Tanggal Order"
          value={orderDate}
          onChange={(e) => setOrderDate(e.target.value)}
          disabled={loading}
          sx={{ mb: 2 }}
          InputLabelProps={{ shrink: true }}
          helperText="Tanggal PO atau tanggal kontrak ditandatangani"
        />

        <TextField
          fullWidth
          select
          label="Termin Pembayaran (TOP)"
          value={topDaysAgreed}
          onChange={(e) => setTopDaysAgreed(e.target.value)}
          disabled={loading}
          sx={{ mb: 2 }}
          helperText="Pilih termin pembayaran yang disepakati"
        >
          {topOptions.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>

        {/* File Upload */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
            Upload Dokumen PO/Kontrak <span style={{ color: 'red' }}>*</span>
          </Typography>
          <Button
            variant="outlined"
            component="label"
            startIcon={<UploadIcon />}
            disabled={loading}
            fullWidth
            sx={{ mb: 1 }}
          >
            {uploadedFileName || 'Pilih File (PDF, Image, Scan)'}
            <input
              type="file"
              hidden
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              onChange={handleFileUpload}
            />
          </Button>
          {uploadedFileName && (
            <Box display="flex" alignItems="center" gap={1} sx={{ mt: 1 }}>
              <DocIcon fontSize="small" color="primary" />
              <Typography variant="caption" color="primary">
                {uploadedFileName}
              </Typography>
            </Box>
          )}
          <Typography variant="caption" color="text.secondary">
            File wajib diupload untuk keperluan legal & tracking
          </Typography>
        </Box>

        <Alert severity="info" sx={{ mt: 2 }}>
          <Typography variant="body2">
            Setelah Sales Order dibuat, proyek akan otomatis berpindah ke status{' '}
            <strong>WON</strong> dan tim Operasional akan menerima notifikasi untuk
            memulai pekerjaan.
          </Typography>
        </Alert>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Batal
        </Button>
        <Button
          variant="contained"
          color="success"
          onClick={handleSubmit}
          disabled={loading || !customerPoNumber || !orderDate || !poDocumentUrl}
          startIcon={loading ? <CircularProgress size={20} /> : <CheckIcon />}
        >
          {loading ? 'Memproses...' : 'Buat Sales Order & Mulai Proyek'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateSalesOrderModal;

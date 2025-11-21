/**
 * SalesOrderDetailModal - Modal untuk menampilkan detail Sales Order
 */

import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Grid,
  Divider,
  Chip,
  IconButton,
} from '@mui/material';
import {
  Close as CloseIcon,
  Business as BusinessIcon,
  Description as DescriptionIcon,
  CalendarToday as CalendarIcon,
  AttachMoney as MoneyIcon,
  CheckCircle as CheckIcon,
} from '@mui/icons-material';

interface SalesOrderDetailModalProps {
  open: boolean;
  onClose: () => void;
  salesOrder: {
    id: string;
    so_number: string;
    customer_po_number: string;
    order_date: string;
    top_days_agreed: number | null;
    contract_value: number;
    po_document_url: string | null;
    created_at: string;
    project: {
      id: string;
      project_name: string;
      customer: {
        name: string;
      } | null;
    };
  };
}

const SalesOrderDetailModal: React.FC<SalesOrderDetailModalProps> = ({
  open,
  onClose,
  salesOrder,
}) => {
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={1}>
            <CheckIcon color="success" />
            <Typography variant="h6">Detail Sales Order</Typography>
          </Box>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {/* SO Number Badge */}
        <Box sx={{ mb: 3, textAlign: 'center' }}>
          <Chip
            label={salesOrder.so_number}
            color="primary"
            size="large"
            sx={{ fontSize: '1.2rem', fontWeight: 700, px: 3, py: 2 }}
          />
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* Sales Order Information */}
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
          Informasi Sales Order
        </Typography>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={6}>
            <Box display="flex" alignItems="center" gap={1} sx={{ mb: 1 }}>
              <DescriptionIcon fontSize="small" color="action" />
              <Typography variant="caption" color="text.secondary">
                Nomor PO Pelanggan
              </Typography>
            </Box>
            <Typography variant="body1" sx={{ fontWeight: 600 }}>
              {salesOrder.customer_po_number}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Box display="flex" alignItems="center" gap={1} sx={{ mb: 1 }}>
              <CalendarIcon fontSize="small" color="action" />
              <Typography variant="caption" color="text.secondary">
                Tanggal Order
              </Typography>
            </Box>
            <Typography variant="body1" sx={{ fontWeight: 600 }}>
              {formatDate(salesOrder.order_date)}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Box display="flex" alignItems="center" gap={1} sx={{ mb: 1 }}>
              <MoneyIcon fontSize="small" color="action" />
              <Typography variant="caption" color="text.secondary">
                Termin Pembayaran (TOP)
              </Typography>
            </Box>
            <Typography variant="body1" sx={{ fontWeight: 600 }}>
              {salesOrder.top_days_agreed
                ? `${salesOrder.top_days_agreed} Hari`
                : 'Custom / DP + Sisa'}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Box display="flex" alignItems="center" gap={1} sx={{ mb: 1 }}>
              <CalendarIcon fontSize="small" color="action" />
              <Typography variant="caption" color="text.secondary">
                Tanggal Dibuat
              </Typography>
            </Box>
            <Typography variant="body1" sx={{ fontWeight: 600 }}>
              {formatDate(salesOrder.created_at)}
            </Typography>
          </Grid>
        </Grid>

        <Divider sx={{ mb: 3 }} />

        {/* Project Information */}
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
          Informasi Proyek
        </Typography>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12}>
            <Box display="flex" alignItems="center" gap={1} sx={{ mb: 1 }}>
              <DescriptionIcon fontSize="small" color="action" />
              <Typography variant="caption" color="text.secondary">
                Nama Proyek
              </Typography>
            </Box>
            <Typography variant="body1" sx={{ fontWeight: 600 }}>
              {salesOrder.project.project_name}
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <Box display="flex" alignItems="center" gap={1} sx={{ mb: 1 }}>
              <BusinessIcon fontSize="small" color="action" />
              <Typography variant="caption" color="text.secondary">
                Customer
              </Typography>
            </Box>
            <Typography variant="body1" sx={{ fontWeight: 600 }}>
              {salesOrder.project.customer?.customer_name || salesOrder.project.customer?.name || 'N/A'}
            </Typography>
          </Grid>
        </Grid>

        <Divider sx={{ mb: 3 }} />

        {/* Contract Value */}
        <Box
          sx={{
            bgcolor: 'success.50',
            p: 3,
            borderRadius: 2,
            textAlign: 'center',
          }}
        >
          <Typography variant="caption" color="text.secondary" sx={{ mb: 1 }}>
            Nilai Kontrak
          </Typography>
          <Typography
            variant="h4"
            sx={{ fontWeight: 700, color: 'success.main' }}
          >
            {formatCurrency(salesOrder.contract_value)}
          </Typography>
        </Box>

        {/* PO Document */}
        {salesOrder.po_document_url && (
          <Box sx={{ mt: 3 }}>
            <Divider sx={{ mb: 2 }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
              Dokumen PO/Kontrak
            </Typography>
            <Button
              variant="outlined"
              startIcon={<DescriptionIcon />}
              href={salesOrder.po_document_url}
              target="_blank"
              fullWidth
            >
              Lihat Dokumen PO
            </Button>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} variant="contained">
          Tutup
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SalesOrderDetailModal;

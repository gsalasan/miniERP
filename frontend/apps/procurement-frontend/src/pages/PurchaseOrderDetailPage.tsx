import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Alert,
  Paper,
  Grid,
  Card,
  CardContent,
  Divider,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Stack,
  CircularProgress,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import { 
  ArrowBack as ArrowBackIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Email as EmailIcon,
  Send as SendIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { poApi } from '../api/po';
import { POStatus } from '../types/rfp';
import { useAuth } from '../contexts/AuthContext';

const POStatusLabels: Record<POStatus, string> = {
  [POStatus.DRAFT]: 'Draft',
  [POStatus.SENT_TO_VENDOR]: 'Terkirim ke Vendor',
  [POStatus.ACKNOWLEDGED]: 'Diterima Vendor',
  [POStatus.PARTIALLY_RECEIVED]: 'Sebagian Diterima',
  [POStatus.COMPLETED]: 'Selesai',
  [POStatus.CANCELLED]: 'Dibatalkan',
};

const POStatusColors: Record<
  POStatus,
  'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'
> = {
  [POStatus.DRAFT]: 'warning',
  [POStatus.SENT_TO_VENDOR]: 'info',
  [POStatus.ACKNOWLEDGED]: 'primary',
  [POStatus.PARTIALLY_RECEIVED]: 'secondary',
  [POStatus.COMPLETED]: 'success',
  [POStatus.CANCELLED]: 'error',
};

const PurchaseOrderDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user, token, isAuthenticated, isLoading: authLoading } = useAuth();
  const [po, setPo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  
  // Approval workflow states
  const [actionDialog, setActionDialog] = useState<'submit' | 'approve' | 'reject' | null>(null);
  const [downloadingPDF, setDownloadingPDF] = useState(false);
  const [comments, setComments] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Check user permissions based on roles
  const isProcurementAdmin = user?.roles?.includes('PROCUREMENT_ADMIN');
  const canApprovePO = user?.roles?.some((role: string) =>
    ['CEO', 'PROCUREMENT_MANAGER'].includes(role)
  );
  const canSubmitPO = isAuthenticated; // Any authenticated user can submit
  
  // Debug logging
  useEffect(() => {
    console.log('=== PO Detail Page Auth Debug ===');
    console.log('authLoading:', authLoading);
    console.log('User:', user);
    console.log('Token:', token ? 'EXISTS' : 'MISSING');
    console.log('isAuthenticated:', isAuthenticated);
    console.log('User roles:', user?.roles);
    console.log('isProcurementAdmin:', isProcurementAdmin);
    console.log('canApprovePO:', canApprovePO);
    console.log('canSubmitPO:', canSubmitPO);
    if (po) {
      console.log('PO approval_status:', po.approval_status);
      console.log('Should show Submit button:', po.approval_status === 'DRAFT' && canSubmitPO);
    }
    console.log('================================');
  }, [authLoading, user, token, isAuthenticated, isProcurementAdmin, canApprovePO, canSubmitPO, po]);

  const loadPODetail = async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);
      const data = await poApi.getPOById(id);
      setPo(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Terjadi kesalahan saat memuat detail PO'
      );
      console.error('Error loading PO detail:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPODetail();
  }, [id]);

  const handleBack = () => {
    navigate('/purchases');
  };

  const handleStatusChange = async (newStatus: POStatus) => {
    if (!id) return;

    try {
      setUpdatingStatus(true);
      await poApi.updatePOStatus(id, newStatus);
      setPo({ ...po, status: newStatus });
    } catch (err) {
      console.error('Error updating status:', err);
      setError(err instanceof Error ? err.message : 'Gagal mengubah status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleOpenDialog = (action: 'submit' | 'approve' | 'reject') => {
    setActionDialog(action);
    setComments('');
    setError(null);
    setSuccess(null);
  };

  const handleCloseDialog = () => {
    setActionDialog(null);
    setComments('');
  };

  const handleDownloadPDF = async () => {
    if (!id) return;

    try {
      setDownloadingPDF(true);
      setError(null);

      console.log('[PO Detail] Downloading PDF for PO:', id);

      const blob = await poApi.downloadPOPDF(id);

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `PO-${po.po_number || id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setSuccess('PDF berhasil didownload');
    } catch (err) {
      console.error('Error downloading PDF:', err);
      setError(err instanceof Error ? err.message : 'Gagal mendownload PDF');
    } finally {
      setDownloadingPDF(false);
    }
  };

  const handleSubmitAction = async () => {
    if (!id || !actionDialog) return;

    try {
      setSubmitting(true);
      setError(null);

      const userId = user?.id;
      if (!userId) {
        setError('User ID tidak ditemukan. Silakan login kembali.');
        return;
      }

      console.log(`[PO Detail] Submitting ${actionDialog} action:`, {
        poId: id,
        userId,
        userIdType: typeof userId,
        action: actionDialog,
      });

      switch (actionDialog) {
        case 'submit':
          await poApi.submitForApproval(id, userId);
          setSuccess('PO berhasil disubmit untuk approval');
          break;
        case 'approve':
          await poApi.approvePO(id, userId, comments || undefined);
          setSuccess('PO berhasil diapprove');
          break;
        case 'reject':
          if (!comments.trim()) {
            setError('Alasan penolakan harus diisi');
            return;
          }
          await poApi.rejectPO(id, userId, comments);
          setSuccess('PO berhasil ditolak');
          break;
      }

      // Reload PO data
      await loadPODetail();
      handleCloseDialog();
    } catch (err) {
      console.error(`Error ${actionDialog}ing PO:`, err);
      setError(err instanceof Error ? err.message : `Gagal ${actionDialog} PO`);
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (value: number | undefined) => {
    if (!value) return '-';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  // Show loading while auth or PO data is loading
  if (loading || authLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px" flexDirection="column" gap={2}>
        <CircularProgress />
        <Typography variant="body2" color="text.secondary">
          {authLoading ? 'Loading authentication...' : 'Loading PO data...'}
        </Typography>
      </Box>
    );
  }

  if (error || !po) {
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error || 'PO tidak ditemukan'}
        </Alert>
        <Button startIcon={<ArrowBackIcon />} onClick={handleBack}>
          Kembali ke Daftar Purchase Orders
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Detail Purchase Order
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {po.po_number}
          </Typography>
        </Box>
        <Stack direction="row" spacing={2}>
          {/* Debug info - remove later */}
          {process.env.NODE_ENV === 'development' && (
            <Box sx={{ p: 1, bgcolor: 'info.light', borderRadius: 1, fontSize: '0.75rem' }}>
              Status: {po.approval_status} | Submit: {canSubmitPO ? '✅' : '❌'}
            </Box>
          )}
          
          {/* Approval Status Workflow Buttons */}
          {/* Any user: Submit for Approval */}
          {po.approval_status === 'DRAFT' && canSubmitPO && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<SendIcon />}
              onClick={() => handleOpenDialog('submit')}
            >
              Submit for Approval
            </Button>
          )}
          
          {/* CEO/PROCUREMENT_MANAGER: Approve or Reject */}
          {(po.approval_status === 'PENDING_L1' || po.approval_status === 'PENDING_L2') && canApprovePO && (
            <>
              <Button
                variant="contained"
                color="success"
                startIcon={<ApproveIcon />}
                onClick={() => handleOpenDialog('approve')}
              >
                Approve
              </Button>
              <Button
                variant="contained"
                color="error"
                startIcon={<RejectIcon />}
                onClick={() => handleOpenDialog('reject')}
              >
                Reject
              </Button>
            </>
          )}

          {/* Download PDF button for approved PO */}
          {po.approval_status === 'APPROVED' && (
            <Button
              variant="contained"
              color="success"
              startIcon={downloadingPDF ? <CircularProgress size={20} color="inherit" /> : <EmailIcon />}
              onClick={handleDownloadPDF}
              disabled={downloadingPDF}
            >
              {downloadingPDF ? 'Downloading...' : 'Download PO PDF'}
            </Button>
          )}

          <Button startIcon={<ArrowBackIcon />} onClick={handleBack}>
            Kembali
          </Button>
        </Stack>
      </Stack>

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Role-based info alerts */}
      {po.approval_status === 'DRAFT' && canSubmitPO && (
        <Alert severity="info" sx={{ mb: 2 }}>
          PO ini masih dalam status DRAFT. Klik tombol "Submit for Approval" untuk memulai proses approval.
        </Alert>
      )}

      {(po.approval_status === 'PENDING_L1' || po.approval_status === 'PENDING_L2') && !canApprovePO && (
        <Alert severity="info" sx={{ mb: 2 }}>
          PO ini sedang menunggu approval dari CEO atau PROCUREMENT_MANAGER.
        </Alert>
      )}

      {/* PO Information */}
      <Grid container spacing={3}>
        {/* Left Column - Main Info */}
        <Grid item xs={12} md={8}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Informasi Purchase Order
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Nomor PO
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {po.po_number}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Status
                  </Typography>
                  <Box sx={{ mt: 0.5 }}>
                    <FormControl size="small" sx={{ minWidth: 200 }}>
                      <Select
                        value={po.status}
                        onChange={(e) => handleStatusChange(e.target.value as POStatus)}
                        disabled={updatingStatus || po.status === POStatus.CANCELLED}
                      >
                        {Object.entries(POStatusLabels).map(([value, label]) => (
                          <MenuItem key={value} value={value}>
                            <Chip
                              label={label}
                              color={POStatusColors[value as POStatus]}
                              size="small"
                            />
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Vendor
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {po.vendor_name}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Tanggal Order
                  </Typography>
                  <Typography variant="body1">{formatDate(po.order_date)}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Estimasi Pengiriman
                  </Typography>
                  <Typography variant="body1">{formatDate(po.expected_delivery)}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Dibuat Oleh
                  </Typography>
                  <Typography variant="body1">
                    {po.creator?.employee?.full_name || po.creator?.email || '-'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Approval Status
                  </Typography>
                  <Chip
                    label={po.approval_status || 'DRAFT'}
                    color={
                      po.approval_status === 'APPROVED' ? 'success' :
                      po.approval_status === 'REJECTED' ? 'error' :
                      po.approval_status?.startsWith('PENDING') ? 'warning' : 'default'
                    }
                    size="small"
                    sx={{ mt: 0.5 }}
                  />
                </Grid>
                {po.payment_terms && (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      Term Pembayaran
                    </Typography>
                    <Typography variant="body1">{po.payment_terms}</Typography>
                  </Grid>
                )}
                {po.rfp && (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      Referensi RFP
                    </Typography>
                    <Typography variant="body1">
                      {po.rfp.rfp_number} - {po.rfp.project_name}
                    </Typography>
                  </Grid>
                )}
                {po.notes && (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      Catatan
                    </Typography>
                    <Paper sx={{ p: 2, bgcolor: 'grey.50', mt: 1 }}>
                      <Typography variant="body2">{po.notes}</Typography>
                    </Paper>
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>

          {/* Items Table */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Daftar Item
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>
                        <strong>No</strong>
                      </TableCell>
                      <TableCell>
                        <strong>Nama Item</strong>
                      </TableCell>
                      <TableCell>
                        <strong>Jenis</strong>
                      </TableCell>
                      <TableCell align="right">
                        <strong>Kuantitas</strong>
                      </TableCell>
                      <TableCell>
                        <strong>Satuan</strong>
                      </TableCell>
                      <TableCell align="right">
                        <strong>Harga Satuan</strong>
                      </TableCell>
                      <TableCell align="right">
                        <strong>Total</strong>
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {po.items && po.items.length > 0 ? (
                      po.items.map((item: any, index: number) => (
                        <TableRow key={item.id}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>
                            <Typography variant="body2">{item.item_name}</Typography>
                            {item.notes && (
                              <Typography variant="caption" color="text.secondary">
                                {item.notes}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={item.item_type === 'MATERIAL' ? 'Material' : 'Jasa'}
                              size="small"
                              color={item.item_type === 'MATERIAL' ? 'primary' : 'secondary'}
                            />
                          </TableCell>
                          <TableCell align="right">{item.quantity}</TableCell>
                          <TableCell>{item.unit}</TableCell>
                          <TableCell align="right">
                            {formatCurrency(item.unit_price)}
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" fontWeight="bold">
                              {formatCurrency(item.total_price)}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} align="center">
                          <Typography variant="body2" color="text.secondary">
                            Tidak ada item
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Right Column - Summary */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Ringkasan
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Stack spacing={2}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Total Item
                  </Typography>
                  <Typography variant="h4" color="primary">
                    {po.items?.length || 0}
                  </Typography>
                </Box>
                <Divider />
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Total Amount
                  </Typography>
                  <Typography variant="h5" fontWeight="bold">
                    {formatCurrency(po.total_amount)}
                  </Typography>
                </Box>
                <Divider />
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Status Saat Ini
                  </Typography>
                  <Chip
                    label={POStatusLabels[po.status as POStatus]}
                    color={POStatusColors[po.status as POStatus]}
                    sx={{ mt: 1 }}
                  />
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Action Dialog */}
      <Dialog open={!!actionDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {actionDialog === 'submit' && 'Submit PO untuk Approval'}
          {actionDialog === 'approve' && 'Approve Purchase Order'}
          {actionDialog === 'reject' && 'Reject Purchase Order'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2, mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              PO Number: <strong>{po.po_number}</strong>
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Vendor: <strong>{po.vendor_name}</strong>
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Amount: <strong>{formatCurrency(po.total_amount)}</strong>
            </Typography>
          </Box>

          {actionDialog === 'submit' && (
            <Alert severity="info" sx={{ mb: 2 }}>
              PO akan disubmit untuk proses approval. Pastikan semua data sudah benar.
            </Alert>
          )}

          {(actionDialog === 'approve' || actionDialog === 'reject') && (
            <TextField
              fullWidth
              label={actionDialog === 'reject' ? 'Alasan Penolakan *' : 'Komentar (Opsional)'}
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              multiline
              rows={4}
              required={actionDialog === 'reject'}
              helperText={
                actionDialog === 'reject'
                  ? 'Harap berikan alasan penolakan'
                  : 'Tambahkan komentar jika diperlukan'
              }
              sx={{ mt: 1 }}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={submitting}>
            Batal
          </Button>
          <Button
            onClick={handleSubmitAction}
            variant="contained"
            color={
              actionDialog === 'approve' ? 'success' :
              actionDialog === 'reject' ? 'error' : 'primary'
            }
            disabled={submitting || (actionDialog === 'reject' && !comments.trim())}
          >
            {submitting ? (
              <CircularProgress size={24} />
            ) : (
              actionDialog === 'submit' ? 'Submit' :
              actionDialog === 'approve' ? 'Approve' : 'Reject'
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PurchaseOrderDetailPage;

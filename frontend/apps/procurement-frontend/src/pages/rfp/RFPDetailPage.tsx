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
  Breadcrumbs,
  Link,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  AddShoppingCart as AddShoppingCartIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { rfpApi } from '../../api/rfp';
import { RFP, RFPStatus } from '../../types/rfp';
import { format } from 'date-fns';
import CreatePOModal from '../../components/rfp/CreatePOModal';

const RFPStatusLabels: Record<RFPStatus, string> = {
  [RFPStatus.PENDING]: 'Pending',
  [RFPStatus.IN_PROCESS]: 'Diproses',
  [RFPStatus.PO_CREATED]: 'PO Dibuat',
  [RFPStatus.COMPLETED]: 'Selesai',
  [RFPStatus.CANCELLED]: 'Dibatalkan',
};

const RFPStatusColors: Record<
  RFPStatus,
  'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'
> = {
  [RFPStatus.PENDING]: 'warning',
  [RFPStatus.IN_PROCESS]: 'info',
  [RFPStatus.PO_CREATED]: 'primary',
  [RFPStatus.COMPLETED]: 'success',
  [RFPStatus.CANCELLED]: 'error',
};

const RFPDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [rfp, setRfp] = useState<RFP | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreatePOModal, setShowCreatePOModal] = useState(false);

  const loadRFPDetail = async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);
      const data = await rfpApi.getRFPById(id);
      setRfp(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Terjadi kesalahan saat memuat detail RFP'
      );
      console.error('Error loading RFP detail:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRFPDetail();
  }, [id]);

  const handleBack = () => {
    navigate('/rfp-queue');
  };

  const handleCreatePO = () => {
    // Navigate to Convert RFP to PO page
    navigate(`/rfp/${id}/convert-to-po`);
  };

  const handlePOCreated = () => {
    setShowCreatePOModal(false);
    loadRFPDetail(); // Reload to get updated status
  };

  const formatCurrency = (value: number | undefined) => {
    if (!value) return '-';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error || !rfp) {
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error || 'RFP tidak ditemukan'}
        </Alert>
        <Button startIcon={<ArrowBackIcon />} onClick={handleBack}>
          Kembali ke Antrian RFP
        </Button>
      </Box>
    );
  }

  const canCreatePO =
    rfp.status === RFPStatus.PENDING || rfp.status === RFPStatus.IN_PROCESS;

  return (
    <Box>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link
          component="button"
          variant="body2"
          onClick={handleBack}
          sx={{ cursor: 'pointer', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
        >
          Antrian RFP
        </Link>
        <Typography variant="body2" color="text.primary">
          {rfp.rfp_number}
        </Typography>
      </Breadcrumbs>

      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Detail RFP
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {rfp.rfp_number}
          </Typography>
        </Box>
        <Stack direction="row" spacing={2}>
          <Button startIcon={<ArrowBackIcon />} onClick={handleBack}>
            Kembali
          </Button>
          {canCreatePO && (
            <Button
              variant="contained"
              startIcon={<AddShoppingCartIcon />}
              onClick={handleCreatePO}
            >
              Buat Purchase Order
            </Button>
          )}
        </Stack>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* RFP Information */}
      <Grid container spacing={3}>
        {/* Left Column - Main Info */}
        <Grid item xs={12} md={8}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Informasi RFP
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Nomor RFP
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {rfp.rfp_number}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Status
                  </Typography>
                  <Chip
                    label={RFPStatusLabels[rfp.status]}
                    color={RFPStatusColors[rfp.status]}
                    size="small"
                    sx={{ mt: 0.5 }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Nama Proyek
                  </Typography>
                  <Typography variant="body1">{rfp.project_name}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Kode Proyek
                  </Typography>
                  <Typography variant="body1">{rfp.project_code || '-'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Pengaju
                  </Typography>
                  <Typography variant="body1">{rfp.requester_name}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {rfp.requester_email}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Tanggal Dibuat
                  </Typography>
                  <Typography variant="body1">
                    {format(new Date(rfp.created_at), 'dd MMMM yyyy, HH:mm')}
                  </Typography>
                </Grid>
                {rfp.notes && (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      Catatan
                    </Typography>
                    <Paper sx={{ p: 2, bgcolor: 'grey.50', mt: 1 }}>
                      <Typography variant="body2">{rfp.notes}</Typography>
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
                Daftar Item yang Diminta
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
                        <strong>Est. Harga</strong>
                      </TableCell>
                      <TableCell>
                        <strong>Catatan</strong>
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rfp.items && rfp.items.length > 0 ? (
                      rfp.items.map((item, index) => (
                        <TableRow key={item.id}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>
                            <Typography variant="body2">{item.item_name}</Typography>
                            {item.material_name && (
                              <Typography variant="caption" color="text.secondary">
                                SKU: {item.material_sku}
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
                            {formatCurrency(item.estimated_price)}
                          </TableCell>
                          <TableCell>
                            <Typography variant="caption">{item.notes || '-'}</Typography>
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
                    {rfp.items?.length || 0}
                  </Typography>
                </Box>
                <Divider />
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Estimasi Total Biaya
                  </Typography>
                  <Typography variant="h5">
                    {formatCurrency(
                      rfp.items?.reduce(
                        (total, item) => total + (item.estimated_price || 0) * item.quantity,
                        0
                      )
                    )}
                  </Typography>
                </Box>
                {rfp.status === RFPStatus.PO_CREATED && (
                  <>
                    <Divider />
                    <Alert severity="info" icon={<CheckCircleIcon />}>
                      Purchase Order telah dibuat untuk RFP ini
                    </Alert>
                  </>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Create PO Modal */}
      {showCreatePOModal && rfp && (
        <CreatePOModal
          open={showCreatePOModal}
          onClose={() => setShowCreatePOModal(false)}
          rfp={rfp}
          onSuccess={handlePOCreated}
        />
      )}
    </Box>
  );
};

export default RFPDetailPage;

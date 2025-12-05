import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  MenuItem,
  Button,
  Stack,
  Divider,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Grid,
  Card,
  CardContent,
  Autocomplete,
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { rfpApi } from '../../api/rfp';
import { RFP, RFPItem, CreatePOFromRFPRequest } from '../../types/rfp';
import { vendorsApi } from '../../api/vendors';
import { Vendor } from '../../types/vendor';
import { format } from 'date-fns';

const ConvertRFPPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [rfp, setRfp] = useState<RFP | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Vendors data
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loadingVendors, setLoadingVendors] = useState(true);

  // PO Form State
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [vendorId, setVendorId] = useState('');
  const [vendorName, setVendorName] = useState('');
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
  const [expectedDelivery, setExpectedDelivery] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('');
  const [notes, setNotes] = useState('');
  
  // Items with prices
  const [itemPrices, setItemPrices] = useState<Map<string, number>>(new Map());
  const [itemNotes, setItemNotes] = useState<Map<string, string>>(new Map());

  // Load vendors data
  useEffect(() => {
    const loadVendors = async () => {
      try {
        setLoadingVendors(true);
        const data = await vendorsApi.getAllVendors();
        setVendors(data);
      } catch (err) {
        console.error('Error loading vendors:', err);
        setError(err instanceof Error ? err.message : 'Gagal memuat data vendors');
      } finally {
        setLoadingVendors(false);
      }
    };

    loadVendors();
  }, []);

  // Load RFP data
  useEffect(() => {
    if (!id) {
      setError('ID RFP tidak ditemukan');
      setLoading(false);
      return;
    }

    const loadRFP = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await rfpApi.getRFPById(id);
        setRfp(data);
      } catch (err) {
        console.error('Error loading RFP:', err);
        setError(err instanceof Error ? err.message : 'Gagal memuat data RFP');
      } finally {
        setLoading(false);
      }
    };

    loadRFP();
  }, [id]);

  const handleItemPriceChange = (itemId: string, price: string) => {
    const priceValue = parseFloat(price) || 0;
    setItemPrices(new Map(itemPrices.set(itemId, priceValue)));
  };

  const handleItemNoteChange = (itemId: string, note: string) => {
    setItemNotes(new Map(itemNotes.set(itemId, note)));
  };

  const handleBack = () => {
    navigate(`/rfp/${id}`);
  };

  const calculateTotal = (): number => {
    if (!rfp?.items) return 0;
    let total = 0;
    rfp.items.forEach((item) => {
      const price = itemPrices.get(item.id) || 0;
      total += price * item.quantity;
    });
    return total;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!id || !rfp) {
      setError('Data RFP tidak valid');
      return;
    }

    // Validate vendor selection
    if (!selectedVendor) {
      setError('Harap pilih vendor terlebih dahulu');
      return;
    }

    // Validate all items have prices
    const missingPrices = rfp.items?.filter((item) => !itemPrices.has(item.id) || itemPrices.get(item.id) === 0);
    if (missingPrices && missingPrices.length > 0) {
      setError('Harap isi harga untuk semua item');
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      // Try different possible keys for userId
      let userId = localStorage.getItem('userId') || 
                   localStorage.getItem('user_id') || 
                   localStorage.getItem('id');
      
      // If not found, try to get from user object
      if (!userId) {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          try {
            const user = JSON.parse(userStr);
            userId = user.id || user.userId || user.user_id;
          } catch (e) {
            console.error('Error parsing user from localStorage:', e);
          }
        }
      }
      
      // Check authToken for user info
      if (!userId) {
        const token = localStorage.getItem('authToken') || localStorage.getItem('token');
        if (token) {
          try {
            // Try to decode JWT token (basic decode, not validated)
            const tokenParts = token.split('.');
            if (tokenParts.length === 3) {
              const payload = JSON.parse(atob(tokenParts[1]));
              userId = payload.userId || payload.id || payload.sub;
            }
          } catch (e) {
            console.error('Error decoding token:', e);
          }
        }
      }
      
      console.log('=== DEBUG INFO ===');
      console.log('User ID found:', userId);
      console.log('All localStorage keys:', Object.keys(localStorage));
      console.log('localStorage contents:', {
        userId: localStorage.getItem('userId'),
        user_id: localStorage.getItem('user_id'),
        id: localStorage.getItem('id'),
        user: localStorage.getItem('user'),
        authToken: localStorage.getItem('authToken') ? 'exists' : 'not found',
        token: localStorage.getItem('token') ? 'exists' : 'not found',
      });
      console.log('==================');
      
      if (!userId) {
        // Use temporary UUID for testing - REMOVE THIS IN PRODUCTION
        console.warn('⚠️ No userId found, using temporary UUID for testing');
        userId = '00000000-0000-0000-0000-000000000001';
      }
      
      const items = rfp.items?.map((item) => ({
        rfp_item_id: item.id,
        unit_price: itemPrices.get(item.id) || 0,
        notes: itemNotes.get(item.id) || null,
      })) || [];

      const payload: CreatePOFromRFPRequest = {
        vendor_id: vendorId && vendorId.trim() !== '' ? vendorId : null,
        vendor_name: vendorName,
        order_date: orderDate,
        expected_delivery: expectedDelivery && expectedDelivery.trim() !== '' ? expectedDelivery : null,
        payment_terms: paymentTerms && paymentTerms.trim() !== '' ? paymentTerms : null,
        notes: notes && notes.trim() !== '' ? notes : null,
        created_by: userId,
        items,
      };

      console.log('Creating PO with payload:', JSON.stringify(payload, null, 2));
      console.log('User ID:', userId);
      console.log('Vendor ID:', vendorId);
      await rfpApi.createPOFromRFP(id, payload);

      setSuccess('PO berhasil dibuat! Mengarahkan ke daftar Purchase Orders...');
      setTimeout(() => navigate('/purchases'), 1500);
    } catch (err: any) {
      console.error('Error creating PO from RFP:', err);
      console.error('Error response:', err?.response?.data);
      const errorMessage = err?.response?.data?.error || err?.response?.data?.message || err.message || 'Gagal membuat PO';
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error && !rfp) {
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="outlined" onClick={handleBack}>
          Kembali
        </Button>
      </Box>
    );
  }

  if (!rfp) {
    return (
      <Box>
        <Alert severity="warning">Data RFP tidak ditemukan</Alert>
        <Button variant="outlined" onClick={handleBack} sx={{ mt: 2 }}>
          Kembali
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Konversi RFP ke Purchase Order
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mb: 3 }}>
        Buat Purchase Order (PO) dari Request for Purchase (RFP)
      </Typography>

      {/* RFP Info Summary */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Informasi RFP
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="text.secondary">
                Nomor RFP
              </Typography>
              <Typography variant="body1" fontWeight="bold">
                {rfp.rfp_number}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="text.secondary">
                Nama Proyek
              </Typography>
              <Typography variant="body1" fontWeight="bold">
                {rfp.project_name}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="text.secondary">
                Pemohon
              </Typography>
              <Typography variant="body1">{rfp.requester_name}</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="text.secondary">
                Tanggal Dibuat
              </Typography>
              <Typography variant="body1">
                {format(new Date(rfp.created_at), 'dd MMM yyyy')}
              </Typography>
            </Grid>
            {rfp.notes && (
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">
                  Catatan RFP
                </Typography>
                <Typography variant="body1">{rfp.notes}</Typography>
              </Grid>
            )}
          </Grid>
        </CardContent>
      </Card>

      {/* PO Form */}
      <Paper sx={{ p: 3 }}>
        <form onSubmit={handleSubmit}>
          <Stack spacing={3}>
            <Typography variant="h6">Data Purchase Order</Typography>

            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Autocomplete
                  fullWidth
                  options={vendors}
                  getOptionLabel={(option) => option.vendor_name}
                  value={selectedVendor}
                  onChange={(event, newValue) => {
                    setSelectedVendor(newValue);
                    if (newValue) {
                      setVendorId(newValue.id);
                      setVendorName(newValue.vendor_name);
                    } else {
                      setVendorId('');
                      setVendorName('');
                    }
                  }}
                  loading={loadingVendors}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Pilih Vendor"
                      required
                      helperText="Pilih vendor yang akan menyuplai barang/jasa"
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {loadingVendors ? <CircularProgress color="inherit" size={20} /> : null}
                            {params.InputProps.endAdornment}
                          </>
                        ),
                      }}
                    />
                  )}
                  renderOption={(props, option) => {
                    const { key, ...otherProps } = props as any;
                    return (
                      <Box component="li" key={key} {...otherProps}>
                        <Box>
                          <Typography variant="body1">{option.vendor_name}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {option.classification} {option.is_preferred ? '⭐ Preferred' : ''}
                          </Typography>
                        </Box>
                      </Box>
                    );
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="date"
                  label="Tanggal Order"
                  value={orderDate}
                  onChange={(e) => setOrderDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="date"
                  label="Estimasi Pengiriman"
                  value={expectedDelivery}
                  onChange={(e) => setExpectedDelivery(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  helperText="Opsional"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Term Pembayaran"
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value)}
                  placeholder="Contoh: Net 30, Net 60, COD, dll"
                  helperText="Term pembayaran yang disepakati dengan vendor"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Catatan"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  multiline
                  rows={2}
                  helperText="Catatan tambahan untuk PO ini"
                />
              </Grid>
            </Grid>

            <Divider />

            <Typography variant="h6">Item yang Dipesan</Typography>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Nama Item</TableCell>
                    <TableCell>Tipe</TableCell>
                    <TableCell align="right">Qty</TableCell>
                    <TableCell>Satuan</TableCell>
                    <TableCell align="right">Harga Satuan *</TableCell>
                    <TableCell align="right">Total</TableCell>
                    <TableCell>Catatan</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rfp.items?.map((item: RFPItem) => {
                    const unitPrice = itemPrices.get(item.id) || 0;
                    const total = unitPrice * item.quantity;
                    return (
                      <TableRow key={item.id}>
                        <TableCell>{item.item_name}</TableCell>
                        <TableCell>
                          <Chip
                            label={item.item_type}
                            size="small"
                            color={item.item_type === 'MATERIAL' ? 'primary' : 'secondary'}
                          />
                        </TableCell>
                        <TableCell align="right">{item.quantity}</TableCell>
                        <TableCell>{item.unit}</TableCell>
                        <TableCell align="right">
                          <TextField
                            type="number"
                            size="small"
                            value={unitPrice || ''}
                            onChange={(e) => handleItemPriceChange(item.id, e.target.value)}
                            InputProps={{
                              startAdornment: 'Rp ',
                            }}
                            inputProps={{
                              min: 0,
                              step: 0.01,
                            }}
                            sx={{ width: 150 }}
                            required
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight="bold">
                            Rp {total.toLocaleString('id-ID')}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            placeholder="Catatan item..."
                            value={itemNotes.get(item.id) || ''}
                            onChange={(e) => handleItemNoteChange(item.id, e.target.value)}
                            sx={{ minWidth: 150 }}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  <TableRow>
                    <TableCell colSpan={5} align="right">
                      <Typography variant="h6">Total</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="h6" color="primary">
                        Rp {calculateTotal().toLocaleString('id-ID')}
                      </Typography>
                    </TableCell>
                    <TableCell />
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>

            <Divider />

            {error && <Alert severity="error">{error}</Alert>}
            {success && <Alert severity="success">{success}</Alert>}

            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button variant="outlined" onClick={handleBack} disabled={submitting}>
                Batal
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={submitting || !rfp.items || rfp.items.length === 0}
                startIcon={submitting ? <CircularProgress size={20} /> : null}
              >
                {submitting ? 'Membuat PO...' : 'Buat Purchase Order'}
              </Button>
            </Stack>
          </Stack>
        </form>
      </Paper>
    </Box>
  );
};

export default ConvertRFPPage;

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Typography,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  Box,
  Divider,
  CircularProgress,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { RFP, RFPItem } from '../../types/rfp';
import { rfpApi } from '../../api/rfp';
import { vendorsApi } from '../../api/vendors';
import { Vendor } from '../../types/vendor';

interface CreatePOModalProps {
  open: boolean;
  onClose: () => void;
  rfp: RFP;
  onSuccess: () => void;
}

interface POItemState {
  rfpItemId: string;
  itemName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  notes: string;
  selected: boolean;
}

const CreatePOModal: React.FC<CreatePOModalProps> = ({
  open,
  onClose,
  rfp,
  onSuccess,
}) => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [poItems, setPOItems] = useState<POItemState[]>([]);
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState<Date | null>(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingVendors, setLoadingVendors] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (open) {
      loadVendors();
      initializePOItems();
    }
  }, [open, rfp]);

  const loadVendors = async () => {
    try {
      setLoadingVendors(true);
      const data = await vendorsApi.getAllVendors();
      setVendors(data || []);
    } catch (err) {
      console.error('Error loading vendors:', err);
      setError('Gagal memuat daftar vendor');
    } finally {
      setLoadingVendors(false);
    }
  };

  const initializePOItems = () => {
    const items: POItemState[] =
      rfp.items?.map((item: RFPItem) => ({
        rfpItemId: item.id,
        itemName: item.item_name,
        quantity: item.quantity,
        unit: item.unit,
        unitPrice: 0,
        notes: item.notes || '',
        selected: true,
      })) || [];
    setPOItems(items);
  };

  const handleItemToggle = (index: number) => {
    const updatedItems = [...poItems];
    updatedItems[index].selected = !updatedItems[index].selected;
    setPOItems(updatedItems);
  };

  const handleQuantityChange = (index: number, value: number) => {
    const updatedItems = [...poItems];
    updatedItems[index].quantity = value;
    setPOItems(updatedItems);
  };

  const handleUnitPriceChange = (index: number, value: number) => {
    const updatedItems = [...poItems];
    updatedItems[index].unitPrice = value;
    setPOItems(updatedItems);
  };

  const handleNotesChange = (index: number, value: string) => {
    const updatedItems = [...poItems];
    updatedItems[index].notes = value;
    setPOItems(updatedItems);
  };

  const calculateTotal = () => {
    return poItems
      .filter((item) => item.selected)
      .reduce((total, item) => total + item.quantity * item.unitPrice, 0);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const handleSubmit = async () => {
    setError(null);

    // Validation
    if (!selectedVendor) {
      setError('Pilih vendor terlebih dahulu');
      return;
    }

    const selectedItems = poItems.filter((item) => item.selected);
    if (selectedItems.length === 0) {
      setError('Pilih minimal satu item untuk PO');
      return;
    }

    // Validate unit prices
    const hasInvalidPrice = selectedItems.some((item) => item.unitPrice <= 0);
    if (hasInvalidPrice) {
      setError('Harga satuan harus lebih dari 0');
      return;
    }

    try {
      setLoading(true);
      
      const currentUserId = localStorage.getItem('userId') || 'admin';
      
      const payload = {
        vendor_id: selectedVendor.id || undefined,
        vendor_name: selectedVendor.vendor_name,
        order_date: new Date().toISOString(),
        expected_delivery: expectedDeliveryDate?.toISOString() || undefined,
        notes: notes || undefined,
        created_by: currentUserId,
        items: selectedItems.map((item) => ({
          rfp_item_id: item.rfpItemId,
          unit_price: item.unitPrice,
          notes: item.notes || undefined,
        })),
      };

      await rfpApi.createPOFromRFP(rfp.id, payload);
      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        handleClose();
      }, 1500);
    } catch (err: any) {
      setError(
        err.response?.data?.message || 'Gagal membuat Purchase Order'
      );
      console.error('Error creating PO:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setSelectedVendor(null);
      setExpectedDeliveryDate(null);
      setNotes('');
      setError(null);
      setSuccess(false);
      onClose();
    }
  };

  const selectedItemsCount = poItems.filter((item) => item.selected).length;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Typography variant="h6">Buat Purchase Order</Typography>
        <Typography variant="body2" color="text.secondary">
          RFP: {rfp.rfp_number} - {rfp.project_name}
        </Typography>
      </DialogTitle>
      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Purchase Order berhasil dibuat!
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Vendor Selection */}
          <Grid item xs={12}>
            <TextField
              select
              fullWidth
              required
              label="Pilih Vendor"
              value={selectedVendor?.id || ''}
              onChange={(e) => {
                const vendor = vendors.find(v => v.id === e.target.value);
                setSelectedVendor(vendor || null);
              }}
              disabled={loadingVendors || loading}
            >
              {loadingVendors ? (
                <MenuItem disabled>
                  <CircularProgress size={20} sx={{ mr: 1 }} />
                  Memuat vendor...
                </MenuItem>
              ) : vendors.length === 0 ? (
                <MenuItem disabled>Tidak ada vendor aktif</MenuItem>
              ) : (
                vendors.map((vendor) => (
                  <MenuItem key={vendor.id} value={vendor.id}>
                    {vendor.vendor_name} {vendor.email && `- ${vendor.email}`}
                  </MenuItem>
                ))
              )}
            </TextField>
          </Grid>

          {/* Expected Delivery Date */}
          <Grid item xs={12} md={6}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Tanggal Pengiriman yang Diharapkan"
                value={expectedDeliveryDate}
                onChange={(newValue) => setExpectedDeliveryDate(newValue)}
                disabled={loading}
                slotProps={{
                  textField: {
                    fullWidth: true,
                  },
                }}
              />
            </LocalizationProvider>
          </Grid>

          {/* Notes */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Catatan PO"
              multiline
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={loading}
              placeholder="Tambahkan catatan untuk Purchase Order..."
            />
          </Grid>

          {/* Items Selection */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom>
              Pilih Item untuk PO ({selectedItemsCount} dari {poItems.length} item)
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedItemsCount === poItems.length}
                        indeterminate={
                          selectedItemsCount > 0 && selectedItemsCount < poItems.length
                        }
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setPOItems(
                            poItems.map((item) => ({ ...item, selected: checked }))
                          );
                        }}
                        disabled={loading}
                      />
                    </TableCell>
                    <TableCell>
                      <strong>Nama Item</strong>
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
                    <TableCell>
                      <strong>Catatan</strong>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {poItems.map((item, index) => (
                    <TableRow key={item.rfpItemId}>
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={item.selected}
                          onChange={() => handleItemToggle(index)}
                          disabled={loading}
                        />
                      </TableCell>
                      <TableCell>{item.itemName}</TableCell>
                      <TableCell align="right">
                        <TextField
                          type="number"
                          value={item.quantity}
                          onChange={(e) =>
                            handleQuantityChange(index, Number(e.target.value))
                          }
                          size="small"
                          sx={{ width: 80 }}
                          disabled={!item.selected || loading}
                          inputProps={{ min: 1 }}
                        />
                      </TableCell>
                      <TableCell>{item.unit}</TableCell>
                      <TableCell align="right">
                        <TextField
                          type="number"
                          value={item.unitPrice}
                          onChange={(e) =>
                            handleUnitPriceChange(index, Number(e.target.value))
                          }
                          size="small"
                          sx={{ width: 120 }}
                          disabled={!item.selected || loading}
                          inputProps={{ min: 0, step: 1000 }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        {formatCurrency(item.quantity * item.unitPrice)}
                      </TableCell>
                      <TableCell>
                        <TextField
                          value={item.notes}
                          onChange={(e) => handleNotesChange(index, e.target.value)}
                          size="small"
                          sx={{ width: 150 }}
                          disabled={!item.selected || loading}
                          placeholder="Catatan..."
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>

          {/* Total */}
          <Grid item xs={12}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'center',
                bgcolor: 'primary.50',
                p: 2,
                borderRadius: 1,
              }}
            >
              <Typography variant="h6" sx={{ mr: 2 }}>
                Total PO:
              </Typography>
              <Typography variant="h5" color="primary">
                {formatCurrency(calculateTotal())}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Batal
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || selectedItemsCount === 0 || !selectedVendor}
        >
          {loading ? <CircularProgress size={24} /> : 'Buat Purchase Order'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreatePOModal;

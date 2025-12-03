import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  MenuItem,
  CircularProgress,
  useTheme,
  useMediaQuery,
  Snackbar,
} from '@mui/material';
import { useCreateMaterial, useCreateVendor } from '../api/hooks/useMaterialHooks';

interface NewMaterialModalProps {
  open: boolean;
  onClose: () => void;
  initialName?: string;
  onCreated?: (material: any) => void;
}

const currencyOptions = ['IDR', 'USD', 'EUR'];

const NewMaterialModal: React.FC<NewMaterialModalProps> = ({ open, onClose, initialName = '', onCreated }) => {
  const [itemName, setItemName] = useState(initialName);
  const [pn, setPn] = useState('');
  const [category, setCategory] = useState('');
  const [unit, setUnit] = useState('');
  const [vendor, setVendor] = useState('');
  const [price, setPrice] = useState<number | ''>('');
  const [currency, setCurrency] = useState('IDR');
  const [exchangeRate, setExchangeRate] = useState<number | ''>('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [snack, setSnack] = useState<{ open: boolean; message: string }>({ open: false, message: '' });

  const { create, loading } = useCreateMaterial();
  const { create: createVendor } = useCreateVendor();

  useEffect(() => {
    setItemName(initialName || '');
  }, [initialName]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!pn || pn.trim() === '') e.pn = 'P/N wajib diisi';
    if (!category) e.category = 'Kategori wajib diisi';
    if (!unit) e.unit = 'Unit wajib diisi';
    if (!vendor) e.vendor = 'Vendor wajib diisi';
    if (price === '' || Number(price) <= 0) e.price = 'Harga beli wajib diisi';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    try {
      const payload: any = {
        itemName,
        pn,
        category,
        unit,
        initialPrice: {
          vendorName: vendor,
          price: Number(price),
          currency,
          exchangeRate: currency === 'IDR' ? undefined : Number(exchangeRate) || undefined,
        },
      };
      const created = await create(payload);
      setSnack({ open: true, message: 'Material berhasil dibuat' });
      onCreated?.(created);
    } catch (err: any) {
      if (err.response?.status === 409) {
        setSnack({ open: true, message: 'Material dengan P/N ini sudah terdaftar' });
      } else {
        setSnack({ open: true, message: err.response?.data?.message || 'Gagal membuat material' });
      }
    }
  };

  const handleAddVendor = async () => {
    if (!vendor || vendor.trim() === '') return;
    try {
      const v = await createVendor({ vendor_name: vendor, classification: 'Local' as any });
      setSnack({ open: true, message: 'Vendor berhasil dibuat' });
      setVendor(v.vendor_name || v.name || vendor);
    } catch (err: any) {
      setSnack({ open: true, message: err.response?.data?.message || 'Gagal membuat vendor' });
    }
  };

  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <>
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="md" fullScreen={fullScreen}>
        <DialogTitle>Tambah Item Material Baru</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField label="Nama Item" value={itemName} fullWidth disabled />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField label="P/N" value={pn} onChange={(e) => setPn(e.target.value)} fullWidth error={!!errors.pn} helperText={errors.pn} />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField label="Kategori" value={category} onChange={(e) => setCategory(e.target.value)} fullWidth select error={!!errors.category} helperText={errors.category}>
                <MenuItem value="Electrical">Electrical</MenuItem>
                <MenuItem value="Mechanical">Mechanical</MenuItem>
                <MenuItem value="Civil">Civil</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField label="Unit" value={unit} onChange={(e) => setUnit(e.target.value)} fullWidth error={!!errors.unit} helperText={errors.unit} />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField label="Vendor" value={vendor} onChange={(e) => setVendor(e.target.value)} fullWidth error={!!errors.vendor} helperText={errors.vendor} />
              <Button size="small" onClick={handleAddVendor} sx={{ mt: 1 }}>+ Tambah Vendor Baru</Button>
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField label="Harga Beli" value={price} onChange={(e) => setPrice(Number(e.target.value) || '')} fullWidth error={!!errors.price} helperText={errors.price} />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField label="Mata Uang" select value={currency} onChange={(e) => setCurrency(e.target.value)} fullWidth>
                {currencyOptions.map((c) => (<MenuItem key={c} value={c}>{c}</MenuItem>))}
              </TextField>
            </Grid>
            {currency !== 'IDR' && (
              <Grid item xs={12} md={4}>
                <TextField label="Kurs" value={exchangeRate} onChange={(e) => setExchangeRate(Number(e.target.value) || '')} fullWidth />
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Batal</Button>
          <Button variant="contained" onClick={handleSave} disabled={loading} startIcon={loading ? <CircularProgress size={18} /> : null}>
            Simpan & Gunakan
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snack.open} autoHideDuration={4000} onClose={() => setSnack({ open: false, message: '' })} message={snack.message} />
    </>
  );
};

export default NewMaterialModal;


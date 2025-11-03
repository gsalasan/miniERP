import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  Alert,
  Breadcrumbs,
  Link,
  TextField,
  MenuItem,
  Snackbar,
  Stack,
  Divider,
  InputAdornment,
  Dialog,
} from '@mui/material';
import { ArrowBack as ArrowBackIcon, Save as SaveIcon, Add as AddIcon } from "@mui/icons-material";
import { useNavigate, useLocation } from "react-router-dom";
import { vendorPricelistApi } from "../../api/vendorPricelist";
import { vendorsApi } from "../../api/vendors";
import { Vendor } from "../../types/vendor";
import { materialsApi } from '../../api/materials';
import type { Material } from '../../types/material';
// Removed unused imports
// ...existing code...
const NewVendorPricePage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [openAddVendor, setOpenAddVendor] = useState(false);
  const [openAddMaterial, setOpenAddMaterial] = useState(false);

  const [form, setForm] = useState({ vendor_id: '', material_id: '', price: '', currency: 'IDR' });

  useEffect(() => {
    (async () => {
      try {
        const v = await vendorsApi.getAllVendors();
        setVendors(v);
        const m = await materialsApi.getAll();
        setMaterials(m);
        // Prefill from query params (vendor_id, material_id)
        const params = new URLSearchParams(location.search);
        const vendorId = params.get('vendor_id');
        const materialId = params.get('material_id');
        setForm(prev => ({
          ...prev,
          vendor_id: vendorId || prev.vendor_id,
          material_id: materialId || prev.material_id,
        }));
      } catch {
        // ignore
      }
    })();
  }, [location.search]);

  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);
      if (!form.material_id.trim() || !form.vendor_id.trim() || !form.price) {
        setError('vendor_id, material_id, and price are required');
        return;
      }

      await vendorPricelistApi.create({
        vendor_id: form.vendor_id.trim(),
        material_id: form.material_id.trim(),
        price: Number(form.price),
        currency: form.currency,
      });
      setSuccess(true);
      setTimeout(() => navigate('/vendors?tab=1'), 900);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal membuat');
    } finally { setLoading(false); }
  };

  return (
  <Box sx={{ maxWidth: 1200, mx: 'auto', p: { xs: 1, md: 3 } }}>
      <Breadcrumbs sx={{ mb: 3 }}>
        <Link component="button" variant="body1" onClick={() => navigate('/vendors?tab=1')} sx={{ textDecoration: 'none' }}>Vendor Pricelist</Link>
        <Typography color="text.primary">Tambah Harga Vendor</Typography>
      </Breadcrumbs>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button onClick={() => navigate(-1)} startIcon={<ArrowBackIcon />} variant="outlined" size="medium">Kembali</Button>
          <Typography variant="h5" fontWeight={700} sx={{ letterSpacing: 1 }}>Tambah Harga Vendor</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button onClick={() => navigate(-1)} variant="outlined" color="secondary" sx={{ fontWeight: 600, px: 3 }} disabled={loading}>Batal</Button>
          <Button onClick={handleSave} variant="contained" startIcon={<SaveIcon />} sx={{ fontWeight: 700, px: 4, boxShadow: '0 2px 8px rgba(25,118,210,0.10)' }} disabled={loading}>{loading ? 'Menyimpan...' : 'Simpan'}</Button>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Snackbar open={success} autoHideDuration={2200} onClose={() => {}} message="Harga berhasil dibuat" />

      <Paper elevation={4} sx={{ p: { xs: 2, md: 4 }, borderRadius: 3, background: 'linear-gradient(145deg,#ffffff 0%, #f9fcf9 100%)', maxWidth: 900, mx: 'auto' }}>
        <Box sx={{ display: { xs: 'block', md: 'flex' }, gap: 4 }}>
          <Box sx={{ flex: 1 }}>
            <Stack spacing={3}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField select label="Material" value={form.material_id} onChange={(e) => setForm({ ...form, material_id: e.target.value })} fullWidth size="medium" sx={{ background: '#f8fafc', borderRadius: 2 }}>
                  <MenuItem value="">-- Pilih material --</MenuItem>
                  {materials.map((m) => (<MenuItem key={m.id} value={m.id}>{m.item_name}</MenuItem>))}
                </TextField>
                <Button variant="outlined" startIcon={<AddIcon />} onClick={() => setOpenAddMaterial(true)} sx={{ minWidth: 44, px: 1 }}>Tambah Material</Button>
              </Box>
              {/* Dialog Tambah Material */}
              <Dialog open={openAddMaterial} onClose={() => setOpenAddMaterial(false)} maxWidth="sm" fullWidth>
                <Box sx={{ p: 3 }}>
                  <Typography variant="h6" mb={2}>Tambah Material</Typography>
                  <Typography variant="body2" color="text.secondary">Silakan tambah material dari halaman utama engineering.</Typography>
                  <Button variant="contained" sx={{ mt: 2 }} onClick={() => { setOpenAddMaterial(false); window.open('/engineering/materials/new', '_blank'); }}>Ke Halaman Tambah Material</Button>
                </Box>
              </Dialog>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField select label="Vendor" value={form.vendor_id} onChange={(e) => setForm({ ...form, vendor_id: e.target.value })} fullWidth size="medium" sx={{ background: '#f8fafc', borderRadius: 2 }}>
                  <MenuItem value="">-- Pilih vendor --</MenuItem>
                  {vendors.map((v) => (<MenuItem key={v.id} value={v.id}>{v.vendor_name}</MenuItem>))}
                </TextField>
                <Button variant="outlined" startIcon={<AddIcon />} onClick={() => setOpenAddVendor(true)} sx={{ minWidth: 44, px: 1 }}>Tambah Vendor</Button>
              </Box>
      {/* Dialog Tambah Vendor */}
      <Dialog open={openAddVendor} onClose={() => setOpenAddVendor(false)} maxWidth="sm" fullWidth>
        <Box sx={{ p: 3 }}>
          <Typography variant="h6" mb={2}>Tambah Vendor</Typography>
          <Typography variant="body2" color="text.secondary">Silakan tambah vendor dari halaman utama vendor.</Typography>
          <Button variant="contained" sx={{ mt: 2 }} onClick={() => { setOpenAddVendor(false); navigate('/vendors/new'); }}>Ke Halaman Tambah Vendor</Button>
        </Box>
      </Dialog>
      {/* Dialog Tambah Material removed as per new requirements */}
              <TextField
                label="Price"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                fullWidth
                size="medium"
                InputProps={{ startAdornment: <InputAdornment position="start">{form.currency}</InputAdornment> }}
                placeholder="0.00"
                sx={{ background: '#f8fafc', borderRadius: 2 }}
              />
              <TextField label="Currency" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} fullWidth size="medium" sx={{ background: '#f8fafc', borderRadius: 2 }} />
            </Stack>
          </Box>

          <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', md: 'block' }, mx: 2 }} />

          <Box sx={{ width: { xs: '100%', md: 340 }, bgcolor: '#fff', borderRadius: 2, p: 3, boxShadow: '0 6px 18px rgba(2,6,23,0.06)', minHeight: 220 }}>
            <Typography variant="subtitle2" sx={{ color: 'primary.main', mb: 1, fontWeight: 700, letterSpacing: 1 }}>Preview Harga</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>Material</Typography>
            <Typography variant="body1">{(materials.find(m => m.id === form.material_id)?.item_name) || <span style={{ color: '#bdbdbd' }}>—</span>}</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>Vendor</Typography>
            <Typography variant="body1">{(vendors.find(v => v.id === form.vendor_id)?.vendor_name) || <span style={{ color: '#bdbdbd' }}>—</span>}</Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
              <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>Price</Typography>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>{form.price ? `${form.currency} ${Number(form.price).toLocaleString()}` : <span style={{ color: '#bdbdbd' }}>-</span>}</Typography>
            </Box>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default NewVendorPricePage;

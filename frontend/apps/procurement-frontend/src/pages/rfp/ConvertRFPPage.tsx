
import React, { useState } from 'react';
import {
  Box, Typography, Paper, TextField, MenuItem, Button, Stack, Divider, Alert
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { rfpApi } from '../../api/rfp';

const orderTypes = [
  { value: 'PO', label: 'Purchase Order (PO)' },
  { value: 'WO', label: 'Work Order (WO)' },
];

const vendors = [
  { value: 'vendor-1', label: 'Vendor 1' },
  { value: 'vendor-2', label: 'Vendor 2' },
];

const ConvertRFPPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    rfp_number: '',
    project_name: '',
    requester_name: '',
    order_type: '',
    vendor: '',
    notes: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      // Build payload expected by backend (minimal for now)
      const payload = {
        vendor_id: form.vendor || null,
        vendor_name: form.vendor || '',
        order_date: new Date().toISOString().split('T')[0],
        expected_delivery: null,
        total_amount: 0,
        status: 'DRAFT',
        notes: form.notes,
        created_by: null,
        items: [],
      };

      if (id) {
        await rfpApi.createPOFromRFP(id, payload as any);
      } else {
        // If no rfp id, fallback to create PO via generic PO endpoint
        await rfpApi.createPOFromRFP('', payload as any);
      }

      setSuccess('PO berhasil dibuat. Mengarahkan ke daftar Purchases...');
      setTimeout(() => navigate('/purchases'), 900);
    } catch (err: any) {
      console.error('Error creating PO from RFP:', err);
      setError(err?.response?.data?.message || err.message || 'Gagal membuat PO');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Konversi RFP ke PO/WO
      </Typography>
      <Paper sx={{ p: 3, maxWidth: 600 }}>
        <form onSubmit={handleSubmit}>
          <Stack spacing={2}>
            <TextField
              label="Nomor RFP"
              name="rfp_number"
              value={form.rfp_number}
              onChange={handleChange}
              required
            />
            <TextField
              label="Nama Proyek"
              name="project_name"
              value={form.project_name}
              onChange={handleChange}
              required
            />
            <TextField
              label="Pemohon"
              name="requester_name"
              value={form.requester_name}
              onChange={handleChange}
              required
            />
            <TextField
              select
              label="Jenis Order"
              name="order_type"
              value={form.order_type}
              onChange={handleChange}
              required
            >
              {orderTypes.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Vendor"
              name="vendor"
              value={form.vendor}
              onChange={handleChange}
              required
            >
              {vendors.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Catatan Tambahan"
              name="notes"
              value={form.notes}
              onChange={handleChange}
              multiline
              minRows={2}
            />
            <Divider />
            {error && <Alert severity="error">{error}</Alert>}
            {success && <Alert severity="success">{success}</Alert>}
            <Stack direction="row" spacing={2}>
              <Button type="submit" variant="contained" disabled={loading}>
                Simpan
              </Button>
              <Button variant="outlined" onClick={() => navigate(-1)}>
                Batal
              </Button>
            </Stack>
          </Stack>
        </form>
      </Paper>
    </Box>
  );
};

export default ConvertRFPPage;

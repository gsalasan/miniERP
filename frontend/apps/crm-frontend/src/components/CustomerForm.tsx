import React, { useState, useEffect } from 'react';
import {
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Box,
  Paper,
  Button,
  IconButton,
  FormControlLabel,
  Switch,
  Alert,
  Tooltip,
  Chip,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, Info as InfoIcon } from '@mui/icons-material';
import { CreateCustomerData, CustomerStatus, UpdateCustomerData } from '../types/customer';

interface CustomerFormProps {
  data: CreateCustomerData | UpdateCustomerData;
  onChange: (data: CreateCustomerData | UpdateCustomerData) => void;
  loading?: boolean;
  mode?: 'create' | 'edit';
}

const CustomerForm: React.FC<CustomerFormProps> = ({
  data,
  onChange,
  loading = false,
  mode = 'create',
}) => {
  const [isPKP, setIsPKP] = useState(false);

  // Dynamic sales user options fetched from HR service
  const [salesOptions, setSalesOptions] = useState<
    { value: string; label: string; email?: string }[]
  >([{ value: '', label: 'Tidak ada sales yang ditugaskan' }]);
  const [salesLoading, setSalesLoading] = useState(false);
  const [salesError, setSalesError] = useState<string | null>(null);

  useEffect(() => {
    const loadSales = async () => {
      try {
        setSalesLoading(true);
        setSalesError(null);
        const list = await (await import('../api/users')).usersApi.getSalesUsers();
        const dynamic = list.map((u) => ({
          value: u.id,
          label: u.name,
          email: u.email,
        }));
        setSalesOptions([{ value: '', label: 'Tidak ada sales yang ditugaskan' }, ...dynamic]);
      } catch {
        setSalesError('Gagal memuat daftar sales');
        // keep only fallback option
        setSalesOptions([{ value: '', label: 'Tidak ada sales yang ditugaskan' }]);
      } finally {
        setSalesLoading(false);
      }
    };
    loadSales();
  }, []);

  // Determine if tax fields should be shown/required
  const isActiveStatus = data.status === 'ACTIVE';
  const shouldShowTaxFields =
    isActiveStatus ||
    (data.no_npwp !== undefined && data.no_npwp !== null) ||
    (data.sppkp !== undefined && data.sppkp !== null);

  const handleInputChange =
    (field: keyof (CreateCustomerData | UpdateCustomerData)) =>
    (
      event:
        | React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
        | { target: { value: unknown } },
    ) => {
      const value = event.target.value;
      // Handle status change
      if (field === 'status') {
        const newData = { ...data, [field]: value as CustomerStatus };
        // Clear tax fields if changing to PROSPECT
        if (value === 'PROSPECT') {
          newData.no_npwp = '';
          newData.sppkp = '';
        }
        onChange(newData);
        return;
      }
      // Handle numeric fields
      if (field === 'top_days' || field === 'credit_limit') {
        const numericValue = value === '' ? 0 : Number(value);
        onChange({ ...data, [field]: numericValue });
      } else {
        onChange({ ...data, [field]: value });
      }
    };

  const handlePKPChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const checked = event.target.checked;
    setIsPKP(checked);
    // If not PKP, clear SPPKP
    if (!checked) {
      onChange({ ...data, sppkp: '' });
    }
  };

  const handleAddContact = () => {
    const currentContacts = data.contacts || [];
    const newContact = {
      name: '',
      position: '',
      email: '',
      phone: '',
    };
    onChange({ ...data, contacts: [...currentContacts, newContact] });
  };

  // Rekening (bank account) handlers
  const handleAddRekening = () => {
    const currentReks = (data as any).rekenings || [];
    const newRek = {
      bank_name: '',
      account_number: '',
      account_holder: '',
    };
    onChange({ ...data, rekenings: [...currentReks, newRek] });
  };

  const handleRemoveRekening = (index: number) => {
    const current = (data as any).rekenings || [];
    const updated = current.filter((_: any, i: number) => i !== index);
    onChange({ ...data, rekenings: updated });
  };

  const handleRekeningChange = (index: number, field: string, value: string) => {
    const current = (data as any).rekenings || [];
    const updated = current.map((r: any, i: number) =>
      i === index ? { ...r, [field]: value } : r,
    );
    onChange({ ...data, rekenings: updated });
  };

  const handleRemoveContact = (index: number) => {
    const currentContacts = data.contacts || [];
    const updatedContacts = currentContacts.filter((_, i) => i !== index);
    onChange({ ...data, contacts: updatedContacts });
  };

  const handleContactChange = (index: number, field: string, value: string) => {
    const currentContacts = data.contacts || [];
    const updatedContacts = currentContacts.map((contact, i) =>
      i === index ? { ...contact, [field]: value } : contact,
    );
    onChange({ ...data, contacts: updatedContacts });
  };

  return (
    <Grid container spacing={3}>
      {/* Basic Information */}
      <Grid item xs={12}>
        <Typography variant='h6' fontWeight={600} gutterBottom>
          Informasi Dasar
        </Typography>
      </Grid>

      {/* Status Information - Moved to top */}
      <Grid item xs={12}>
        {data.status === 'PROSPECT' && (
          <Alert severity='info' sx={{ mb: 2 }}>
            <Typography variant='body2'>
              <strong>Status Prospect:</strong> Fokus pada data dasar pelanggan. Data pajak bersifat
              opsional dan dapat diisi nanti saat pelanggan mulai bertransaksi.
            </Typography>
          </Alert>
        )}
        {data.status === 'ACTIVE' && (
          <Alert severity='warning' sx={{ mb: 2 }}>
            <Typography variant='body2'>
              <strong>Status Active:</strong> Pelanggan sudah bertransaksi. Data pajak wajib
              dilengkapi untuk pembuatan faktur resmi.
            </Typography>
          </Alert>
        )}
      </Grid>

      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label='Nama Customer'
          value={data.customer_name || ''}
          onChange={handleInputChange('customer_name')}
          required={mode === 'create'}
          disabled={loading}
          variant='outlined'
        />
      </Grid>

      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label='Channel'
          value={data.channel || ''}
          onChange={handleInputChange('channel')}
          required={mode === 'create'}
          disabled={loading}
          variant='outlined'
        />
      </Grid>

      <Grid item xs={12} sm={4}>
        <TextField
          fullWidth
          label='Kota'
          value={data.city || ''}
          onChange={handleInputChange('city')}
          required={mode === 'create'}
          disabled={loading}
          variant='outlined'
        />
      </Grid>
      <Grid item xs={12} sm={4}>
        <TextField
          fullWidth
          label='District'
          value={data.district || ''}
          onChange={handleInputChange('district')}
          disabled={loading}
          variant='outlined'
        />
      </Grid>
      <Grid item xs={12} sm={4}>
        <TextField
          fullWidth
          label='Alamat'
          value={data.alamat || ''}
          onChange={handleInputChange('alamat')}
          disabled={loading}
          variant='outlined'
        />
      </Grid>

      <Grid item xs={12} sm={6}>
        <FormControl fullWidth disabled={loading}>
          <InputLabel>Status</InputLabel>
          <Select
            value={data.status || 'PROSPECT'}
            label='Status'
            onChange={handleInputChange('status')}
          >
            <MenuItem value='PROSPECT'>Prospect</MenuItem>
            <MenuItem value='ACTIVE'>Active</MenuItem>
            <MenuItem value='INACTIVE'>Inactive</MenuItem>
          </Select>
        </FormControl>
      </Grid>

      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label='TOP (Hari)'
          type='text'
          value={data.top_days === 0 ? '' : data.top_days}
          onChange={(e) => {
            // Hanya ambil angka, hapus leading zero, dan pastikan manual
            const val = e.target.value.replace(/[^0-9]/g, '');
            onChange({ ...data, top_days: val === '' ? 0 : Number(val) });
          }}
          disabled={loading}
          variant='outlined'
          inputProps={{ inputMode: 'numeric', pattern: '[0-9]*', min: 0 }}
        />
      </Grid>

      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label='Credit Limit'
          type='number'
          value={data.credit_limit || 0}
          onChange={handleInputChange('credit_limit')}
          disabled={loading}
          variant='outlined'
          inputProps={{ min: 0 }}
        />
      </Grid>

      <Grid item xs={12}>
        <FormControl fullWidth disabled={loading || salesLoading}>
          <InputLabel>Sales yang Ditugaskan</InputLabel>
          <Select
            value={data.assigned_sales_id || ''}
            label='Sales yang Ditugaskan'
            onChange={handleInputChange('assigned_sales_id')}
            displayEmpty
            renderValue={(val) => {
              if (!val) return 'Tidak ada sales yang ditugaskan';
              const found = salesOptions.find((o) => o.value === val);
              return found?.label || val;
            }}
          >
            {salesOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
                {option.email && option.value && (
                  <Typography variant='caption' sx={{ ml: 1, opacity: 0.7 }}>
                    {option.email}
                  </Typography>
                )}
              </MenuItem>
            ))}
          </Select>
          {salesLoading && (
            <Typography variant='caption' sx={{ mt: 0.5 }} color='text.secondary'>
              Memuat daftar sales...
            </Typography>
          )}
          {salesError && (
            <Typography variant='caption' sx={{ mt: 0.5 }} color='error'>
              {salesError}
            </Typography>
          )}
        </FormControl>
      </Grid>

      {/* Tax Information Section - Only show when needed */}
      {shouldShowTaxFields && (
        <>
          <Grid item xs={12}>
            <Typography variant='h6' fontWeight={600} sx={{ mt: 2, mb: 1 }}>
              Informasi Pajak
              {isActiveStatus && (
                <Chip label='Wajib diisi' color='warning' size='small' sx={{ ml: 1 }} />
              )}
            </Typography>
            {isActiveStatus && (
              <Box sx={{ mb: 2 }}>
                <FormControlLabel
                  control={<Switch checked={isPKP} onChange={handlePKPChange} disabled={loading} />}
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant='body2'>
                        Pelanggan adalah Pengusaha Kena Pajak (PKP)
                      </Typography>
                      <Tooltip title='PKP wajib mengisi NPWP dan SPPKP. Non-PKP hanya perlu NPWP jika ada.'>
                        <InfoIcon fontSize='small' color='action' />
                      </Tooltip>
                    </Box>
                  }
                />
              </Box>
            )}
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label='No. NPWP'
              value={data.no_npwp || ''}
              onChange={handleInputChange('no_npwp')}
              disabled={loading}
              variant='outlined'
              required={isActiveStatus && isPKP}
              helperText={
                isActiveStatus
                  ? isPKP
                    ? 'Wajib diisi untuk PKP'
                    : 'Opsional untuk Non-PKP'
                  : 'Opsional untuk Prospect'
              }
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label='SPPKP (Surat Pengukuhan PKP)'
              value={data.sppkp || ''}
              onChange={handleInputChange('sppkp')}
              disabled={loading || (isActiveStatus && !isPKP)}
              variant='outlined'
              required={isActiveStatus && isPKP}
              helperText={
                isActiveStatus
                  ? isPKP
                    ? 'Wajib diisi untuk PKP'
                    : 'Tidak perlu diisi untuk Non-PKP'
                  : 'Opsional untuk Prospect'
              }
            />
          </Grid>
        </>
      )}

      {/* Show tax fields button for Prospect */}
      {!shouldShowTaxFields && data.status === 'PROSPECT' && (
        <Grid item xs={12}>
          <Button
            variant='outlined'
            onClick={() => {
              // Set both NPWP and SPPKP to empty string to trigger showing tax fields
              onChange({ ...data, no_npwp: '', sppkp: '' });
            }}
            startIcon={<AddIcon />}
            disabled={loading}
            fullWidth
            sx={{ justifyContent: 'flex-start' }}
          >
            Tambah Informasi Pajak (Opsional)
          </Button>
        </Grid>
      )}

      {/* Contacts Section */}
      <Grid item xs={12}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mt: 2,
          }}
        >
          <Typography variant='h6' fontWeight={600}>
            Kontak ({data.contacts?.length || 0})
          </Typography>
          <Button
            onClick={handleAddContact}
            startIcon={<AddIcon />}
            variant='outlined'
            size='small'
            disabled={loading}
          >
            Tambah Kontak
          </Button>
        </Box>
      </Grid>

      {data.contacts?.map((contact, index) => (
        <Grid item xs={12} key={index}>
          <Paper
            variant='outlined'
            sx={{
              p: 3,
              borderRadius: 2,
              backgroundColor: 'rgba(0, 0, 0, 0.02)',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 2,
              }}
            >
              <Typography variant='subtitle1' fontWeight={500}>
                Kontak {index + 1}
              </Typography>
              <IconButton
                onClick={() => handleRemoveContact(index)}
                color='error'
                size='small'
                disabled={loading}
              >
                <DeleteIcon />
              </IconButton>
            </Box>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label='Nama'
                  value={contact.name || ''}
                  onChange={(e) => handleContactChange(index, 'name', e.target.value)}
                  disabled={loading}
                  size='small'
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label='Posisi'
                  value={contact.position || ''}
                  onChange={(e) => handleContactChange(index, 'position', e.target.value)}
                  disabled={loading}
                  size='small'
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label='Email'
                  type='email'
                  value={contact.email || ''}
                  onChange={(e) => handleContactChange(index, 'email', e.target.value)}
                  disabled={loading}
                  size='small'
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label='Telepon'
                  value={contact.phone || ''}
                  onChange={(e) => handleContactChange(index, 'phone', e.target.value)}
                  disabled={loading}
                  size='small'
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      ))}

      {data.contacts?.length === 0 && (
        <Grid item xs={12}>
          <Box
            sx={{
              textAlign: 'center',
              py: 4,
              color: 'text.secondary',
              border: '2px dashed',
              borderColor: 'divider',
              borderRadius: 2,
            }}
          >
            <Typography variant='body1' gutterBottom>
              Belum ada kontak ditambahkan
            </Typography>
            <Typography variant='body2'>
              Klik 'Tambah Kontak' untuk menambahkan kontak pertama
            </Typography>
          </Box>
        </Grid>
      )}

      {/* Rekening Section */}
      <Grid item xs={12} sx={{ mt: 2 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Typography variant='h6' fontWeight={600}>
            Rekening ({(data as any).rekenings?.length || 0})
          </Typography>
          <Button
            onClick={handleAddRekening}
            startIcon={<AddIcon />}
            variant='outlined'
            size='small'
            disabled={loading}
          >
            Tambah Rekening
          </Button>
        </Box>
      </Grid>

      {(data as any).rekenings?.map((rek: any, index: number) => (
        <Grid item xs={12} key={index}>
          <Paper variant='outlined' sx={{ p: 2, borderRadius: 2 }}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 1,
              }}
            >
              <Typography variant='subtitle1' fontWeight={600}>
                Rekening {index + 1}
              </Typography>
              <Button size='small' color='error' onClick={() => handleRemoveRekening(index)}>
                Hapus
              </Button>
            </Box>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label='Nama Bank'
                  value={rek.bank_name || ''}
                  onChange={(e) => handleRekeningChange(index, 'bank_name', e.target.value)}
                  variant='outlined'
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label='No. Rekening'
                  value={rek.account_number || ''}
                  onChange={(e) => handleRekeningChange(index, 'account_number', e.target.value)}
                  variant='outlined'
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label='Nama Pemegang'
                  value={rek.account_holder || ''}
                  onChange={(e) => handleRekeningChange(index, 'account_holder', e.target.value)}
                  variant='outlined'
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      ))}

      {(data as any).rekenings?.length === 0 && (
        <Grid item xs={12}>
          <Paper
            variant='outlined'
            sx={{
              p: 4,
              borderRadius: 2,
              borderStyle: 'dashed',
              textAlign: 'center',
            }}
          >
            <Typography color='text.secondary'>Belum ada nomor rekening ditambahkan</Typography>
            <Typography color='text.secondary'>
              Klik 'Tambah Rekening' untuk menambahkan rekening pertama
            </Typography>
          </Paper>
        </Grid>
      )}
    </Grid>
  );
};

export default CustomerForm;

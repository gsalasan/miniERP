import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Box } from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';

interface Props {
  open: boolean;
  onAllow: () => void;
  onCancel: () => void;
}

const LocationPermissionPrompt: React.FC<Props> = ({ open, onAllow, onCancel }) => {
  return (
    <Dialog open={open} onClose={onCancel} aria-labelledby="location-permission-title">
      <DialogTitle id="location-permission-title" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <LocationOnIcon color="error" /> Izinkan akses lokasi
      </DialogTitle>
      <DialogContent>
        <Box sx={{ my: 1 }}>
          <Typography variant="body1" sx={{ mb: 1 }}>
            Untuk membuat fitur absensi dan preview lokasi bekerja dengan baik, aplikasi membutuhkan akses lokasi Anda.
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Saat Anda menekan "Izinkan", browser mungkin akan menampilkan prompt permintaan akses lokasi.
            Pilih "Allow"/"Izinkan" pada prompt browser.
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} color="inherit">Jangan sekarang</Button>
        <Button onClick={onAllow} variant="contained" color="error">Izinkan</Button>
      </DialogActions>
    </Dialog>
  );
};

export default LocationPermissionPrompt;

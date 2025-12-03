import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Stack,
} from '@mui/material';
import { LocationOn as LocationIcon } from '@mui/icons-material';

interface LocationPermissionDialogProps {
  open: boolean;
  onAllow: () => void;
  onDeny: () => void;
}

const LocationPermissionDialog: React.FC<LocationPermissionDialogProps> = ({
  open,
  onAllow,
  onDeny,
}) => {
  return (
    <Dialog 
      open={open} 
      maxWidth="xs" 
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
        }
      }}
    >
      <DialogTitle>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box 
            sx={{ 
              bgcolor: '#e3f2fd', 
              borderRadius: '50%', 
              width: 40, 
              height: 40, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}
          >
            <LocationIcon sx={{ color: '#1976d2', fontSize: 24 }} />
          </Box>
          <Typography variant="h6" fontWeight="bold">
            Izinkan Akses Lokasi
          </Typography>
        </Stack>
      </DialogTitle>
      
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Aplikasi ini membutuhkan akses lokasi Anda untuk:
        </Typography>
        <Box sx={{ pl: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
            • Mencatat lokasi saat check-in dan check-out
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
            • Menampilkan peta lokasi absensi
          </Typography>
          <Typography variant="body2" color="text.secondary">
            • Memverifikasi kehadiran Anda
          </Typography>
        </Box>
        <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 2 }}>
          Lokasi Anda hanya akan diakses saat Anda melakukan absensi.
        </Typography>
      </DialogContent>
      
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button 
          onClick={onDeny} 
          variant="outlined"
          sx={{ 
            borderRadius: 2,
            textTransform: 'none',
            px: 3,
            borderColor: '#e0e0e0',
            color: 'text.secondary',
            '&:hover': {
              borderColor: '#bdbdbd',
              bgcolor: '#f5f5f5',
            }
          }}
        >
          Jangan Sekarang
        </Button>
        <Button 
          onClick={onAllow} 
          variant="contained"
          sx={{ 
            borderRadius: 2,
            textTransform: 'none',
            px: 3,
            bgcolor: '#1976d2',
            boxShadow: 'none',
            '&:hover': {
              bgcolor: '#1565c0',
              boxShadow: 'none',
            }
          }}
        >
          Izinkan
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default LocationPermissionDialog;

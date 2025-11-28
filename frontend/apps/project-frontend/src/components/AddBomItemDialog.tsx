import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  List,
  ListItem,
  ListItemText,
  Typography,
  CircularProgress,
  useMediaQuery,
  useTheme,
  Snackbar,
} from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import { MaterialOption } from '../api/engineeringApi';
import { useMaterialsSearch } from '../api/hooks/useMaterialHooks';
import NewMaterialModal from './NewMaterialModal';

interface AddBomItemDialogProps {
  open: boolean;
  onClose: () => void;
  onSelectItem: (material: any) => void;
}

const AddBomItemDialog: React.FC<AddBomItemDialogProps> = ({ open, onClose, onSelectItem }) => {
  const { search, loading } = useMaterialsSearch();
  const [query, setQuery] = useState('');
  const [materials, setMaterials] = useState<MaterialOption[]>([]);
  const [category, setCategory] = useState<'material' | 'service'>('material');
  const [showNewModal, setShowNewModal] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string }>({ open: false, message: '' });

  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      if (!query || query.length < 1) {
        setMaterials([]);
        return;
      }
      try {
        const res = await search(query, category === 'service' ? 'service' : 'material');
        if (mounted) setMaterials(res);
      } catch (err) {
        setSnackbar({ open: true, message: 'Gagal mencari material' });
      }
    };
    run();
    return () => { mounted = false; };
  }, [query, search]);

  const handleSelect = (event: any, value: any) => {
    if (!value) return;
    if (value && (value as any).id === 'add-new') {
      setShowNewModal(true);
      return;
    }
    onSelectItem(value);
    onClose();
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" fullScreen={fullScreen}>
        <DialogTitle>Pilih Item untuk BoM</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2, display: 'flex', gap: 1, alignItems: 'center' }}>
            <Typography variant="body2">Kategori:</Typography>
            <Button variant={category === 'material' ? 'contained' : 'outlined'} size="small" onClick={() => setCategory('material')}>Material</Button>
            <Button variant={category === 'service' ? 'contained' : 'outlined'} size="small" onClick={() => setCategory('service')}>Service</Button>
          </Box>
          <Box sx={{ mt: 1 }}>
            <Autocomplete
              freeSolo
              options={materials.length > 0 ? materials : [{ id: 'no-results', item_name: 'Tidak ada hasil' }]}
              getOptionLabel={(opt: any) => opt.item_name || ''}
              loading={loading}
              filterOptions={(x) => x}
              onInputChange={(_, v) => setQuery(v)}
              onChange={handleSelect}
              renderOption={(props, option: any) => {
                // avoid spreading a props object that already contains a `key` prop
                const { key, ...rest } = props as any;
                if (option.id === 'no-results' && query && query.length >= 2 && category === 'material') {
                  return (
                    <ListItem button key="add-new" {...rest} onClick={() => { setShowNewModal(true); }}>
                      <AddCircleOutlineIcon sx={{ mr: 1 }} />
                      <ListItemText primary={`+ Tambah "${query}" sebagai Item Baru`} />
                    </ListItem>
                  );
                }
                return (
                  <ListItem key={option.id} {...rest}>
                    <ListItemText primary={option.item_name} secondary={category === 'service' ? option.brand || option.vendor : option.brand || option.vendor} />
                  </ListItem>
                );
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={category === 'service' ? 'Cari Service' : 'Cari Material'}
                  InputProps={{ ...params.InputProps, endAdornment: loading ? <CircularProgress size={20} /> : params.InputProps.endAdornment }}
                />
              )}
            />
          </Box>
          <Box sx={{ mt: 2 }}>
            <Typography variant="caption" color="text.secondary">Ketik minimal 2 karakter untuk pencarian.</Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Batal</Button>
        </DialogActions>
      </Dialog>

      <NewMaterialModal
        open={showNewModal}
        onClose={() => setShowNewModal(false)}
        initialName={query}
        onCreated={(material) => {
          setShowNewModal(false);
          if (material) {
            onSelectItem(material);
            onClose();
          }
        }}
      />

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ open: false, message: '' })} message={snackbar.message} />
    </>
  );
};

export default AddBomItemDialog;


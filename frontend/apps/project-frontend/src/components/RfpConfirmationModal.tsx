import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText,
  TextField,
  Typography,
} from '@mui/material';

interface RfpItem {
  itemId: string;
  itemType: 'MATERIAL' | 'SERVICE';
  itemName?: string;
  quantity: number;
}

interface Props {
  open: boolean;
  items: RfpItem[];
  projectName?: string;
  onClose: () => void;
  onConfirm: (payload: { items: RfpItem[]; notes?: string }) => void;
}

const RfpConfirmationModal: React.FC<Props> = ({ open, items, projectName, onClose, onConfirm }) => {
  const [notes, setNotes] = useState('');

  const handleSubmit = () => {
    onConfirm({ items, notes });
    setNotes(''); // Reset notes after submit
  };

  const handleClose = () => {
    setNotes(''); // Reset notes on cancel
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle>Konfirmasi Permintaan Pengadaan (RFP)</DialogTitle>
      <DialogContent>
        {projectName && (
          <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>
            Proyek: {projectName}
          </Typography>
        )}
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Daftar item yang akan dikirim ke Tim Procurement:
        </Typography>
        
        <List dense sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 1, mb: 2 }}>
          {items.map((it, index) => (
            <ListItem key={`${it.itemId}-${index}`}>
              <ListItemText
                primary={it.itemName || it.itemId}
                secondary={`${it.itemType} • Qty: ${it.quantity}`}
              />
            </ListItem>
          ))}
        </List>

        <TextField
          label="Catatan Tambahan untuk Tim Procurement"
          placeholder="Contoh: Prioritas tinggi, butuh cepat! atau Tolong cari dari vendor preferensi dulu."
          fullWidth
          multiline
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Batal</Button>
        <Button variant="contained" onClick={handleSubmit} color="primary">
          Kirim RFP
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RfpConfirmationModal;

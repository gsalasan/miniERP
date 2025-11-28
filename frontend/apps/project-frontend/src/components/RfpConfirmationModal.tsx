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
  onClose: () => void;
  onConfirm: (payload: { items: RfpItem[]; notes?: string }) => void;
}

const RfpConfirmationModal: React.FC<Props> = ({ open, items, onClose, onConfirm }) => {
  const [notes, setNotes] = useState('');

  const handleSubmit = () => {
    onConfirm({ items, notes });
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Konfirmasi Permintaan Pengadaan</DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ mb: 1 }}>Daftar item yang akan dikirim sebagai RFP:</Typography>
        <List dense>
          {items.map((it) => (
            <ListItem key={`${it.itemId}-${it.itemType}`}>
              <ListItemText
                primary={`${it.itemName || it.itemId} — ${it.quantity}`}
                secondary={it.itemType}
              />
            </ListItem>
          ))}
        </List>

        <TextField
          label="Catatan (opsional)"
          fullWidth
          multiline
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          sx={{ mt: 2 }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Batal</Button>
        <Button variant="contained" onClick={handleSubmit} color="primary">Kirim RFP</Button>
      </DialogActions>
    </Dialog>
  );
};

export default RfpConfirmationModal;

import { useState } from 'react';
import { notify } from './NotificationCenter';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Stack,
} from '@mui/material';

interface CreateMilestoneModalProps {
  open: boolean;
  onClose: () => void;
  onCreate: (data: {
    name: string;
    status: string;
    start_date?: string;
    end_date?: string;
  }) => void;
}

const CreateMilestoneModal = ({
  open,
  onClose,
  onCreate,
}: CreateMilestoneModalProps) => {
  const [name, setName] = useState('');
  const [status, setStatus] = useState('PLANNED');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const handleSubmit = () => {
    if (!name.trim()) {
      notify('Silakan masukkan nama milestone', { severity: 'warning' });
      return;
    }

    onCreate({
      name: name.trim(),
      status,
      start_date: startDate || undefined,
      end_date: endDate || undefined,
    });

    // Reset form
    setName('');
    setStatus('PLANNED');
    setStartDate('');
    setEndDate('');
    onClose();
  };

  const handleClose = () => {
    setName('');
    setStatus('PLANNED');
    setStartDate('');
    setEndDate('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Create New Milestone</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            label="Milestone Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            fullWidth
            required
            autoFocus
          />
          <TextField
            label="Status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            select
            fullWidth
          >
            <MenuItem value="PLANNED">Planned</MenuItem>
            <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
            <MenuItem value="DONE">Done</MenuItem>
          </TextField>
          <TextField
            label="Start Date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            fullWidth
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="End Date"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            fullWidth
            InputLabelProps={{ shrink: true }}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained">
          Create
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateMilestoneModal;

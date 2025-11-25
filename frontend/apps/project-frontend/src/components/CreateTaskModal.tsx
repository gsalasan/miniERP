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
import type { Milestone } from '../types';

interface CreateTaskModalProps {
  open: boolean;
  onClose: () => void;
  onCreate: (data: {
    name: string;
    status: string;
    milestone_id: string;
    start_date?: string;
    due_date?: string;
    description?: string;
  }) => void;
  milestones: Milestone[];
}

const CreateTaskModal = ({
  open,
  onClose,
  onCreate,
  milestones,
}: CreateTaskModalProps) => {
  const [name, setName] = useState('');
  const [status, setStatus] = useState('TODO');
  const [milestoneId, setMilestoneId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = () => {
    if (!name.trim()) {
      notify('Silakan masukkan nama tugas', { severity: 'warning' });
      return;
    }

    if (milestones.length === 0) {
      notify('Buat milestone terlebih dahulu sebelum menambahkan tugas', { severity: 'warning' });
      return;
    }

    if (!milestoneId) {
      notify('Pilih milestone untuk tugas ini', { severity: 'warning' });
      return;
    }

    onCreate({
      name: name.trim(),
      status,
      milestone_id: milestoneId,
      start_date: startDate ? new Date(startDate).toISOString() : undefined,
      due_date: dueDate ? new Date(dueDate).toISOString() : undefined,
      description: description.trim() || undefined,
    });

    // Reset form
    setName('');
    setStatus('TODO');
    setMilestoneId('');
    setStartDate('');
    setDueDate('');
    setDescription('');
    onClose();
  };

  const handleClose = () => {
    setName('');
    setStatus('TODO');
    setMilestoneId('');
    setStartDate('');
    setDueDate('');
    setDescription('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Create New Task</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            label="Task Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            fullWidth
            required
          />

          <TextField
            label="Status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            select
            fullWidth
          >
            <MenuItem value="TODO">To Do</MenuItem>
            <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
            <MenuItem value="DONE">Done</MenuItem>
          </TextField>

          <TextField
            label="Milestone (required)"
            value={milestoneId}
            onChange={(e) => setMilestoneId(e.target.value)}
            select
            fullWidth
            helperText="Pilih milestone yang sesuai untuk tugas ini"
            required
          >
            {milestones.map((m) => (
              <MenuItem key={m.id} value={m.id}>
                {m.name}
              </MenuItem>
            ))}
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
            label="Due Date"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            fullWidth
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            fullWidth
            multiline
            rows={3}
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

export default CreateTaskModal;

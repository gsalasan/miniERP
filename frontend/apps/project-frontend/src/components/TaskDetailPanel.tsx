import { useState, useEffect } from 'react';
import {
  Drawer,
  Box,
  Typography,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Slider,
  Button,
  Stack,
  Divider,
  Alert,
  IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { projectApi } from '../api/projectApi';
import { notify } from './NotificationCenter';
import ConfirmDialog from './ConfirmDialog';
import type { Task, TeamMember } from '../types';

interface TaskDetailPanelProps {
  open: boolean;
  task: Task | null;
  onClose: () => void;
  onUpdate: () => void;
  projectId: string;
  isPM: boolean;
}

const TaskDetailPanel = ({
  open,
  task,
  onClose,
  onUpdate,
  projectId,
  isPM,
}: TaskDetailPanelProps) => {
  const [formData, setFormData] = useState<any>({});
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (task) {
      setFormData({
        name: task.name,
        description: task.description || '',
        assignee_id: task.assignee_id || '',
        start_date: task.start_date ? new Date(task.start_date) : null,
        due_date: task.due_date ? new Date(task.due_date) : null,
        status: task.status,
        progress: task.progress,
      });
    }
  }, [task]);

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        const data = await projectApi.getProjectTeam(projectId);
        setTeamMembers(data);
      } catch (err: any) {
        console.error('Failed to load team members:', err);
      }
    };
    if (open && isPM) {
      fetchTeam();
    }
  }, [open, isPM, projectId]);

  const handleSave = async () => {
    if (!task) return;

    try {
      setLoading(true);
      setError(null);

      const updateData: any = {
        status: formData.status,
        progress: formData.progress,
      };

      // PM can update all fields
      if (isPM) {
        updateData.name = formData.name;
        updateData.description = formData.description;
        updateData.assignee_id = formData.assignee_id;
        updateData.start_date = formData.start_date?.toISOString();
        updateData.due_date = formData.due_date?.toISOString();
      }

      await projectApi.updateTask(projectId, task.id, updateData);
      onUpdate();
      notify('Perubahan tugas tersimpan', { severity: 'success' });
    } catch (err: any) {
      const msg = err?.message || 'Gagal memperbarui tugas';
      setError(msg);
      notify(msg, { severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!task) return;
    // open confirm dialog instead of native confirm
    setConfirmOpen(true);
  };

  const [confirmOpen, setConfirmOpen] = useState(false);

  const runDelete = async () => {
    if (!task) return;
    try {
      setLoading(true);
      await projectApi.deleteTask(projectId, task.id);
      onUpdate();
      onClose();
      notify('Tugas dihapus', { severity: 'success' });
    } catch (err: any) {
      const msg = err?.message || 'Gagal menghapus tugas';
      setError(msg);
      notify(msg, { severity: 'error' });
    } finally {
      setLoading(false);
      setConfirmOpen(false);
    }
  };

  if (!task) return null;

  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      <Box sx={{ width: 400, p: 3 }}>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={2}
        >
          <Typography variant="h6">Task Details</Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
        <Divider sx={{ mb: 2 }} />

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <Stack spacing={2}>
            {/* Task Name (PM only) */}
            <TextField
              label="Task Name"
              value={formData.name || ''}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              disabled={!isPM}
              fullWidth
            />

            {/* Description - editable by workers too per spec */}
            <TextField
              label="Description"
              value={formData.description || ''}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              disabled={!isPM}
              multiline
              rows={3}
              fullWidth
            />

            {/* Assignee (PM only) */}
            {isPM && (
              <FormControl fullWidth>
                <InputLabel>Ditugaskan kepada</InputLabel>
                <Select
                  value={formData.assignee_id || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, assignee_id: e.target.value })
                  }
                  label="Ditugaskan kepada"
                >
                  <MenuItem value="">
                    <em>Belum ditugaskan</em>
                  </MenuItem>
                  {teamMembers.map((m) => (
                    <MenuItem key={m.id} value={m.id}>
                      {m.name} {m.role ? `(${m.role})` : ''}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            {/* Start Date (PM only) */}
            {isPM && (
              <DatePicker
                label="Start Date"
                value={formData.start_date}
                onChange={(date) =>
                  setFormData({ ...formData, start_date: date })
                }
                slotProps={{ textField: { fullWidth: true } }}
              />
            )}

            {/* Due Date (PM only) */}
            {isPM && (
              <DatePicker
                label="Due Date"
                value={formData.due_date}
                onChange={(date) =>
                  setFormData({ ...formData, due_date: date })
                }
                slotProps={{ textField: { fullWidth: true } }}
              />
            )}

            {/* Status (editable by all) */}
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={formData.status || 'TODO'}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value })
                }
                label="Status"
              >
                <MenuItem value="TODO">To Do</MenuItem>
                <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
                <MenuItem value="DONE">Done</MenuItem>
              </Select>
            </FormControl>

            {/* Progress (optional UX enhancement; keep PM only to follow minimal spec) */}
            {isPM && (
              <Box>
                <Typography gutterBottom>
                  Progress: {formData.progress || 0}%
                </Typography>
                <Slider
                  value={formData.progress || 0}
                  onChange={(_, value) =>
                    setFormData({ ...formData, progress: value })
                  }
                  min={0}
                  max={100}
                  step={5}
                  marks
                  valueLabelDisplay="auto"
                />
              </Box>
            )}

            {/* Action Buttons */}
            <Stack direction="row" spacing={1} justifyContent="space-between" mt={2}>
              {isPM && (
                <Button
                  color="error"
                  variant="outlined"
                  startIcon={<DeleteIcon />}
                  onClick={handleDelete}
                  disabled={loading}
                >
                  Hapus
                </Button>
              )}
              <Box flexGrow={1} />
              <Button onClick={onClose}>Cancel</Button>
              <Button
                variant="contained"
                onClick={handleSave}
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save'}
              </Button>
            </Stack>
          </Stack>
        </LocalizationProvider>
      </Box>
      <ConfirmDialog
        open={confirmOpen}
        title="Hapus Tugas"
        message={`Apakah Anda yakin ingin menghapus task "${task.name}"?`}
        onConfirm={runDelete}
        onClose={() => setConfirmOpen(false)}
      />
    </Drawer>
  );
};

export default TaskDetailPanel;

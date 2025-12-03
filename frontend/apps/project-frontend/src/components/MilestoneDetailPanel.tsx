import { useState, useMemo, useEffect } from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Divider,
  Stack,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  List,
  ListItem,
  ListItemText,
  Chip,
  Paper,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import { projectApi } from '../api/projectApi';
import NotificationCenter, { notify } from './NotificationCenter';
import ConfirmDialog from './ConfirmDialog';
import type { Milestone, Task, TeamMember } from '../types';

interface MilestoneDetailPanelProps {
  open: boolean;
  milestone?: Milestone | null;
  tasks: Task[];
  onClose: () => void;
  onRefresh: () => void;
  projectId: string;
  isPM: boolean;
  onTaskClick?: (task: Task) => void;
}

const MilestoneDetailPanel = ({
  open,
  milestone,
  tasks,
  onClose,
  onRefresh,
  projectId,
  isPM,
  onTaskClick,
}: MilestoneDetailPanelProps) => {
  const [addingTask, setAddingTask] = useState(false);
  const [taskName, setTaskName] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskStatus, setTaskStatus] = useState<'TODO' | 'IN_PROGRESS' | 'DONE'>(
    'TODO'
  );
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [teamLoading, setTeamLoading] = useState(false);
  useEffect(() => {
    const loadTeam = async () => {
      if (!open) return;
      setTeamLoading(true);
      try {
        const members = await projectApi.getProjectTeam(projectId);
        setTeam(members);
      } catch (e) {
        // silent fallback
      } finally {
        setTeamLoading(false);
      }
    };
    loadTeam();
  }, [open, projectId]);
  const [savingTask, setSavingTask] = useState(false);
  const [updatingMilestone, setUpdatingMilestone] = useState(false);
  const [startDate, setStartDate] = useState(
    milestone?.start_date ? milestone.start_date.slice(0, 10) : ''
  );
  const [endDate, setEndDate] = useState(
    milestone?.end_date ? milestone.end_date.slice(0, 10) : ''
  );
  const [status, setStatus] = useState<Milestone['status']>(
    milestone?.status || 'PLANNED'
  );

  useEffect(() => {
    setStartDate(
      milestone?.start_date ? milestone.start_date.slice(0, 10) : ''
    );
    setEndDate(milestone?.end_date ? milestone.end_date.slice(0, 10) : '');
    setStatus(milestone?.status || 'PLANNED');
  }, [milestone?.id]);

  // Filter tasks belonging to this milestone
  const milestoneTasks = useMemo(
    () => tasks.filter((t) => t.milestone_id === milestone?.id),
    [tasks, milestone?.id]
  );

  const resetTaskForm = () => {
    setTaskName('');
    setAssigneeId('');
    setTaskDescription('');
    setTaskStatus('TODO');
    setAddingTask(false);
  };

  const [confirmState, setConfirmState] = useState<{
    open: boolean;
    title?: string;
    message: string;
    onConfirm?: () => void;
  }>({ open: false, message: '' });

  const handleCreateTask = async () => {
    if (!milestone || !taskName.trim()) return;
    try {
      setSavingTask(true);
      await projectApi.createTask(projectId, {
        milestone_id: milestone.id,
        name: taskName.trim(),
        description: taskDescription.trim() || undefined,
        assignee_id: assigneeId || undefined,
        status: taskStatus,
        progress:
          taskStatus === 'DONE' ? 100 : taskStatus === 'IN_PROGRESS' ? 50 : 0,
      });
      resetTaskForm();
      onRefresh();
      notify('Tugas berhasil dibuat', { severity: 'success' });
    } catch (err: any) {
      const msg = err?.message || 'Gagal membuat tugas';
      notify(msg, { severity: 'error' });
      alert(msg);
    } finally {
      setSavingTask(false);
    }
  };

  const handleUpdateMilestone = async () => {
    if (!milestone) return;
    try {
      setUpdatingMilestone(true);
      await projectApi.updateMilestone(projectId, milestone.id, {
        start_date: startDate ? new Date(startDate).toISOString() : undefined,
        end_date: endDate ? new Date(endDate).toISOString() : undefined,
        status,
      });
      onRefresh();
      notify('Milestone berhasil diperbarui', { severity: 'success' });
    } catch (err: any) {
      const msg = err?.message || 'Gagal memperbarui milestone';
      notify(msg, { severity: 'error' });
      alert(msg);
    } finally {
      setUpdatingMilestone(false);
    }
  };

  const handleDeleteMilestone = async () => {
    // open confirm dialog instead of native confirm()
    setConfirmState({
      open: true,
      title: 'Hapus Milestone',
      message: `Apakah Anda yakin ingin menghapus milestone "${milestone?.name}"? Ini akan menghapus semua tugas di dalamnya.`,
      onConfirm: async () => {
        if (!milestone) return;
        try {
          await projectApi.deleteMilestone(projectId, milestone.id);
          onRefresh();
          onClose();
          notify('Milestone berhasil dihapus', { severity: 'success' });
        } catch (err: any) {
          const msg = err?.message || 'Gagal menghapus milestone';
          notify(msg, { severity: 'error' });
        } finally {
          setConfirmState({ ...confirmState, open: false });
        }
      },
    });
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { width: 380 } }}
    >
      <Box
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        px={2}
        py={1}
        sx={{ gap: 1 }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
          <Typography variant="h6" noWrap style={{ maxWidth: 220 }}>
            {milestone?.name || 'Milestone'}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* Sticky Add Task button so it doesn't get hidden when scrolling */}
          {isPM && (
            <Button
              variant="outlined"
              size="small"
              onClick={() => setAddingTask((s) => !s)}
              sx={{ position: 'sticky', top: 8 }}
            >
              {addingTask ? 'Cancel' : '+ Tambah Tugas'}
            </Button>
          )}
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </Box>
      <Divider />

      <Box p={2} display="flex" flexDirection="column" gap={2}>
        {/* Dates & Status */}
        {isPM && (
          <Stack spacing={1}>
            <Typography variant="subtitle2">Jadwal & Status</Typography>
            <Stack direction="row" spacing={1}>
              <TextField
                label="Mulai"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                size="small"
                sx={{ flex: 1 }}
              />
              <TextField
                label="Selesai"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                size="small"
                sx={{ flex: 1 }}
              />
            </Stack>
            <FormControl size="small">
              <InputLabel>Status</InputLabel>
              <Select
                label="Status"
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value as Milestone['status'])
                }
                sx={{ minWidth: 160 }}
              >
                <MenuItem value="PLANNED">Planned</MenuItem>
                <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
                <MenuItem value="DONE">Done</MenuItem>
              </Select>
            </FormControl>
            <Stack direction="row" spacing={1}>
              <Button
                variant="contained"
                onClick={handleUpdateMilestone}
                disabled={updatingMilestone}
                size="small"
              >
                {updatingMilestone ? 'Menyimpan...' : 'Simpan'}
              </Button>
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={handleDeleteMilestone}
                size="small"
              >
                Hapus
              </Button>
            </Stack>
          </Stack>
        )}

        {/* Task List */}
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            Tugas di dalam Milestone ini
          </Typography>

          <Paper variant="outlined" sx={{ p: 1, maxHeight: 360, overflow: 'auto' }}>
            {milestoneTasks.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                Belum ada tugas.
              </Typography>
            ) : (
              <List>
                {milestoneTasks.map((t) => (
                  <ListItem
                    key={t.id}
                    disableGutters={false}
                    secondaryAction={
                      isPM ? (
                        <Button
                          size="small"
                          color="error"
                          onClick={() => {
                            setConfirmState({
                              open: true,
                              title: 'Hapus Tugas',
                              message: `Hapus tugas "${t.name}"?`,
                              onConfirm: async () => {
                                try {
                                  await projectApi.deleteTask(projectId, t.id);
                                  onRefresh();
                                  notify('Tugas dihapus', { severity: 'success' });
                                } catch (err: any) {
                                  const msg = err?.message || 'Gagal menghapus tugas';
                                  notify(msg, { severity: 'error' });
                                } finally {
                                  setConfirmState({ ...confirmState, open: false });
                                }
                              },
                            });
                          }}
                        >
                          Hapus
                        </Button>
                      ) : undefined
                    }
                    button
                    onClick={() => onTaskClick?.(t)}
                    sx={{ py: 1.2, px: 1 }}
                  >
                    <ListItemText
                      primary={t.name}
                      secondaryTypographyProps={{ component: 'div' }}
                      secondary={
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Chip
                            size="small"
                            label={
                              t.status === 'TODO'
                                ? 'To Do'
                                : t.status === 'IN_PROGRESS'
                                  ? 'In Progress'
                                  : 'Done'
                            }
                            color={
                              t.status === 'DONE'
                                ? 'success'
                                : t.status === 'IN_PROGRESS'
                                  ? 'primary'
                                  : 'default'
                            }
                          />
                          <Box>
                            <Typography variant="caption" display="block">
                              {t.assignee?.employee?.full_name
                                ? `@${t.assignee.employee.full_name}`
                                : 'Unassigned'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {t.start_date ? `Start: ${t.start_date.slice(0,10)}` : ''}
                              {t.due_date ? ` • Due: ${t.due_date.slice(0,10)}` : ''}
                            </Typography>
                          </Box>
                        </Stack>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </Paper>
        </Box>

        {/* Add Task Form */}
        {isPM && (
          <Box mt={1}>
            {addingTask && (
              <Paper variant="outlined" sx={{ p: 1, mb: 1 }}>
                <Stack spacing={1}>
                  <TextField
                    label="Nama Tugas"
                    size="small"
                    value={taskName}
                    onChange={(e) => setTaskName(e.target.value)}
                  />
                  <FormControl size="small" fullWidth>
                    <InputLabel>Ditugaskan kepada</InputLabel>
                    <Select
                      label="Ditugaskan kepada"
                      value={assigneeId}
                      onChange={(e) => setAssigneeId(e.target.value as string)}
                      disabled={teamLoading || team.length === 0}
                    >
                      <MenuItem value="">
                        <em>None</em>
                      </MenuItem>
                      {team.map((m) => (
                        <MenuItem key={m.id} value={m.id}>
                          {m.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControl size="small" fullWidth>
                    <InputLabel>Status</InputLabel>
                    <Select
                      label="Status"
                      value={taskStatus}
                      onChange={(e) =>
                        setTaskStatus(
                          e.target.value as 'TODO' | 'IN_PROGRESS' | 'DONE'
                        )
                      }
                    >
                      <MenuItem value="TODO">To Do</MenuItem>
                      <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
                      <MenuItem value="DONE">Done</MenuItem>
                    </Select>
                  </FormControl>
                  <TextField
                    label="Deskripsi"
                    size="small"
                    multiline
                    minRows={2}
                    value={taskDescription}
                    onChange={(e) => setTaskDescription(e.target.value)}
                  />
                  <Stack direction="row" spacing={1}>
                    <Button
                      variant="contained"
                      size="small"
                      onClick={handleCreateTask}
                      disabled={savingTask || !taskName.trim()}
                    >
                      {savingTask ? 'Menyimpan...' : 'Simpan'}
                    </Button>
                    <Button
                      variant="text"
                      size="small"
                      onClick={resetTaskForm}
                      disabled={savingTask}
                    >
                      Batal
                    </Button>
                  </Stack>
                </Stack>
              </Paper>
            )}
          </Box>
        )}
      </Box>
      <ConfirmDialog
        open={confirmState.open}
        title={confirmState.title}
        message={confirmState.message}
        onConfirm={() => confirmState.onConfirm?.()}
        onClose={() => setConfirmState({ ...confirmState, open: false })}
      />
    </Drawer>
  );
};

export default MilestoneDetailPanel;


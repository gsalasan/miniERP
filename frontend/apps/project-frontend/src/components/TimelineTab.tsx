import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Paper,
  Stack,
  Chip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import { projectApi } from '../api/projectApi';
import NotificationCenter, { notify } from './NotificationCenter';
import type { Milestone, Task } from '../types';
import GanttChartComponent from './GanttChartComponent';
import TaskDetailPanel from './TaskDetailPanel';
import ApplyTemplateModal from './ApplyTemplateModal';
import MilestoneDetailPanel from './MilestoneDetailPanel';
import CreateMilestoneModal from './CreateMilestoneModal';
import CreateTaskModal from './CreateTaskModal';

interface TimelineTabProps {
  projectId: string;
  isPM: boolean;
}

const TimelineTab = ({ projectId, isPM }: TimelineTabProps) => {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [taskDrawerOpen, setTaskDrawerOpen] = useState(false);
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [milestonePanelOpen, setMilestonePanelOpen] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(
    null
  );
  const [viewMode, setViewMode] = useState<'Day' | 'Week' | 'Month'>('Week');
  const [createMilestoneOpen, setCreateMilestoneOpen] = useState(false);
  const [createTaskOpen, setCreateTaskOpen] = useState(false);

  const fetchMilestones = async () => {
    try {
      setLoading(true);
      const data = await projectApi.getMilestones(projectId);
      setMilestones(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load milestones');
    } finally {
      setLoading(false);
    }
  };

  const fetchTasks = async () => {
    try {
      const data = await projectApi.getTasks(projectId);
      setTasks(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load tasks');
    }
  };

  useEffect(() => {
    fetchMilestones();
    fetchTasks();
  }, [projectId]);

  const handleTemplateApplied = () => {
    setTemplateModalOpen(false);
    fetchMilestones();
    fetchTasks();
    notify('Template diterapkan', { severity: 'success' });
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setTaskDrawerOpen(true);
  };

  const handleTaskUpdated = () => {
    fetchTasks();
    setTaskDrawerOpen(false);
  };
  const handleMilestoneClick = (milestoneId: string) => {
    const m = milestones.find((ms) => ms.id === milestoneId) || null;
    setSelectedMilestone(m);
    setMilestonePanelOpen(true);
  };

  const handleMilestoneDateChange = async (
    milestoneId: string,
    start: Date,
    end: Date
  ) => {
    try {
      await projectApi.updateMilestone(projectId, milestoneId, {
        start_date: start.toISOString(),
        end_date: end.toISOString(),
      });
      fetchMilestones();
      notify('Tanggal milestone diperbarui', { severity: 'success' });
    } catch (err: any) {
      const msg = err?.message || 'Gagal memperbarui tanggal milestone';
      notify(msg, { severity: 'error' });
    }
  };

  const handleCreateMilestone = async (data: any) => {
    try {
      await projectApi.createMilestone(projectId, data);
      fetchMilestones();
      notify('Milestone berhasil dibuat', { severity: 'success' });
    } catch (err: any) {
      const msg = err?.message || 'Gagal membuat milestone';
      notify(msg, { severity: 'error' });
    }
  };

  const handleCreateTask = async (data: any) => {
    try {
      await projectApi.createTask(projectId, data);
      fetchTasks();
      notify('Tugas berhasil dibuat', { severity: 'success' });
    } catch (err: any) {
      const msg = err?.message || 'Gagal membuat tugas';
      notify(msg, { severity: 'error' });
    }
  };

  const handleDateChange = async (taskId: string, start: Date, end: Date) => {
    try {
      await projectApi.updateTask(projectId, taskId, {
        start_date: start.toISOString(),
        due_date: end.toISOString(),
      });
      fetchTasks();
      notify('Tanggal tugas diperbarui', { severity: 'success' });
    } catch (err: any) {
      const msg = err?.message || 'Gagal memperbarui tanggal tugas';
      notify(msg, { severity: 'error' });
    }
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height={400}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box>
      {/* Header */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h6" display="flex" alignItems="center" gap={1}>
          <CalendarMonthOutlinedIcon />
          Timeline & Tugas
        </Typography>
        {isPM && (
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => setTemplateModalOpen(true)}
            >
              Apply Template
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setCreateMilestoneOpen(true)}
            >
              Add Milestone
            </Button>
            <Button
              variant="contained"
              color="secondary"
              startIcon={<AddIcon />}
              onClick={() => setCreateTaskOpen(true)}
            >
              Add Task
            </Button>
          </Stack>
        )}
      </Box>

      {/* Milestone Summary */}
      {milestones.length > 0 && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Milestone Summary
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {milestones.map((m) => (
              <Chip
                key={m.id}
                label={m.name}
                color={
                  m.status === 'DONE'
                    ? 'success'
                    : m.status === 'IN_PROGRESS'
                      ? 'primary'
                      : 'default'
                }
                size="small"
              />
            ))}
          </Stack>
        </Paper>
      )}

      {/* Gantt Chart */}
      {tasks.length > 0 || milestones.length > 0 ? (
        <Paper sx={{ p: 2, mb: 3, overflow: 'visible' }}>
          <Typography variant="subtitle2" gutterBottom>
            Gantt Chart
          </Typography>
          <Stack direction="row" spacing={1} mb={1} alignItems="center">
            <Typography variant="caption">View:</Typography>
            {['Day', 'Week', 'Month'].map((m) => (
              <Button
                key={m}
                size="small"
                variant={viewMode === m ? 'contained' : 'text'}
                onClick={() => setViewMode(m as any)}
              >
                {m}
              </Button>
            ))}
            <Box flexGrow={1} />
            <Stack direction="row" spacing={1}>
              <Chip
                size="small"
                label="Milestone"
                sx={{ bgcolor: '#5d4037', color: '#fff' }}
              />
              <Chip
                size="small"
                label="Task TODO"
                sx={{ bgcolor: '#90caf9' }}
              />
              <Chip
                size="small"
                label="Task In Progress"
                sx={{ bgcolor: '#4caf50', color: '#fff' }}
              />
              <Chip
                size="small"
                label="Task Done"
                sx={{ bgcolor: '#9e9e9e' }}
              />
            </Stack>
          </Stack>
          <GanttChartComponent
            tasks={tasks}
            milestones={milestones}
            onTaskClick={handleTaskClick}
            onMilestoneClick={handleMilestoneClick}
            viewMode={viewMode}
            onDateChange={isPM ? handleDateChange : undefined}
            onMilestoneDateChange={isPM ? handleMilestoneDateChange : undefined}
          />
        </Paper>
      ) : (
        <Alert severity="info">
          No tasks yet.{' '}
          {isPM ? 'Apply a template or add milestones to get started.' : ''}
        </Alert>
      )}

      {/* Task Detail Drawer */}
      <TaskDetailPanel
        open={taskDrawerOpen}
        task={selectedTask}
        onClose={() => setTaskDrawerOpen(false)}
        onUpdate={handleTaskUpdated}
        projectId={projectId}
        isPM={isPM}
      />

      {/* Template Modal */}
      <ApplyTemplateModal
        open={templateModalOpen}
        onClose={() => setTemplateModalOpen(false)}
        onApply={handleTemplateApplied}
        projectId={projectId}
      />

      <MilestoneDetailPanel
        open={milestonePanelOpen}
        milestone={selectedMilestone}
        tasks={tasks}
        onClose={() => setMilestonePanelOpen(false)}
        onRefresh={() => {
          fetchMilestones();
          fetchTasks();
        }}
        projectId={projectId}
        isPM={isPM}
        onTaskClick={handleTaskClick}
      />

      {/* Create Milestone Modal */}
      <CreateMilestoneModal
        open={createMilestoneOpen}
        onClose={() => setCreateMilestoneOpen(false)}
        onCreate={handleCreateMilestone}
      />

      {/* Create Task Modal */}
      <CreateTaskModal
        open={createTaskOpen}
        onClose={() => setCreateTaskOpen(false)}
        onCreate={handleCreateTask}
        milestones={milestones}
      />
      <NotificationCenter />
    </Box>
  );
};

export default TimelineTab;

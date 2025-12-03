import { useState, useEffect, useRef } from 'react';
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
import PictureAsPdfOutlinedIcon from '@mui/icons-material/PictureAsPdfOutlined';
import { projectApi } from '../api/projectApi';
import NotificationCenter, { notify } from './NotificationCenter';
import type { Milestone, Task } from '../types';
import GanttChartComponent from './GanttChartComponent';
import TaskDetailPanel from './TaskDetailPanel';
import ApplyTemplateModal from './ApplyTemplateModal';
import MilestoneDetailPanel from './MilestoneDetailPanel';
import CreateMilestoneModal from './CreateMilestoneModal';
import CreateTaskModal from './CreateTaskModal';
import { exportGanttToPDF } from '../utils/ganttExport';

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
  const ganttContainerRef = useRef<HTMLDivElement>(null);

  // Handle PDF Export
  const handleExportPDF = () => {
    if (!ganttContainerRef.current) {
      notify('Gantt chart not ready for export', { severity: 'error' });
      return;
    }

    try {
      exportGanttToPDF(ganttContainerRef.current, {
        filename: `project-gantt-${projectId}.pdf`,
        format: 'pdf',
        orientation: 'landscape',
        quality: 0.95,
      });
      notify('Exporting Gantt chart to PDF...', { severity: 'info' });
    } catch (error) {
      console.error('PDF Export error:', error);
      notify('Failed to export PDF', { severity: 'error' });
    }
  };

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
      
      // Optimistic update instead of full refetch
      setMilestones((prev) =>
        prev.map((m) =>
          m.id === milestoneId
            ? { ...m, start_date: start.toISOString(), end_date: end.toISOString() }
            : m
        )
      );
      
      notify('Tanggal milestone diperbarui', { severity: 'success' });
    } catch (err: any) {
      const msg = err?.message || 'Gagal memperbarui tanggal milestone';
      notify(msg, { severity: 'error' });
      // Revert by refetching on error
      fetchMilestones();
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
      
      // Optimistic update instead of full refetch
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? { ...t, start_date: start.toISOString(), due_date: end.toISOString() }
            : t
        )
      );
      
      notify('Tanggal tugas diperbarui', { severity: 'success' });
    } catch (err: any) {
      const msg = err?.message || 'Gagal memperbarui tanggal tugas';
      notify(msg, { severity: 'error' });
      // Revert by refetching on error
      fetchTasks();
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
        <Paper 
          sx={{ 
            mb: 2, 
            overflow: 'hidden',
            border: '1px solid',
            borderColor: 'divider'
          }}
        >
          <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'grey.50' }}>
            <Typography variant="subtitle2" fontWeight={600}>
              Milestone Summary
            </Typography>
          </Box>
          <Box sx={{ p: 2 }}>
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
                  sx={{
                    height: 28,
                    fontWeight: 600,
                    fontSize: '0.813rem'
                  }}
                />
              ))}
            </Stack>
          </Box>
        </Paper>
      )}

      {/* Gantt Chart */}
      {tasks.length > 0 || milestones.length > 0 ? (
        <Paper sx={{ mb: 3, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
          {/* Gantt Chart Title */}
          <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'grey.50' }}>
            <Typography variant="subtitle1" fontWeight={600}>
              Gantt Chart
            </Typography>
          </Box>

          {/* Controls Bar - View Mode + Legend + Export PDF */}
          <Box 
            sx={{ 
              px: 2, 
              py: 1.5, 
              borderBottom: '1px solid', 
              borderColor: 'divider',
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              flexWrap: 'wrap',
              bgcolor: '#fafafa'
            }}
          >
            {/* Export PDF Button */}
            <Button
              variant="contained"
              size="small"
              startIcon={<PictureAsPdfOutlinedIcon />}
              onClick={handleExportPDF}
              sx={{
                height: 32,
                fontWeight: 600,
                fontSize: '0.813rem',
                bgcolor: '#1976d2',
                '&:hover': {
                  bgcolor: '#1565c0',
                }
              }}
            >
              Export PDF
            </Button>

            {/* Divider */}
            <Box sx={{ height: 32, width: '1px', bgcolor: 'divider' }} />

            {/* View Mode Selector */}
            <Stack direction="row" spacing={0.5} alignItems="center">
              <Typography variant="body2" fontWeight={600} color="text.secondary" sx={{ mr: 0.5 }}>
                View:
              </Typography>
              {['Day', 'Week', 'Month'].map((m) => (
                <Button
                  key={m}
                  size="small"
                  variant={viewMode === m ? 'contained' : 'outlined'}
                  onClick={() => setViewMode(m as any)}
                  sx={{ 
                    minWidth: 70,
                    height: 32,
                    fontSize: '0.813rem',
                    fontWeight: 600,
                    ...(viewMode !== m && {
                      borderColor: 'divider',
                      color: 'text.secondary',
                      '&:hover': {
                        borderColor: 'primary.main',
                        bgcolor: 'action.hover'
                      }
                    })
                  }}
                >
                  {m}
                </Button>
              ))}
            </Stack>

            {/* Divider */}
            <Box sx={{ height: 32, width: '1px', bgcolor: 'divider' }} />

            {/* Legend */}
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
              <Typography variant="body2" fontWeight={600} color="text.secondary" sx={{ mr: 0.5 }}>
                Legend:
              </Typography>
              <Chip
                size="small"
                label="Milestone"
                icon={<span style={{ fontSize: '14px' }}>📌</span>}
                sx={{ 
                  bgcolor: '#5d4037', 
                  color: '#fff',
                  height: 26,
                  '& .MuiChip-label': { px: 1, fontSize: '0.75rem', fontWeight: 600 }
                }}
              />
              <Chip
                size="small"
                label="TODO"
                sx={{ 
                  bgcolor: '#90caf9',
                  color: '#000',
                  height: 26,
                  '& .MuiChip-label': { px: 1, fontSize: '0.75rem', fontWeight: 600 }
                }}
              />
              <Chip
                size="small"
                label="In Progress"
                sx={{ 
                  bgcolor: '#4caf50', 
                  color: '#fff',
                  height: 26,
                  '& .MuiChip-label': { px: 1, fontSize: '0.75rem', fontWeight: 600 }
                }}
              />
              <Chip
                size="small"
                label="Done"
                sx={{ 
                  bgcolor: '#9e9e9e',
                  color: '#fff',
                  height: 26,
                  '& .MuiChip-label': { px: 1, fontSize: '0.75rem', fontWeight: 600 }
                }}
              />
            </Stack>
          </Box>

          {/* Gantt Chart Container */}
          <Box 
            ref={ganttContainerRef} 
            sx={{ 
              p: 2,
              overflow: 'auto',
              width: '100%',
              minHeight: 400
            }}
          >
            <GanttChartComponent
              tasks={tasks}
              milestones={milestones}
              onTaskClick={handleTaskClick}
              onMilestoneClick={handleMilestoneClick}
              viewMode={viewMode}
              onDateChange={isPM ? handleDateChange : undefined}
              onMilestoneDateChange={isPM ? handleMilestoneDateChange : undefined}
            />
          </Box>
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
        tasks={tasks}
      />
      <NotificationCenter />
    </Box>
  );
};

export default TimelineTab;

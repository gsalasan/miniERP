import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
  Typography,
  IconButton,
  Box,
  Alert,
  MenuItem,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  DragIndicator as DragIcon,
} from '@mui/icons-material';
import { projectApi } from '../api/projectApi';
import { notify } from './NotificationCenter';
import type { MilestoneTemplate } from '../types';

interface TemplateFormModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (isEdit: boolean) => void;
  template?: MilestoneTemplate | null;
}

interface MilestoneFormData {
  name: string;
  duration_days: number;
  status: 'PLANNED' | 'IN_PROGRESS' | 'DONE';
}

const TemplateFormModal = ({
  open,
  onClose,
  onSuccess,
  template,
}: TemplateFormModalProps) => {
  const [templateName, setTemplateName] = useState('');
  const [projectType, setProjectType] = useState('');
  const [milestones, setMilestones] = useState<MilestoneFormData[]>([
    { name: '', duration_days: 7, status: 'PLANNED' },
  ]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      if (template) {
        // Edit mode
        setTemplateName(template.template_name);
        setProjectType(template.project_type || '');
        setMilestones(
          template.milestones.length > 0
            ? template.milestones.map((m) => ({
                name: m.name,
                duration_days: m.duration_days,
                status: m.status,
              }))
            : [{ name: '', duration_days: 7, status: 'PLANNED' }]
        );
      } else {
        // Create mode
        resetForm();
      }
      setError(null);
    }
  }, [open, template]);

  const resetForm = () => {
    setTemplateName('');
    setProjectType('');
    setMilestones([{ name: '', duration_days: 7, status: 'PLANNED' }]);
  };

  const handleAddMilestone = () => {
    setMilestones([
      ...milestones,
      { name: '', duration_days: 7, status: 'PLANNED' },
    ]);
  };

  const handleRemoveMilestone = (index: number) => {
    if (milestones.length === 1) {
      notify('Template must have at least one milestone', { severity: 'warning' });
      return;
    }
    setMilestones(milestones.filter((_, i) => i !== index));
  };

  const handleMilestoneChange = (
    index: number,
    field: keyof MilestoneFormData,
    value: string | number
  ) => {
    const updated = [...milestones];
    updated[index] = { ...updated[index], [field]: value };
    setMilestones(updated);
  };

  const validateForm = (): boolean => {
    if (!templateName.trim()) {
      setError('Template name is required');
      return false;
    }

    if (milestones.length === 0) {
      setError('At least one milestone is required');
      return false;
    }

    for (let i = 0; i < milestones.length; i++) {
      const m = milestones[i];
      if (!m.name.trim()) {
        setError(`Milestone ${i + 1}: Name is required`);
        return false;
      }
      if (m.duration_days <= 0) {
        setError(`Milestone ${i + 1}: Duration must be greater than 0`);
        return false;
      }
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      setSaving(true);
      setError(null);

      const payload = {
        template_name: templateName.trim(),
        project_type: projectType.trim() || undefined,
        milestones: milestones.map((m) => ({
          name: m.name.trim(),
          duration_days: Number(m.duration_days),
          status: m.status,
        })),
      };

      const isEdit = !!template;

      if (isEdit) {
        // Update existing template
        notify('Updating your template...', { 
          severity: 'info',
          title: '✏️ Template Update'
        });
        await projectApi.updateMilestoneTemplate(template.id, payload);
      } else {
        // Create new template
        notify('Setting up your new template...', { 
          severity: 'info',
          title: '🎨 Creating Template'
        });
        await projectApi.createMilestoneTemplate(payload);
      }

      onSuccess(isEdit);
    } catch (err: any) {
      const message = err.message || 'Failed to save template';
      setError(message);
      notify(message, { severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {template ? 'Edit Template' : 'Create New Template'}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
          {error && (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {/* Template Name */}
          <TextField
            label="Template Name"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            fullWidth
            required
            placeholder="e.g., Standard Project Timeline"
          />

          {/* Project Type */}
          <TextField
            label="Project Type"
            value={projectType}
            onChange={(e) => setProjectType(e.target.value)}
            fullWidth
            placeholder="e.g., Software Development, Construction"
            helperText="Optional: Specify the type of project this template is for"
          />

          {/* Milestones Section */}
          <Box>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              sx={{ mb: 2 }}
            >
              <Typography variant="subtitle1" fontWeight="bold">
                Milestones
              </Typography>
              <Button
                size="small"
                startIcon={<AddIcon />}
                onClick={handleAddMilestone}
              >
                Add Milestone
              </Button>
            </Stack>

            <Stack spacing={2}>
              {milestones.map((milestone, index) => (
                <Box
                  key={index}
                  sx={{
                    p: 2,
                    border: 1,
                    borderColor: 'divider',
                    borderRadius: 1,
                    backgroundColor: 'background.paper',
                  }}
                >
                  <Stack direction="row" spacing={1} alignItems="flex-start">
                    {/* Drag Handle */}
                    <Box sx={{ pt: 2, cursor: 'move' }}>
                      <DragIcon fontSize="small" color="disabled" />
                    </Box>

                    {/* Fields */}
                    <Stack spacing={2} sx={{ flexGrow: 1 }}>
                      <Stack direction="row" spacing={2}>
                        <TextField
                          label="Milestone Name"
                          value={milestone.name}
                          onChange={(e) =>
                            handleMilestoneChange(index, 'name', e.target.value)
                          }
                          fullWidth
                          required
                          size="small"
                          placeholder="e.g., Project Kickoff"
                        />
                        <TextField
                          label="Duration (days)"
                          type="number"
                          value={milestone.duration_days}
                          onChange={(e) =>
                            handleMilestoneChange(
                              index,
                              'duration_days',
                              parseInt(e.target.value) || 0
                            )
                          }
                          required
                          size="small"
                          sx={{ width: 150 }}
                          inputProps={{ min: 1 }}
                        />
                      </Stack>

                      <TextField
                        select
                        label="Status"
                        value={milestone.status}
                        onChange={(e) =>
                          handleMilestoneChange(
                            index,
                            'status',
                            e.target.value as 'PLANNED' | 'IN_PROGRESS' | 'DONE'
                          )
                        }
                        size="small"
                        sx={{ width: 200 }}
                      >
                        <MenuItem value="PLANNED">Planned</MenuItem>
                        <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
                        <MenuItem value="DONE">Done</MenuItem>
                      </TextField>
                    </Stack>

                    {/* Delete Button */}
                    <IconButton
                      color="error"
                      onClick={() => handleRemoveMilestone(index)}
                      disabled={milestones.length === 1}
                      sx={{ mt: 1 }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Stack>

                  {/* Milestone Number */}
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: 'block', mt: 1 }}
                  >
                    Milestone #{index + 1}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Saving...' : template ? 'Update' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TemplateFormModal;

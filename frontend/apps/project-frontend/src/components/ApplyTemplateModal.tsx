import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Typography,
  Alert,
  CircularProgress,
  Box,
  Stack,
  IconButton,
} from '@mui/material';
import { Settings as SettingsIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { projectApi } from '../api/projectApi';
import { notify } from './NotificationCenter';
import type { MilestoneTemplate } from '../types';

interface ApplyTemplateModalProps {
  open: boolean;
  onClose: () => void;
  onApply: () => void;
  projectId: string;
}

const ApplyTemplateModal = ({
  open,
  onClose,
  onApply,
  projectId,
}: ApplyTemplateModalProps) => {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<MilestoneTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      fetchTemplates();
    }
  }, [open]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await projectApi.getMilestoneTemplates();
      setTemplates(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    if (!selectedTemplateId) return;

    const selectedTemplate = templates.find(t => t.id === selectedTemplateId);
    const templateName = selectedTemplate?.template_name || 'template';

    try {
      setApplying(true);
      setError(null);
      notify('Applying template to your project...', { 
        severity: 'info',
        title: '🚀 Applying Template'
      });
      await projectApi.applyMilestoneTemplate(projectId, selectedTemplateId);
      notify(
        `"${templateName}" has been applied. All milestones are now ready!`,
        { 
          severity: 'success',
          title: '✨ Template Applied',
          duration: 5000
        }
      );
      onApply();
    } catch (err: any) {
      const message = err.message || 'Unable to apply template';
      setError(message);
      notify(message, { 
        severity: 'error',
        title: '❌ Apply Failed'
      });
    } finally {
      setApplying(false);
    }
  };

  const handleManageTemplates = () => {
    navigate('/templates');
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <span>Apply Milestone Template</span>
          <IconButton
            size="small"
            onClick={handleManageTemplates}
            title="Manage Templates"
          >
            <SettingsIcon />
          </IconButton>
        </Stack>
      </DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        ) : templates.length === 0 ? (
          <Alert severity="info">No templates available</Alert>
        ) : (
          <List>
            {templates.map((template) => (
              <ListItem key={template.id} disablePadding>
                <ListItemButton
                  selected={selectedTemplateId === template.id}
                  onClick={() => setSelectedTemplateId(template.id)}
                >
                  <ListItemText
                    primary={template.template_name}
                    secondary={
                      <>
                        {template.project_type && (
                          <Typography variant="caption" display="block">
                            Type: {template.project_type}
                          </Typography>
                        )}
                        <Typography variant="caption" color="text.secondary">
                          {template.milestones.length} milestones
                        </Typography>
                      </>
                    }
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleApply}
          disabled={!selectedTemplateId || applying}
        >
          {applying ? 'Applying...' : 'Apply Template'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ApplyTemplateModal;

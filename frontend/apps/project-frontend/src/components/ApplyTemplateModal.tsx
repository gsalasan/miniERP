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
} from '@mui/material';
import { projectApi } from '../api/projectApi';
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

    try {
      setApplying(true);
      setError(null);
      await projectApi.applyMilestoneTemplate(projectId, selectedTemplateId);
      onApply();
    } catch (err: any) {
      setError(err.message || 'Failed to apply template');
    } finally {
      setApplying(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Apply Milestone Template</DialogTitle>
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

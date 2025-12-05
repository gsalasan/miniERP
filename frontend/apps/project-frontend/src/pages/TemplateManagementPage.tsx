import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  IconButton,
  Stack,
  Chip,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import { projectApi } from '../api/projectApi';
import { notify } from '../components/NotificationCenter';
import type { MilestoneTemplate } from '../types';
import TemplateFormModal from '../components/TemplateFormModal';

const TemplateManagementPage = () => {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<MilestoneTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<MilestoneTemplate | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<MilestoneTemplate | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [confirmEditOpen, setConfirmEditOpen] = useState(false);
  const [templateToEdit, setTemplateToEdit] = useState<MilestoneTemplate | null>(null);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await projectApi.getMilestoneTemplates();
      setTemplates(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load templates');
      notify('Unable to load templates. Please refresh the page.', { 
        severity: 'error',
        title: '⚠️ Loading Failed'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setSelectedTemplate(null);
    setFormModalOpen(true);
  };

  const handleEdit = (template: MilestoneTemplate) => {
    setTemplateToEdit(template);
    setConfirmEditOpen(true);
  };

  const handleEditConfirm = () => {
    if (templateToEdit) {
      setSelectedTemplate(templateToEdit);
      setFormModalOpen(true);
      setConfirmEditOpen(false);
      setTemplateToEdit(null);
    }
  };

  const handleDeleteClick = (template: MilestoneTemplate) => {
    setTemplateToDelete(template);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!templateToDelete) return;

    try {
      setDeleting(true);
      notify('Removing template from system...', { 
        severity: 'info',
        title: '🗑️ Deleting Template'
      });
      await projectApi.deleteMilestoneTemplate(templateToDelete.id);
      notify(
        `"${templateToDelete.template_name}" has been permanently removed`,
        { 
          severity: 'success',
          title: '🗑️ Template Deleted',
          duration: 5000
        }
      );
      fetchTemplates();
      setDeleteDialogOpen(false);
      setTemplateToDelete(null);
    } catch (err: any) {
      notify(err.message || 'Unable to delete template', { 
        severity: 'error',
        title: '❌ Delete Failed'
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleFormSuccess = (isEdit: boolean) => {
    setFormModalOpen(false);
    setSelectedTemplate(null);
    notify(
      isEdit 
        ? 'All changes have been saved successfully' 
        : 'Template is ready to use in your projects',
      { 
        severity: 'success',
        title: isEdit ? '✅ Template Updated' : '🎉 Template Created',
        duration: 5000
      }
    );
    fetchTemplates();
  };

  if (loading) {
    return (
      <MainLayout>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
          <IconButton onClick={() => navigate(-1)}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h5" sx={{ flexGrow: 1 }}>
            Milestone Templates
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreate}
          >
            Create Template
          </Button>
        </Stack>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Templates Grid */}
        {templates.length === 0 ? (
          <Alert severity="info">
            No templates available. Create your first template to get started.
          </Alert>
        ) : (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
                md: 'repeat(3, 1fr)',
              },
              gap: 2,
            }}
          >
            {templates.map((template) => (
              <Card key={template.id} variant="outlined">
                <CardContent>
                  <Stack spacing={2}>
                    {/* Template Name */}
                    <Typography variant="h6" noWrap>
                      {template.template_name}
                    </Typography>

                    {/* Project Type */}
                    {template.project_type && (
                      <Chip
                        label={template.project_type}
                        size="small"
                        color="primary"
                        sx={{ alignSelf: 'flex-start' }}
                      />
                    )}

                    {/* Milestones Count */}
                    <Typography variant="body2" color="text.secondary">
                      {template.milestones.length} milestone(s)
                    </Typography>

                    {/* Milestones List */}
                    <Box
                      sx={{
                        maxHeight: 120,
                        overflowY: 'auto',
                        borderLeft: 2,
                        borderColor: 'divider',
                        pl: 2,
                      }}
                    >
                      {template.milestones.map((milestone, index) => (
                        <Typography
                          key={index}
                          variant="caption"
                          display="block"
                          color="text.secondary"
                        >
                          {index + 1}. {milestone.name} ({milestone.duration_days} days)
                        </Typography>
                      ))}
                    </Box>

                    {/* Actions */}
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleEdit(template)}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeleteClick(template)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Box>
        )}

        {/* Form Modal */}
        <TemplateFormModal
          open={formModalOpen}
          onClose={() => {
            setFormModalOpen(false);
            setSelectedTemplate(null);
          }}
          onSuccess={handleFormSuccess}
          template={selectedTemplate}
        />

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
          <DialogTitle>Delete Template</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete the template "
              {templateToDelete?.template_name}"? This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button
              variant="contained"
              color="error"
              onClick={handleDeleteConfirm}
              disabled={deleting}
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Edit Confirmation Dialog */}
        <Dialog open={confirmEditOpen} onClose={() => setConfirmEditOpen(false)}>
          <DialogTitle>Edit Template</DialogTitle>
          <DialogContent>
            <Typography>
              Do you want to edit the template "{templateToEdit?.template_name}"?
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setConfirmEditOpen(false)}>Cancel</Button>
            <Button
              variant="contained"
              color="primary"
              onClick={handleEditConfirm}
            >
              Edit
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </MainLayout>
  );
};

export default TemplateManagementPage;

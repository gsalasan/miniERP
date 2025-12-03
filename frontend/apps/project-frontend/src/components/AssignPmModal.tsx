import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Avatar,
  Box,
  Typography,
} from '@mui/material';
import { projectApi } from '../api/projectApi';
import type { ProjectManager } from '../types';

interface AssignPmModalProps {
  open: boolean;
  onClose: () => void;
  projectId: string;
  projectName: string;
  onSuccess: () => void;
}

const AssignPmModal: React.FC<AssignPmModalProps> = ({
  open,
  onClose,
  projectId,
  projectName,
  onSuccess,
}) => {
  const [projectManagers, setProjectManagers] = useState<ProjectManager[]>([]);
  const [selectedPmId, setSelectedPmId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchingPMs, setFetchingPMs] = useState(false);

  useEffect(() => {
    if (open) {
      fetchProjectManagers();
    }
  }, [open]);

  const fetchProjectManagers = async () => {
    setFetchingPMs(true);
    setError(null);
    try {
      const pms = await projectApi.getProjectManagers();
      setProjectManagers(pms);
    } catch (err: any) {
      setError(
        err.response?.data?.message || 'Failed to fetch project managers'
      );
    } finally {
      setFetchingPMs(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedPmId) {
      setError('Please select a Project Manager');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await projectApi.assignPm(projectId, selectedPmId);
      onSuccess();
      handleClose();
    } catch (err: any) {
      setError(
        err.response?.data?.message || 'Failed to assign Project Manager'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setSelectedPmId('');
      setError(null);
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Tugaskan Project Manager</DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 2, mt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Proyek:
          </Typography>
          <Typography variant="body1" fontWeight={500}>
            {projectName}
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {fetchingPMs ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <FormControl fullWidth>
            <InputLabel id="pm-select-label">Project Manager</InputLabel>
            <Select
              labelId="pm-select-label"
              value={selectedPmId}
              onChange={(e) => setSelectedPmId(e.target.value)}
              label="Project Manager"
              disabled={loading}
            >
              {projectManagers.map((pm) => (
                <MenuItem key={pm.id} value={pm.id}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar
                      sx={{ width: 32, height: 32 }}
                      alt={pm.employee?.full_name || pm.email}
                    >
                      {(pm.employee?.full_name || pm.email)
                        .charAt(0)
                        .toUpperCase()}
                    </Avatar>
                    <Box>
                      <Typography variant="body2">
                        {pm.employee?.full_name || pm.email}
                      </Typography>
                      {pm.employee?.position && (
                        <Typography variant="caption" color="text.secondary">
                          {pm.employee.position}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Batal
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || !selectedPmId}
        >
          {loading ? <CircularProgress size={24} /> : 'Konfirmasi'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AssignPmModal;

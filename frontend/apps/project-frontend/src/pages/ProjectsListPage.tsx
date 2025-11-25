import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Tooltip,
  Avatar,
  Stack,
} from '@mui/material';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import MainLayout from '../layouts/MainLayout';
import { projectApi } from '../api/projectApi';
import type { Project } from '../types';

const ProjectsListPage: React.FC = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch projects (will show all including those with PM assigned)
      const data = await projectApi.getProjects();
      // Client-side filter for WON or projects with sales_orders (indicates they won)
      const wonProjects = data.filter(
        (p: Project) =>
          p.status === 'WON' ||
          p.status === 'Planning' ||
          p.status === 'New' ||
          (p.sales_orders && p.sales_orders.length > 0)
      );
      setProjects(wonProjects);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const statusMap: Record<
      string,
      | 'default'
      | 'primary'
      | 'secondary'
      | 'error'
      | 'info'
      | 'success'
      | 'warning'
    > = {
      New: 'primary',
      Planning: 'warning',
      'In Progress': 'info',
      Completed: 'success',
      'On Hold': 'error',
    };
    return statusMap[status] || 'default';
  };

  if (loading) {
    return (
      <MainLayout>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: 400,
          }}
        >
          <CircularProgress />
        </Box>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <Box sx={{ p: 3 }}>
          <Alert severity="error">{error}</Alert>
        </Box>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom fontWeight={700} sx={{ mb: 1 }}>
            Project Workspace
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Daftar proyek yang telah WON dan siap untuk di-handover ke Project
            Management
          </Typography>
        </Box>

        {projects.length === 0 ? (
          <Alert severity="info" sx={{ borderRadius: 2 }}>
            Belum ada proyek dengan status WON
          </Alert>
        ) : (
          <TableContainer
            component={Paper}
            elevation={0}
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
              overflow: 'hidden',
            }}
          >
            <Table sx={{ minWidth: 900 }}>
              <TableHead>
                <TableRow
                  sx={{
                    bgcolor: 'grey.50',
                    '& th': {
                      fontWeight: 700,
                      fontSize: '0.875rem',
                      color: 'text.primary',
                      py: 2,
                    },
                  }}
                >
                  <TableCell>No. Proyek</TableCell>
                  <TableCell>Nama Proyek</TableCell>
                  <TableCell>Pelanggan</TableCell>
                  <TableCell align="center">Status</TableCell>
                  <TableCell>Project Manager</TableCell>
                  <TableCell align="right">Nilai Kontrak</TableCell>
                  <TableCell align="center">Aksi</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {projects.map((project) => {
                  const contractValue =
                    project.sales_orders?.[0]?.contract_value ||
                    project.contract_value ||
                    0;

                  return (
                    <TableRow
                      key={project.id}
                      hover
                      sx={{
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        '&:hover': {
                          bgcolor: 'action.hover',
                        },
                        '& td': {
                          py: 2,
                        },
                      }}
                      onClick={() => navigate(`/projects/${project.id}`)}
                    >
                      <TableCell>
                        <Typography
                          variant="body2"
                          fontFamily="monospace"
                          fontWeight={700}
                          color="primary.main"
                          sx={{ fontSize: '0.875rem' }}
                        >
                          {project.project_number}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        <Typography
                          variant="body2"
                          fontWeight={600}
                          sx={{ fontSize: '0.875rem' }}
                        >
                          {project.project_name}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        <Typography
                          variant="body2"
                          sx={{ fontSize: '0.875rem' }}
                        >
                          {project.customer?.customer_name || '-'}
                        </Typography>
                      </TableCell>

                      <TableCell align="center">
                        <Chip
                          label={project.status}
                          color={getStatusColor(project.status)}
                          size="small"
                          sx={{ fontWeight: 600, minWidth: 80 }}
                        />
                      </TableCell>

                      <TableCell>
                        {project.pm_user ? (
                          <Stack
                            direction="row"
                            spacing={1}
                            alignItems="center"
                          >
                            <Avatar
                              sx={{
                                width: 28,
                                height: 28,
                                bgcolor: 'primary.main',
                                fontSize: '0.75rem',
                              }}
                            >
                              <PersonOutlineIcon sx={{ fontSize: 16 }} />
                            </Avatar>
                            <Typography
                              variant="body2"
                              sx={{ fontSize: '0.875rem' }}
                            >
                              {project.pm_user.employee?.full_name ||
                                project.pm_user.email}
                            </Typography>
                          </Stack>
                        ) : (
                          <Chip
                            label="Belum ditugaskan"
                            size="small"
                            color="warning"
                            variant="outlined"
                            sx={{ fontWeight: 600 }}
                          />
                        )}
                      </TableCell>

                      <TableCell align="right">
                        <Typography
                          variant="body2"
                          fontWeight={700}
                          color="success.main"
                          sx={{ fontSize: '0.875rem' }}
                        >
                          Rp {Number(contractValue).toLocaleString('id-ID')}
                        </Typography>
                      </TableCell>

                      <TableCell align="center">
                        <Tooltip title="Lihat Detail">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/projects/${project.id}`);
                            }}
                          >
                            <VisibilityOutlinedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>
    </MainLayout>
  );
};

export default ProjectsListPage;

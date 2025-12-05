import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Avatar,
  Stack,
  Paper,
} from '@mui/material';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';

interface ProjectRow {
  id: string;
  project_number?: string;
  project_name: string;
  pm_user?: { employee?: { full_name?: string }; email?: string } | null;
  customer?: { customer_name?: string } | null;
  progress?: number;
  margin?: number;
  status?: string;
  contract_value?: number;
  sales_orders?: { contract_value?: number }[];
}

interface Props {
  rows: ProjectRow[];
}

const ProjectsDataGrid: React.FC<Props> = ({ rows }) => {
  const navigate = useNavigate();
  
  const getStatusColor = (status?: string): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' => {
    const statusMap: Record<string, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
      'New': 'primary',
      'Planning': 'warning',
      'PLANNING': 'warning',
      'In Progress': 'info',
      'IN_PROGRESS': 'info',
      'InProgress': 'info',
      'INPROGRESS': 'info',
      'Completed': 'success',
      'COMPLETED': 'success',
      'On Hold': 'error',
      'WON': 'success',
    };
    return statusMap[status || ''] || 'default';
  };

  return (
    <Box>
      <Typography variant="subtitle1" gutterBottom fontWeight={600}>
        Daftar Proyek Aktif
      </Typography>
      <TableContainer
        component={Paper}
        elevation={0}
        sx={{
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
          overflow: 'hidden',
          maxHeight: 600,
        }}
      >
        <Table sx={{ minWidth: 900 }} stickyHeader>
          <TableHead>
            <TableRow
              sx={{
                bgcolor: 'grey.50',
                '& th': {
                  fontWeight: 700,
                  fontSize: '0.875rem',
                  color: 'text.primary',
                  py: 2,
                  bgcolor: 'grey.50',
                },
              }}
            >
              <TableCell>No. Proyek</TableCell>
              <TableCell>Nama Proyek</TableCell>
              <TableCell>Pelanggan</TableCell>
              <TableCell align="center">Status</TableCell>
              <TableCell>Project Manager</TableCell>
              <TableCell align="right">Progress</TableCell>
              <TableCell align="right">Margin</TableCell>
              <TableCell align="right">Nilai Kontrak</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                  <Typography color="text.secondary">
                    Tidak ada data proyek
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              rows.map((project) => {
                const contractValue =
                  project.sales_orders?.[0]?.contract_value ?? project.contract_value ?? 0;

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
                    onClick={() => navigate(`/projects/${project.id}/dashboard`)}
                  >
                    <TableCell>
                      <Typography
                        variant="body2"
                        fontFamily="monospace"
                        fontWeight={700}
                        color="primary.main"
                        sx={{ fontSize: '0.875rem' }}
                      >
                        {project.project_number || '-'}
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
                        label={project.status || 'Unknown'}
                        color={getStatusColor(project.status)}
                        size="small"
                        sx={{ fontWeight: 600, minWidth: 100 }}
                      />
                    </TableCell>

                    <TableCell>
                      {project.pm_user ? (
                        <Stack direction="row" spacing={1} alignItems="center">
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
                        fontWeight={600}
                        sx={{ fontSize: '0.875rem' }}
                      >
                        {Number(project.progress || 0).toFixed(0)}%
                      </Typography>
                    </TableCell>

                    <TableCell align="right">
                      <Typography
                        variant="body2"
                        fontWeight={600}
                        color={Number(project.margin || 0) >= 0 ? 'success.main' : 'error.main'}
                        sx={{ fontSize: '0.875rem' }}
                      >
                        {Number(project.margin || 0).toFixed(2)}%
                      </Typography>
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
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default ProjectsDataGrid;

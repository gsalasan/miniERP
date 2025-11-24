import React from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Chip,
  Stack,
  Divider,
  Card,
  CardContent,
} from '@mui/material';
import BusinessIcon from '@mui/icons-material/Business';
import PersonIcon from '@mui/icons-material/Person';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import DescriptionIcon from '@mui/icons-material/Description';
import type { Project } from '../types';

interface ProjectOverviewTabProps {
  project: Project;
}

const ProjectOverviewTab: React.FC<ProjectOverviewTabProps> = ({ project }) => {
  // Use same contract value calculation as header for consistency
  const contractValue = project.sales_orders?.[0]?.contract_value ?? project.contract_value ?? 0;

  const InfoCard = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number | React.ReactNode }) => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Stack spacing={1}>
          <Box sx={{ display: 'flex', alignItems: 'center', color: 'primary.main' }}>
            {icon}
            <Typography variant="caption" sx={{ ml: 1, color: 'text.secondary' }}>
              {label}
            </Typography>
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            {value}
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  );

  return (
    <Box>
      {/* Project Basic Info */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
          Informasi Proyek
        </Typography>
        <Divider sx={{ mb: 2 }} />
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <InfoCard
              icon={<BusinessIcon />}
              label="Customer"
              value={project.customer?.customer_name || 'N/A'}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <InfoCard
              icon={<PersonIcon />}
              label="Project Manager"
              value={
                project.pm_user ? (
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography>{project.pm_user.employee?.full_name || project.pm_user.email}</Typography>
                    {project.pm_user.roles && project.pm_user.roles.includes('PROJECT_MANAGER') && (
                      <Chip label="PM" size="small" color="primary" />
                    )}
                  </Stack>
                ) : (
                  <Chip label="Belum Ditugaskan" size="small" color="warning" />
                )
              }
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <InfoCard
              icon={<PersonIcon />}
              label="Sales"
              value={project.sales_user?.employee?.full_name || project.sales_user?.email || 'N/A'}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <InfoCard
              icon={<AttachMoneyIcon />}
              label="Nilai Kontrak"
              value={
                contractValue > 0
                  ? `Rp ${Number(contractValue).toLocaleString('id-ID')}`
                  : 'Belum Ditentukan'
              }
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <InfoCard
              icon={<CalendarTodayIcon />}
              label="Tanggal Dibuat"
              value={new Date(project.created_at).toLocaleDateString('id-ID', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <InfoCard
              icon={<CalendarTodayIcon />}
              label="Target Selesai"
              value={
                project.expected_close_date
                  ? new Date(project.expected_close_date).toLocaleDateString('id-ID', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })
                  : 'Belum Ditentukan'
              }
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Project Description */}
      {project.description && (
        <Paper sx={{ p: 3 }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
            <DescriptionIcon color="action" />
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              Deskripsi Proyek
            </Typography>
          </Stack>
          <Divider sx={{ mb: 2 }} />
          <Typography variant="body1" color="text.secondary" sx={{ whiteSpace: 'pre-wrap' }}>
            {project.description}
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default ProjectOverviewTab;

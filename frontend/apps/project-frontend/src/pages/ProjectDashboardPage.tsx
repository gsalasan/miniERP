import React from 'react';
import { useParams } from 'react-router-dom';
import { Container, Grid, CircularProgress, Box, Alert, Typography, Chip, Paper, Stack, Divider } from '@mui/material';
import useProjectDashboard from '../hooks/useProjectDashboard';
import ProjectHealthCard from '../components/dashboard/ProjectHealthCard';
import BudgetChart from '../components/dashboard/BudgetChart';
import MilestoneTimeline from '../components/dashboard/MilestoneTimeline';
import UrgentTasksList from '../components/dashboard/UrgentTasksList';
import MainLayout from '../layouts/MainLayout';
import SectionCard from '../components/ui/SectionCard';

const ProjectDashboardPage: React.FC = () => {
  const { projectId } = useParams();
  const { data, isLoading, error } = useProjectDashboard(projectId as string);

  if (isLoading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}><CircularProgress /></Box>;
  if (error) return <Container><Alert severity="error">Failed to load dashboard</Alert></Container>;

  const payload = data || {};
  const d = payload;

  return (
    <MainLayout>
      <Container maxWidth="lg" sx={{ py: 3 }}>

        {/* Project header / hero */}
        {d.project ? (
          <Paper sx={{ mb: 3, overflow: 'hidden', borderRadius: 2, boxShadow: 3 }}>
            <Box sx={{ display: 'flex', p: { xs: 2, sm: 3 }, bgcolor: 'background.paper', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 800 }}>{d.project.project_name}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{d.project.customer?.company_name || d.project.customer?.name || ''}</Typography>
                <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                  <Chip label={d.project.status || 'N/A'} color="primary" variant="filled" size="small" sx={{ fontWeight: 700 }} />
                  <Typography variant="caption" color="text.secondary" sx={{ alignSelf: 'center' }}>{d.project.start_date ? new Date(d.project.start_date).toLocaleDateString() : ''} — {d.project.end_date ? new Date(d.project.end_date).toLocaleDateString() : ''}</Typography>
                </Stack>
              </Box>

              <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Paper sx={{ px: 2, py: 1.2, borderRadius: 2, textAlign: 'center' }}>
                    <Typography variant="caption" color="text.secondary">Estimated HPP</Typography>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, mt: 0.5 }}>{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(d.project?.estimated_hpp ?? d.estimated_hpp ?? 0)}</Typography>
                  </Paper>
                  <Paper sx={{ px: 2, py: 1.2, borderRadius: 2, textAlign: 'center' }}>
                    <Typography variant="caption" color="text.secondary">Actual Cost</Typography>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, mt: 0.5 }}>{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(d.project?.actual_cost ?? d.actual_cost ?? 0)}</Typography>
                  </Paper>
                </Box>
                <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
                <Box sx={{ textAlign: 'center', px: 2 }}>
                  <Typography variant="caption" color="text.secondary">Progress</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 800 }}>{Number(d.overallProgress || 0).toFixed(0)}%</Typography>
                </Box>
              </Stack>
            </Box>
          </Paper>
        ) : (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h5" gutterBottom>Project Dashboard</Typography>
          </Box>
        )}

        <Grid container spacing={3} alignItems="stretch">
          <Grid item xs={12} md={7}>
            <SectionCard title="Project Health" sx={{ minHeight: 240 }}>
              <ProjectHealthCard timelineStatus={d.timelineStatus} budgetStatus={d.budgetStatus} overallProgress={d.overallProgress} budgetUsedPercentage={d.budgetUsedPercentage} />
            </SectionCard>
          </Grid>

          <Grid item xs={12} md={5}>
            <SectionCard title="Budget" sx={{ minHeight: 240 }}>
              <BudgetChart estimated={d.project?.estimated_hpp ?? d.estimated_hpp} actual={d.project?.actual_cost ?? d.actual_cost} />
            </SectionCard>
          </Grid>

          <Grid item xs={12} md={8}>
            <SectionCard title="Milestones" sx={{ minHeight: 220 }}>
              <MilestoneTimeline milestones={d.milestones || []} />
            </SectionCard>
          </Grid>

          <Grid item xs={12} md={4}>
            <SectionCard title="Urgent Tasks" sx={{ minHeight: 220 }}>
              <UrgentTasksList tasks={d.urgentTasks || []} />
            </SectionCard>
          </Grid>
        </Grid>
      </Container>
    </MainLayout>
  );
};

export default ProjectDashboardPage;

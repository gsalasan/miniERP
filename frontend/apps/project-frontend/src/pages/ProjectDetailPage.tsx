import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Paper,
  Tabs,
  Tab,
  Breadcrumbs,
  Link,
  Chip,
} from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import HomeIcon from '@mui/icons-material/Home';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import DashboardIcon from '@mui/icons-material/Dashboard';
import TimelineIcon from '@mui/icons-material/Timeline';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import DescriptionIcon from '@mui/icons-material/Description';
import AssessmentIcon from '@mui/icons-material/Assessment';
import GroupIcon from '@mui/icons-material/Group';
import { projectApi } from '../api/projectApi';
import AssignPmModal from '../components/AssignPmModal';
import BoqVsBomTab from '../components/BoqVsBomTab';
import ProjectOverviewTab from '../components/ProjectOverviewTab';
import MainLayout from '../layouts/MainLayout';
import type { Project } from '../types';
import { useAuth } from '../contexts/AuthContext';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`project-tabpanel-${index}`}
      aria-labelledby={`project-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const ProjectDetailPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { user, canAssignPm, canEditBom: canEditBomFromAuth } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTab, setCurrentTab] = useState(0);
  const [assignPmModalOpen, setAssignPmModalOpen] = useState(false);

  useEffect(() => {
    if (projectId) {
      fetchProject();
    }
  }, [projectId]);

  const fetchProject = async () => {
    if (!projectId) return;

    setLoading(true);
    setError(null);

    try {
      const data = await projectApi.getProject(projectId);
      setProject(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load project');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  const handleAssignPmSuccess = () => {
    fetchProject();
    setAssignPmModalOpen(false);
  };

  const handleBomSaved = () => {
    fetchProject();
  };

  // Permission check - PM can edit BOM
  const canEditBom = project?.pm_user_id === user?.id;

  if (loading) {
    return (
      <MainLayout>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
          <CircularProgress />
        </Box>
      </MainLayout>
    );
  }

  if (error || !project) {
    return (
      <MainLayout>
        <Box>
          <Alert severity="error">{error || 'Project not found'}</Alert>
        </Box>
      </MainLayout>
    );
  }

  const latestEstimation = project.estimations && project.estimations.length > 0
    ? project.estimations[project.estimations.length - 1]
    : null;

  const estimationItems = latestEstimation?.items || [];
  const bomItems = project.project_boms || [];
  const contractValue = (project.sales_orders?.[0]?.contract_value ?? project.contract_value ?? 0);

  return (
    <MainLayout>
      <Box sx={{ maxWidth: 1400 }}>
        {/* Breadcrumb */}
        <Breadcrumbs
          separator={<NavigateNextIcon fontSize="small" />}
          sx={{ mb: 3 }}
        >
          <Link
            underline="hover"
            sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
            color="inherit"
            onClick={() => navigate('/')}
          >
            <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
            Proyek
          </Link>
          <Typography color="text.primary" fontWeight={600}>
            {project.project_number}
          </Typography>
        </Breadcrumbs>

        {/* Page Header */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            mb: 3,
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2 }}>
            <Box sx={{ flex: 1 }}>
              {/* Title with Project Number and Status */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1, flexWrap: 'wrap' }}>
                <Typography variant="h4" fontWeight={700}>
                  {project.project_number} - {project.project_name}
                </Typography>
                <Chip 
                  label={project.status || 'New'} 
                  color={project.status === 'Planning' ? 'primary' : project.status === 'WON' ? 'success' : 'default'}
                  sx={{ fontWeight: 600 }}
                />
                {project.customer && (
                  <Chip 
                    label={project.customer.customer_name} 
                    variant="outlined"
                    sx={{ fontWeight: 500 }}
                  />
                )}
              </Box>
              {project.description && (
                <Typography variant="body1" color="text.secondary" sx={{ mb: 2, lineHeight: 1.6 }}>
                  {project.description}
                </Typography>
              )}
              
              {/* Project Meta Info */}
              <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                {project.sales_user && (
                  <Box>
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                      Sales PIC
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {project.sales_user.employee?.full_name || project.sales_user.email}
                    </Typography>
                  </Box>
                )}
                
                <Box>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                    Project Manager
                  </Typography>
                  {project.pm_user ? (
                    <Typography variant="body2" fontWeight={600}>
                      {project.pm_user.employee?.full_name || project.pm_user.email}
                    </Typography>
                  ) : (
                    <Typography variant="body2" color="warning.main" fontWeight={600}>
                      Belum Ditugaskan
                    </Typography>
                  )}
                </Box>
                
                <Box>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                    Nilai Kontrak (SO)
                  </Typography>
                  <Typography variant="body2" fontWeight={700} color="success.main">
                    Rp {Number(contractValue).toLocaleString('id-ID')}
                  </Typography>
                </Box>
              </Box>
            </Box>

            {!project.pm_user && canAssignPm() && (
              <Button
                variant="contained"
                startIcon={<PersonAddIcon />}
                onClick={() => setAssignPmModalOpen(true)}
                size="large"
                sx={{ flexShrink: 0 }}
              >
                Tugaskan PM
              </Button>
            )}
          </Box>
        </Paper>

        {/* Tabs */}
        <Paper
          elevation={0}
          sx={{
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
            overflow: 'hidden',
          }}
        >
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs
              value={currentTab}
              onChange={handleTabChange}
              variant="scrollable"
              scrollButtons="auto"
              sx={{
                minHeight: 64,
                '& .MuiTab-root': {
                  minHeight: 64,
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  textTransform: 'none',
                  '&.Mui-selected': {
                    color: 'primary.main',
                  },
                },
                '& .MuiTabs-indicator': {
                  height: 3,
                },
              }}
            >
              <Tab icon={<DashboardIcon />} iconPosition="start" label="Ringkasan" />
              <Tab icon={<TimelineIcon />} iconPosition="start" label="Timeline & Tugas" />
              <Tab icon={<CompareArrowsIcon />} iconPosition="start" label="BoQ vs. BoM" />
              <Tab icon={<DescriptionIcon />} iconPosition="start" label="Dokumen" />
              <Tab icon={<AssessmentIcon />} iconPosition="start" label="Laporan" />
              <Tab icon={<GroupIcon />} iconPosition="start" label="Tim & Kinerja" />
            </Tabs>
          </Box>

          {/* Tab Panels */}
          <Box sx={{ p: 3 }}>
            <TabPanel value={currentTab} index={0}>
              <ProjectOverviewTab project={project} />
            </TabPanel>

            <TabPanel value={currentTab} index={1}>
              <Alert severity="info">
                Fitur timeline dan tugas sedang dalam pengembangan
              </Alert>
            </TabPanel>

            <TabPanel value={currentTab} index={2}>
              <BoqVsBomTab
                projectId={project.id}
                estimationItems={estimationItems}
                existingBomItems={bomItems}
                onBomSaved={handleBomSaved}
                canEdit={canEditBom}
                projectStatus={project.status}
              />
            </TabPanel>

            <TabPanel value={currentTab} index={3}>
              <Alert severity="info">
                Fitur dokumen sedang dalam pengembangan
              </Alert>
            </TabPanel>

            <TabPanel value={currentTab} index={4}>
              <Alert severity="info">
                Fitur laporan sedang dalam pengembangan
              </Alert>
            </TabPanel>

            <TabPanel value={currentTab} index={5}>
              <Alert severity="info">
                Fitur tim & kinerja sedang dalam pengembangan
              </Alert>
            </TabPanel>
          </Box>
        </Paper>

        {/* Assign PM Modal */}
        <AssignPmModal
          open={assignPmModalOpen}
          onClose={() => setAssignPmModalOpen(false)}
          projectId={project.id}
          projectName={project.project_name}
          onSuccess={handleAssignPmSuccess}
        />
      </Box>
    </MainLayout>
  );
};

export default ProjectDetailPage;

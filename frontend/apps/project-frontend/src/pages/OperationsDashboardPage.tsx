import React, { useEffect, useState } from 'react';
import { Container, Grid, Box, CircularProgress, Alert, MenuItem, Select, FormControl, InputLabel, Typography, Paper, Stack, Avatar } from '@mui/material';
import AssessmentIcon from '@mui/icons-material/Assessment';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import PeopleIcon from '@mui/icons-material/People';
import useOperationsDashboard from '../hooks/useOperationsDashboard';
import { projectApi } from '../api/projectApi';
import PortfolioHealthDonut from '../components/dashboard/PortfolioHealthDonut';
import ProjectsDataGrid from '../components/dashboard/ProjectsDataGrid';
import VendorPerformanceTable from '../components/dashboard/VendorPerformanceTable';
import TeamUtilizationChart from '../components/dashboard/TeamUtilizationChart';
import MainLayout from '../layouts/MainLayout';
import SectionCard from '../components/ui/SectionCard';

const OperationsDashboardPage: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [period, setPeriod] = useState<string>('this_quarter');

  // Fetch canonical projects list (same source as Project Workspace) so
  // the Projects grid shows the exact same fields (customer, pm_user, etc).
  const [fetchedProjects, setFetchedProjects] = useState<any[] | null>(null);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [projectsError, setProjectsError] = useState<string | null>(null);

  // Helper: map UI status filter to API filter set we want to show
  const statusesFromWonOnwards = ['WON', 'IN_PROGRESS', 'COMPLETED'];
  const mapStatusFilterToSet = (sf: string) => {
    switch (sf) {
      case 'InProgress':
        return ['IN_PROGRESS'];
      case 'Completed':
        return ['COMPLETED'];
      case 'All':
      default:
        return statusesFromWonOnwards;
    }
  };

  // Normalize canonical project objects to include workspace fields
  const normalizeWorkspaceProject = (p: any) => {
    if (!p) return p;
    const project_number = p.project_number || p.projectNo || p.project_no || p.number || p.code || '';
    const project_name = p.project_name || p.name || p.title || p.nama || '';

    // customer can be object or a plain string in different backends
    let customer: any = null;
    if (p.customer && typeof p.customer === 'object') customer = p.customer;
    else if (p.customer && typeof p.customer === 'string') customer = { customer_name: p.customer };
    else if (p.client && typeof p.client === 'string') customer = { customer_name: p.client };
    else if (p.customer_name) customer = { customer_name: p.customer_name };
    else if (p.client_name) customer = { customer_name: p.client_name };

    const sales_orders = p.sales_orders || p.salesOrders || (p.contract_value ? [{ contract_value: p.contract_value }] : []);
    const contract_value = p.contract_value || (Array.isArray(sales_orders) && sales_orders[0]?.contract_value) || 0;

    // pm_user can be object, id, or just name/email fields
    let pm_user: any = null;
    if (p.pm_user && typeof p.pm_user === 'object') pm_user = p.pm_user;
    else if (p.project_manager && typeof p.project_manager === 'object') pm_user = p.project_manager;
    else if (p.pm && typeof p.pm === 'object') pm_user = p.pm;
    else {
      // try building from separate fields
      const pmName = p.pm_name || p.pm_full_name || p.project_manager_name || p.manager_name || p.owner_name || p.owner;
      const pmEmail = p.pm_email || p.project_manager_email || p.owner_email;
      if (pmName || pmEmail) {
        pm_user = { employee: { full_name: pmName || pmEmail || '' }, email: pmEmail || undefined };
      }
    }
    return {
      ...p,
      project_number,
      project_name,
      name: project_name,
      customer,
      sales_orders,
      contract_value,
      pm_user,
    };
  };

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setProjectsLoading(true);
      setProjectsError(null);
      try {
        // Request canonical projects and filter client-side so we always
        // render exactly the same fields as Project Workspace.
        const list = await projectApi.getProjects();
        if (!mounted) return;

        // Debug: show first few items returned by projectApi
        if (import.meta.env.DEV) {
          try {
            // eslint-disable-next-line no-console
            console.debug('[OperationsDashboard] canonical projects list (sample 5):', (list || []).slice(0, 5));
          } catch (e) {}
        }

        const wanted = mapStatusFilterToSet(statusFilter);
        const filtered = (list || []).filter((p: any) => {
          const st = String(p.status || p.state || '').toUpperCase();
          const hasPm = !!(p.pm_user || p.project_manager || p.pm || p.pm_user_id || p.pmUserId || p.pm_userid);
          return hasPm || wanted.includes(st);
        });

        // If projects include only pm_user_id references, fetch managers to populate pm_user objects
        const needsPmLookup = filtered.some((p: any) => !p.pm_user && (p.pm_user_id || p.pmUserId || p.pm_userid));
        let managersMap: Record<string, any> = {};
        if (needsPmLookup) {
          try {
            const managers = await projectApi.getProjectManagers();
            if (Array.isArray(managers)) {
              managers.forEach((m: any) => {
                if (m.id) managersMap[String(m.id)] = m;
                if (m.userId) managersMap[String(m.userId)] = m;
                if (m.user_id) managersMap[String(m.user_id)] = m;
              });
            }
          } catch (e) {
            // ignore manager lookup errors
          }
        }

        const filled = filtered.map((p: any) => {
          // attach pm_user object if we found a manager by id
          if (!p.pm_user && (p.pm_user_id || p.pmUserId || p.pm_userid)) {
            const key = String(p.pm_user_id || p.pmUserId || p.pm_userid);
            if (managersMap[key]) p.pm_user = managersMap[key];
          }
          // sometimes pm_user is an id string
          if (p.pm_user && typeof p.pm_user !== 'object') {
            const key = String(p.pm_user);
            if (managersMap[key]) p.pm_user = managersMap[key];
          }
          return normalizeWorkspaceProject(p);
        });

        if (import.meta.env.DEV) {
          try {
            // eslint-disable-next-line no-console
            console.debug('[OperationsDashboard] fetchedProjects after normalization (sample 5):', (filled || []).slice(0,5));
          } catch (e) {}
        }

        setFetchedProjects(filled);
      } catch (err: any) {
        if (!mounted) return;
        setProjectsError(err?.message || 'Failed to load projects');
        setFetchedProjects([]);
      } finally {
        if (!mounted) return;
        setProjectsLoading(false);
      }
    };

    load();
    return () => { mounted = false; };
  }, [period, statusFilter]);

  const { data, isLoading, error } = useOperationsDashboard({ period });

  // Always log the raw query response early so it is visible even when
  // DevTools filters out debug-level logs. This helps confirm whether the
  // backend returned `customer` on each project in `projectList`.
  // eslint-disable-next-line no-console
  console.log('useOperationsDashboard result:', { data, isLoading, error });

  if (isLoading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}><CircularProgress /></Box>;
  if (error) return (
    <Container>
      <Alert severity="error">{(error as any)?.message || 'Failed to load operations dashboard'}</Alert>
    </Container>
  );

  const payload = data || {};

  // Debug: print payload to console so we can inspect returned project objects
  // (helps verify whether `customer` is present on each project)
  // Remove this after troubleshooting.
  // eslint-disable-next-line no-console
  console.debug('Operations dashboard payload:', payload);
  const fmtCurr = (v: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(v || 0);

  return (
    <MainLayout>
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Paper elevation={1} sx={{ p: 2, mb: 3, borderRadius: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>Operational Dashboard</Typography>
              <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                <FormControl size="small" sx={{ minWidth: 180 }}>
                  <InputLabel>Status</InputLabel>
                  <Select value={statusFilter} label="Status" onChange={(e) => setStatusFilter(String(e.target.value))}>
                    <MenuItem value="All">Semua</MenuItem>
                    <MenuItem value="InProgress">In Progress</MenuItem>
                    <MenuItem value="Completed">Completed</MenuItem>
                  </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 180 }}>
                  <InputLabel>Periode</InputLabel>
                  <Select value={period} label="Periode" onChange={(e) => setPeriod(String(e.target.value))}>
                    <MenuItem value="this_month">Bulan Ini</MenuItem>
                    <MenuItem value="this_quarter">Kuartal Ini</MenuItem>
                    <MenuItem value="this_year">Tahun Ini</MenuItem>
                  </Select>
                </FormControl>
              </Stack>
            </Box>

            <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
              <Paper sx={{ px: 2, py: 1, display: 'flex', alignItems: 'center', gap: 1, borderRadius: 2 }}>
                <Avatar sx={{ bgcolor: 'primary.main' }}><PeopleIcon /></Avatar>
                <Box>
                  <Typography variant="caption" color="text.secondary">Total Proyek Aktif</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>{payload.totalActiveProjects ?? 0}</Typography>
                </Box>
              </Paper>

              <Paper sx={{ px: 2, py: 1, display: 'flex', alignItems: 'center', gap: 1, borderRadius: 2 }}>
                <Avatar sx={{ bgcolor: 'success.main' }}><MonetizationOnIcon /></Avatar>
                <Box>
                  <Typography variant="caption" color="text.secondary">Total Nilai Kontrak</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>{fmtCurr(payload.totalContractValue || 0)}</Typography>
                </Box>
              </Paper>

              <Paper sx={{ px: 2, py: 1, display: 'flex', alignItems: 'center', gap: 1, borderRadius: 2 }}>
                <Avatar sx={{ bgcolor: 'warning.main' }}><AssessmentIcon /></Avatar>
                <Box>
                  <Typography variant="caption" color="text.secondary">Rata-rata Margin</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>{Number(payload.averageMargin || 0).toFixed(2)}%</Typography>
                </Box>
              </Paper>
            </Stack>
          </Box>
        </Paper>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <SectionCard title="Portfolio Health">
              <PortfolioHealthDonut onTrack={payload.portfolioHealth?.onTrack} atRisk={payload.portfolioHealth?.atRisk} overdue={payload.portfolioHealth?.overdue} />
            </SectionCard>
          </Grid>

          <Grid item xs={12} md={6}>
            <SectionCard title="Vendors">
              <VendorPerformanceTable rows={payload.vendorPerformance || []} />
            </SectionCard>
          </Grid>

          <Grid item xs={12}>
            <SectionCard title="Projects">
              {projectsLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress size={28} /></Box>
              ) : projectsError ? (
                <Alert severity="warning">{projectsError}</Alert>
              ) : (
                // prefer fetched canonical projects; fallback to operations payload
                <ProjectsDataGrid rows={fetchedProjects && fetchedProjects.length ? fetchedProjects : (payload.projectList || [])} />
              )}
            </SectionCard>
          </Grid>

          <Grid item xs={12} md={6}>
            <SectionCard title="Team Utilization">
              <TeamUtilizationChart rows={(payload.teamUtilization || []).map((r:any)=>({ assigneeName: r.assigneeName, value: r.hours || r.count || 0 }))} />
            </SectionCard>
          </Grid>
        </Grid>
      </Container>
    </MainLayout>
  );
};

export default OperationsDashboardPage;

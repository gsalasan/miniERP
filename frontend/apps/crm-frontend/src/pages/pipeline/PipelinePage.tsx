import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Alert,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
import {
  Refresh as RefreshIcon,
  Add as AddIcon,
  TrendingUp as TrendingUpIcon,
  Assessment as AssessmentIcon,
  AccountCircle as AccountCircleIcon,
} from '@mui/icons-material';
// Removed stray CircularProgress token and unused navigate import
import {
  Pipeline,
  Project,
  PipelineResponse,
  CreateProjectRequest,
  ProjectStatus,
} from '../../types/pipeline';
import { pipelineApi } from '../../api/pipeline';
import { usersApi, SalesUserOption } from '../../api/users';
import KanbanBoard from '../../components/pipeline/KanbanBoard';
import ProjectDetailModal from '../../components/pipeline/ProjectDetailModal';
import AddOpportunityModal from '../../components/pipeline/AddOpportunityModal';
import { useAuth } from '../../contexts/AuthContext';

const PipelinePage: React.FC = () => {
  const { user, logout } = useAuth();
  // Roles allowed to manage boards (includes SALES)
  const BOARD_MANAGE_ROLES = [
    'CEO',
    'SALES_MANAGER',
    'ADMIN',
    'SYSTEM_ADMIN',
    'SUPER_ADMIN',
    'SALES',
  ];
  // Roles allowed to see the Sales Person filter (exclude plain SALES users)
  const SALES_FILTER_ROLES = ['CEO', 'SALES_MANAGER', 'ADMIN', 'SYSTEM_ADMIN', 'SUPER_ADMIN'];

  const canManageBoards = !!user?.roles?.some((r) => BOARD_MANAGE_ROLES.includes(r));
  const canSeeSalesFilter = !!user?.roles?.some((r) => SALES_FILTER_ROLES.includes(r));
  const [pipeline, setPipeline] = useState<Pipeline>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [totalOpportunities, setTotalOpportunities] = useState(0);
  const [totalValue, setTotalValue] = useState(0);
  // CEO default to 'all' to see all opportunities
  const isCEO = user?.roles?.includes('CEO') || false;
  const [selectedSalesUser, setSelectedSalesUser] = useState<string>(
    isCEO ? 'all' : user?.id || 'all',
  );
  const [salesUsers, setSalesUsers] = useState<SalesUserOption[]>([
    {
      id: 'all',
      name: 'Semua Sales',
    },
  ]);
  const [salesLoading, setSalesLoading] = useState<boolean>(false);
  const [salesError, setSalesError] = useState<string>('');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [addOpportunityOpen, setAddOpportunityOpen] = useState(false);
  const [submittingNewOpportunity, setSubmittingNewOpportunity] = useState(false);

  // Load sales users from HR service via usersApi and filter for SALES / SALES_MANAGER
  type BoardMeta = {
    status: string;
    title?: string;
    description?: string;
    color?: string;
  };
  const COLOR_PALETTE = [
    '#1976D2',
    '#0288D1',
    '#7B1FA2',
    '#D81B60',
    '#00897B',
    '#2E7D32',
    '#F57C00',
    '#EF6C00',
    '#455A64',
    '#6D4C41',
  ];
  const pickRandomColor = (used: string[] = []) => {
    const candidates = COLOR_PALETTE.filter((c) => !used.includes(c));
    const pool = candidates.length ? candidates : COLOR_PALETTE;
    return pool[Math.floor(Math.random() * pool.length)];
  };
  const RESERVED_STATUSES = ['PROSPECT', 'MEETING_SCHEDULED', 'PRE_SALES', 'PROPOSAL_DELIVERED', 'WON', 'LOST'];
  const [boards, setBoards] = useState<BoardMeta[]>(() => {
    // New structure
    const savedBoards = localStorage.getItem('pipeline_boards');
    if (savedBoards) {
      try {
        const parsed = JSON.parse(savedBoards) as BoardMeta[];
        // Auto-add WON and LOST if they don't exist
        const hasWon = parsed.some(b => b.status === 'WON');
        const hasLost = parsed.some(b => b.status === 'LOST');
        
        if (!hasWon || !hasLost) {
          const usedColors = parsed.map(b => b.color || '');
          if (!hasWon) {
            parsed.push({
              status: 'WON',
              title: 'Won',
              description: 'Deal berhasil ditutup',
              color: '#4CAF50' // Green
            });
          }
          if (!hasLost) {
            parsed.push({
              status: 'LOST',
              title: 'Lost',
              description: 'Deal gagal atau dibatalkan',
              color: '#F44336' // Red
            });
          }
          localStorage.setItem('pipeline_boards', JSON.stringify(parsed));
          return parsed;
        }
        return parsed;
      } catch {
        /* ignore */
      }
    }
    // Migrate old statuses array if exists
    const savedStatuses = localStorage.getItem('pipeline_statuses');
    if (savedStatuses) {
      try {
        const arr = JSON.parse(savedStatuses) as string[];
        const usedColors: string[] = [];
        const mapped = arr.map((s) => {
          const color = pickRandomColor(usedColors);
          usedColors.push(color);
          return {
            status: s,
            title: s.replace(/_/g, ' '),
            description: '',
            color,
          };
        });
        // Add WON and LOST
        mapped.push({
          status: 'WON',
          title: 'Won',
          description: 'Deal berhasil ditutup',
          color: '#4CAF50'
        });
        mapped.push({
          status: 'LOST',
          title: 'Lost',
          description: 'Deal gagal atau dibatalkan',
          color: '#F44336'
        });
        localStorage.setItem('pipeline_boards', JSON.stringify(mapped));
        return mapped;
      } catch {
        /* ignore */
      }
    }
    const seed = ['PROSPECT', 'MEETING_SCHEDULED', 'PRE_SALES', 'PROPOSAL_DELIVERED', 'WON', 'LOST'];
    const predefinedColors: Record<string, string> = {
      'PROSPECT': '#2196F3',
      'MEETING_SCHEDULED': '#FF9800',
      'PRE_SALES': '#9C27B0',
      'PROPOSAL_DELIVERED': '#673AB7',
      'WON': '#4CAF50',
      'LOST': '#F44336'
    };
    const initial = seed.map((s) => {
      return {
        status: s,
        title: s.replace(/_/g, ' '),
        description: '',
        color: predefinedColors[s] || pickRandomColor([])
      };
    });
    localStorage.setItem('pipeline_boards', JSON.stringify(initial));
    return initial;
  });
  const [addingStatus, setAddingStatus] = useState(false);
  const [statusCodeInput, setStatusCodeInput] = useState('');
  const [statusTitleInput, setStatusTitleInput] = useState('');
  const [statusDescInput, setStatusDescInput] = useState('');
  const [editingStatus, setEditingStatus] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const loadSalesUsers = async () => {
    try {
      setSalesLoading(true);
      setSalesError('');
      const result = await usersApi.getSalesUsers();
      setSalesUsers([{ id: 'all', name: 'Semua Sales' }, ...result]);
      if (selectedSalesUser !== 'all' && !result.some((u) => u.id === selectedSalesUser)) {
        setSelectedSalesUser('all');
      }
    } catch (e) {
      const msg = (e as Error)?.message || 'Gagal memuat daftar sales';
      setSalesError(msg);
    } finally {
      setSalesLoading(false);
    }
  };

  // Format currency to Indonesian Rupiah
  const formatCurrency = (amount: number): string =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
      notation: amount >= 1000000000 ? 'compact' : 'standard',
      compactDisplay: 'short',
    }).format(amount);

  // Load pipeline data
  // Debug state to surface backend summary (statuses actually used, invalid, etc.)
  const [debugSummary, setDebugSummary] = useState<{
    requestedStatuses?: string[];
    usedStatuses?: string[];
    invalidRequestedStatuses?: string[];
    availableStatusesForUser?: { status: string; count: number }[];
  }>({});

  const loadPipeline = async () => {
    try {
      setLoading(true);
      setError('');

      const salesUserId = selectedSalesUser === 'all' ? undefined : selectedSalesUser;

      console.log('[PipelinePage] Loading pipeline with filter:', {
        selectedSalesUser,
        salesUserId,
        userRoles: user?.roles,
      });

      const statuses = boards.map((b) => b.status);
      const response: PipelineResponse = await pipelineApi.getPipeline(salesUserId, statuses);
      // Attempt to read summary diagnostic if backend attached it (non-breaking)
      const raw: any = response as any;
      if (raw && raw.pipeline && raw.totalOpportunities !== undefined) {
        // summary might have been in original response.data.data.summary; pipelineApi flattened, so we refetch via second call? Instead rely on window.__lastPipelineSummary if controller logs it.
      }
      // Pull extra debug info from a hidden side-channel if backend added it to window (optional) else ignore
      const last = (window as any).__PIPELINE_DEBUG_SUMMARY;
      if (last) setDebugSummary(last);
      setPipeline(response.pipeline);
      setTotalOpportunities(response.totalOpportunities);
      setTotalValue(response.totalValue);
    } catch (err) {
      // If 401/403, logout and let AuthContext handle redirect
      const status = (err as { response?: { status?: number } })?.response?.status; // response shape from axios
      if (status === 401 || status === 403) {
        logout();
        return;
      }
      setError((err as Error)?.message || 'Gagal memuat data pipeline');
    } finally {
      setLoading(false);
    }
  };

  // Initial load for sales options
  useEffect(() => {
    loadSalesUsers();
  }, []);

  // Load data on filter or board changes
  useEffect(() => {
    loadPipeline();
  }, [selectedSalesUser, boards]);

  // Handle sales user filter change
  const handleSalesUserChange = (event: SelectChangeEvent<string>) => {
    setSelectedSalesUser(event.target.value as string);
  };

  // Handle new opportunity creation
  const handleCreateOpportunity = async (data: CreateProjectRequest) => {
    try {
      setSubmittingNewOpportunity(true);

      // If a specific sales user is filtered, assign the opportunity to that user
      // Otherwise, let the backend assign to the current user
      // Determine default status for newly created projects:
      // Place new tickets into the left-most board (first in `boards`) so they
      // appear at the far left regardless of the board's name. Fall back to
      // PROSPECT if no boards are present.
      const defaultStatus =
        boards && boards.length > 0 ? (boards[0].status as ProjectStatus) : ProjectStatus.PROSPECT;

      const projectData = {
        ...data,
        // Jika filter 'Semua Sales', otomatis assign ke user yang sedang login
        sales_user_id: selectedSalesUser !== 'all' ? selectedSalesUser : user?.id || undefined,
        status: defaultStatus,
      };

      const newProject = await pipelineApi.createProject(projectData);
      // New project created; optimistic UI update below

      // Fetch the full project (with joined customer/sales fields) to avoid rendering gaps
      let fullProject: Project;
      try {
        fullProject = await pipelineApi.getProjectById(newProject.id);
      } catch {
        // Fallback: use basic project from create response
        fullProject = newProject as Project;
      }

      // Optimistically add the new project to the chosen default column so it appears immediately
      const targetKey = defaultStatus as unknown as string;
      const currentTargetColumn = pipeline[targetKey] || {
        items: [],
        totalValue: 0,
        count: 0,
      };

      // Ensure status is set to the chosen default on client-side
      const createdProject: Project = {
        ...fullProject,
        status: defaultStatus,
        // Safe fallback customer to prevent UI access errors
        customer: fullProject.customer || {
          id: fullProject.customer_id,
          name: (fullProject as any)?.customer?.name || 'Customer',
          city: (fullProject as any)?.customer?.city || '',
        },
      } as Project;

      const updatedTargetItems = [createdProject, ...currentTargetColumn.items];
      const updatedTargetColumn = {
        ...currentTargetColumn,
        items: updatedTargetItems,
        count: updatedTargetItems.length,
        totalValue: updatedTargetItems.reduce(
          (sum, p) => sum + (p.contract_value ?? p.estimated_value ?? 0),
          0,
        ),
      };

      const newPipelineState: Pipeline = {
        ...pipeline,
        [targetKey]: updatedTargetColumn,
      };

      // Update UI state and totals using existing helper
      handlePipelineUpdate(newPipelineState);

      // Close the modal immediately
      setAddOpportunityOpen(false);

      // Optional: we can refresh later (e.g., after 2s) if needed, but avoid overwriting
      // the optimistic card too soon. Uncomment if you prefer auto-sync.
      // setTimeout(() => loadPipeline(), 2000);
    } catch (err) {
      // Forward error to modal layer
      throw err as Error;
    } finally {
      setSubmittingNewOpportunity(false);
    }
  };

  // Removed logout button per request

  // Handle refresh
  const handleRefresh = () => {
    loadPipeline();
  };

  // Handle card click: open fast with current card, then enrich with detail (includes sales_user)
  const handleCardClick = async (project: Project) => {
    // Open immediately with existing data for snappy UX
    setSelectedProject(project);
    setModalOpen(true);

    // Then fetch full detail (has sales_user enrichment) and update modal
    try {
      const detail = await pipelineApi.getProjectById(project.id);
      // Normalize customer shape to match frontend types
      const maybeCustomer: unknown = (detail as unknown as { customer?: unknown }).customer;
      const normalizedCustomer =
        maybeCustomer && typeof maybeCustomer === 'object' && (maybeCustomer as any).customer_name
          ? {
              id: (maybeCustomer as any).id,
              name: (maybeCustomer as any).customer_name,
              city: (maybeCustomer as any).city,
            }
          : (maybeCustomer as { id: string; name?: string; city?: string }) || project.customer;

      const normalized: Project = {
        ...(detail as Project),
        customer: normalizedCustomer as Project['customer'],
        status: ((detail as Partial<Project>).status as Project['status']) || project.status,
      };
      setSelectedProject(normalized);
    } catch {
      // Keep existing data if detail fetch fails silently
    }
  };

  // Handle modal close
  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedProject(null);
  };

  // Handle pipeline update (from drag & drop)
  const handlePipelineUpdate = (newPipeline: Pipeline) => {
    setPipeline(newPipeline);

    // Recalculate totals
    let newTotalOpportunities = 0;
    let newTotalValue = 0;

    Object.values(newPipeline).forEach((column) => {
      newTotalOpportunities += column.items?.length || 0;
      newTotalValue += column.totalValue || 0;
    });

    setTotalOpportunities(newTotalOpportunities);
    setTotalValue(newTotalValue);
  };

  const persistBoards = (next: BoardMeta[]) => {
    setBoards(next);
    localStorage.setItem('pipeline_boards', JSON.stringify(next));
  };

  const handleAddBoard = () => {
    const title = statusTitleInput.trim();
    const desc = statusDescInput.trim();

    // Auto-generate status code from title if not provided
    let code = statusCodeInput.trim();
    if (!code && title) {
      // Generate code from title: remove special chars, replace spaces with underscore, uppercase
      code = title
        .replace(/[^a-zA-Z0-9\s_-]/g, '') // Remove special characters
        .replace(/\s+/g, '_') // Replace spaces with underscore
        .toUpperCase();
    }

    // Validation: must have either code or title
    if (!code || !title) {
      alert('Judul wajib diisi!');
      return;
    }

    // Check for duplicate
    if (boards.some((b) => b.status === code)) {
      alert(`Status code '${code}' sudah ada!`);
      return;
    }

    const usedColors = boards.map((b) => b.color || '');
    const color = pickRandomColor(usedColors);
    const next = [...boards, { status: code, title, description: desc, color }];
    persistBoards(next);
    setAddingStatus(false);
    setStatusCodeInput('');
    setStatusTitleInput('');
    setStatusDescInput('');
    setEditingStatus(null);
    loadPipeline();
  };

  const handleEditBoardSave = () => {
    if (!editingStatus) return;
    const title = statusTitleInput.trim();
    const desc = statusDescInput.trim();
    const next = boards.map((b) =>
      b.status === editingStatus ? { ...b, title: title || b.title, description: desc } : b,
    );
    persistBoards(next);
    setAddingStatus(false);
    setStatusCodeInput('');
    setStatusTitleInput('');
    setStatusDescInput('');
    setEditingStatus(null);
  };

  const handleEditBoard = (status: string) => {
    const b = boards.find((x) => x.status === status);
    if (!b) return;
    setEditingStatus(status);
    setStatusCodeInput(status);
    setStatusTitleInput(b.title || '');
    setStatusDescInput(b.description || '');
    setAddingStatus(true);
  };

  const handleDeleteBoard = (status: string) => {
    const next = boards.filter((b) => b.status !== status);
    persistBoards(next);
    loadPipeline();
  };

  const askDeleteBoard = (status: string) => {
    setDeleteTarget(status);
    setConfirmOpen(true);
  };
  return (
    <Box sx={{ px: { xs: 1, sm: 2, md: 3 }, py: { xs: 0.75, sm: 1, md: 1.5 } }}>
      {/* Header Section */}
      <Box sx={{ mb: 3 }}>
        <Box
          display='flex'
          flexDirection={{ xs: 'column', sm: 'row' }}
          justifyContent='space-between'
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          mb={{ xs: 0.5, sm: 1 }}
          gap={1}
        >
          <Typography
            variant={window.innerWidth < 600 ? 'h6' : 'h4'}
            fontWeight='bold'
            color='primary'
            sx={{ fontSize: { xs: '1.05rem', sm: '1.6rem' } }}
          >
            Sales Pipeline
          </Typography>
          <Box display='flex' gap={1} flexWrap='wrap'>
            <Button
              variant='outlined'
              startIcon={<AddIcon />}
              onClick={() => setAddOpportunityOpen(true)}
              disabled={loading}
              size={window.innerWidth < 600 ? 'small' : 'medium'}
              sx={{
                fontSize: { xs: '0.9rem', sm: '1rem' },
                py: { xs: 0.5, sm: 1 },
              }}
            >
              New Opportunity
            </Button>
            <Tooltip title='Refresh Data'>
              <span>
                <IconButton
                  onClick={handleRefresh}
                  disabled={loading}
                  size={window.innerWidth < 600 ? 'small' : 'medium'}
                >
                  <RefreshIcon />
                </IconButton>
              </span>
            </Tooltip>
          </Box>
        </Box>
        {/* Add-board control removed per UI polish request */}

        {/* Filter & Summary Section */}
        <Paper elevation={0} sx={{ p: 1.25, mb: 1.25, bgcolor: 'transparent', boxShadow: 'none' }}>
          <Grid container spacing={{ xs: 1, sm: 3 }} alignItems='center'>
            {/* Filter (only visible to manager roles, not plain SALES users) */}
            {canSeeSalesFilter && (
              <Grid item xs={12} md={4}>
                <FormControl fullWidth size='small' sx={{ minWidth: { xs: 120, sm: 180 } }}>
                  <InputLabel>Filter Sales Person</InputLabel>
                  <Select
                    value={selectedSalesUser}
                    label='Filter Sales Person'
                    onChange={handleSalesUserChange}
                    disabled={loading || salesLoading}
                  >
                    {salesUsers.map((user) => (
                      <MenuItem key={user.id} value={user.id}>
                        <Box display='flex' alignItems='center'>
                          <AccountCircleIcon sx={{ mr: 1, fontSize: '1rem' }} />
                          {user.name}
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                  {salesError && (
                    <Typography variant='caption' color='error' sx={{ mt: 0.5 }}>
                      {salesError}
                    </Typography>
                  )}
                  {salesLoading && !salesError && (
                    <Typography variant='caption' color='text.secondary' sx={{ mt: 0.5 }}>
                      Memuat daftar sales...
                    </Typography>
                  )}
                </FormControl>
              </Grid>
            )}

            {/* Summary Statistics */}
            <Grid item xs={12} md={8}>
              <Grid container spacing={{ xs: 1, sm: 2 }}>
                <Grid item xs={12} sm={4}>
                  <Card
                    variant='outlined'
                    sx={{
                      textAlign: 'center',
                      minWidth: { xs: 140, sm: 0 },
                      borderRadius: 2,
                      boxShadow: 1,
                    }}
                  >
                    <CardContent sx={{ py: { xs: 1, sm: 1.25 } }}>
                      <Box
                        display='flex'
                        flexDirection='column'
                        alignItems='center'
                        justifyContent='center'
                      >
                        <Box
                          sx={{
                            width: 44,
                            height: 44,
                            borderRadius: '50%',
                            bgcolor: 'primary.main',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'common.white',
                            mb: 1,
                          }}
                        >
                          <AssessmentIcon sx={{ fontSize: 20 }} />
                        </Box>
                        <Typography
                          variant={window.innerWidth < 600 ? 'h6' : 'h5'}
                          fontWeight={700}
                          sx={{ lineHeight: 1 }}
                        >
                          {totalOpportunities}
                        </Typography>
                        <Typography
                          variant='caption'
                          color='text.secondary'
                          display='block'
                          mt={0.5}
                        >
                          Total Opportunities
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Card
                    variant='outlined'
                    sx={{
                      textAlign: 'center',
                      minWidth: { xs: 140, sm: 0 },
                      borderRadius: 2,
                      boxShadow: 1,
                    }}
                  >
                    <CardContent sx={{ py: { xs: 1, sm: 1.25 } }}>
                      <Box
                        display='flex'
                        flexDirection='column'
                        alignItems='center'
                        justifyContent='center'
                      >
                        <Box
                          sx={{
                            width: 44,
                            height: 44,
                            borderRadius: '50%',
                            bgcolor: 'success.main',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'common.white',
                            mb: 1,
                          }}
                        >
                          <TrendingUpIcon sx={{ fontSize: 20 }} />
                        </Box>
                        <Typography
                          variant={window.innerWidth < 600 ? 'h6' : 'h5'}
                          fontWeight={700}
                          sx={{ lineHeight: 1, color: 'success.main' }}
                        >
                          {formatCurrency(totalValue)}
                        </Typography>
                        <Typography
                          variant='caption'
                          color='text.secondary'
                          display='block'
                          mt={0.5}
                        >
                          Total Pipeline Value
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                {canSeeSalesFilter && (
                  <Grid item xs={12} sm={4}>
                    <Card
                      variant='outlined'
                      sx={{ textAlign: 'center', minWidth: { xs: 180, sm: 0 } }}
                    >
                      <CardContent sx={{ py: { xs: 1, sm: 1.5 } }}>
                        <Chip
                          label={`${selectedSalesUser === 'all' ? 'All Sales' : salesUsers.find((u) => u.id === selectedSalesUser)?.name || 'Sales'}`}
                          color='primary'
                          variant='outlined'
                          size='small'
                        />
                        <Typography
                          variant='caption'
                          color='text.secondary'
                          display='block'
                          mt={0.5}
                        >
                          Current Filter
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                )}
              </Grid>
            </Grid>
          </Grid>
        </Paper>

        {/* Error Message */}
        {error && (
          <Alert severity='error' sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
      </Box>

      {/* Kanban Board */}
      <Box sx={{ overflowX: 'auto', width: '100%' }}>
        <KanbanBoard
          pipeline={pipeline}
          onPipelineUpdate={handlePipelineUpdate}
          onCardClick={handleCardClick}
          boards={boards}
          onEditBoard={canManageBoards ? handleEditBoard : undefined}
          onDeleteBoard={canManageBoards ? askDeleteBoard : undefined}
          canDelete={canManageBoards ? () => true : () => false}
          onBoardsReorder={(newBoards) => {
            setBoards(newBoards);
            localStorage.setItem('pipeline_boards', JSON.stringify(newBoards));
          }}
          loading={loading}
          viewportOffset={140}
        />
      </Box>

      {/* Add Opportunity Modal */}
      <AddOpportunityModal
        open={addOpportunityOpen}
        onClose={() => setAddOpportunityOpen(false)}
        onSubmit={handleCreateOpportunity}
        loading={submittingNewOpportunity}
      />

      {/* Floating add-status input */}
      {addingStatus && (
        <Box
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            p: 2,
            bgcolor: 'background.paper',
            boxShadow: 3,
            borderRadius: 2,
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
            alignItems: 'stretch',
            width: 360,
          }}
        >
          <Typography variant='subtitle2' fontWeight='bold'>
            {editingStatus ? 'Edit Board' : 'Tambah Board Baru'}
          </Typography>
          <TextField
            size='small'
            label='Judul'
            value={statusTitleInput}
            onChange={(e) => setStatusTitleInput(e.target.value)}
            placeholder='Contoh: Negosiasi'
            required
            autoFocus
          />
          <TextField
            size='small'
            label='Deskripsi'
            value={statusDescInput}
            onChange={(e) => setStatusDescInput(e.target.value)}
            placeholder='Keterangan singkat (opsional)'
            multiline
            minRows={2}
          />
          {editingStatus && (
            <Typography variant='caption' sx={{ mt: 0.5, opacity: 0.7 }}>
              Warna board saat ini:{' '}
              <Box
                component='span'
                sx={{
                  display: 'inline-block',
                  width: 14,
                  height: 14,
                  bgcolor: boards.find((b) => b.status === editingStatus)?.color,
                  borderRadius: '3px',
                  ml: 0.5,
                }}
              />
            </Typography>
          )}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 1 }}>
            {editingStatus ? (
              <Button variant='contained' size='small' onClick={handleEditBoardSave}>
                Simpan
              </Button>
            ) : (
              <Button variant='contained' size='small' onClick={handleAddBoard}>
                Tambah
              </Button>
            )}
            <Button
              variant='text'
              size='small'
              onClick={() => {
                setAddingStatus(false);
                setStatusCodeInput('');
                setStatusTitleInput('');
                setStatusDescInput('');
                setEditingStatus(null);
              }}
            >
              Batal
            </Button>
          </Box>
        </Box>
      )}

      {/* Delete confirmation dialog */}
      <Dialog
        open={confirmOpen}
        onClose={() => {
          setConfirmOpen(false);
          setDeleteTarget(null);
        }}
      >
        <DialogTitle>Hapus Board</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Apakah Anda yakin ingin menghapus board {deleteTarget}? Semua kartu akan tetap ada
            tetapi tidak akan tampil di kolom ini.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setConfirmOpen(false);
              setDeleteTarget(null);
            }}
            color='inherit'
          >
            Batal
          </Button>
          <Button
            color='error'
            variant='contained'
            onClick={() => {
              if (deleteTarget) {
                handleDeleteBoard(deleteTarget);
              }
              setConfirmOpen(false);
              setDeleteTarget(null);
            }}
          >
            Hapus
          </Button>
        </DialogActions>
      </Dialog>

      {/* Status chips removed per request */}

      {/* Project Detail Modal */}
      {selectedProject && (
        <ProjectDetailModal
          open={modalOpen}
          onClose={handleModalClose}
          project={selectedProject}
          onProjectUpdate={(updatedProject) => {
            // Handle project update and refresh pipeline if needed
            setSelectedProject(updatedProject);
            loadPipeline(); // Refresh to get latest data
          }}
        />
      )}
    </Box>
  );
};

export default PipelinePage;

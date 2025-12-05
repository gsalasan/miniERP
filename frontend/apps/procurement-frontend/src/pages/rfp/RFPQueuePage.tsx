import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Alert,
  TextField,
  InputAdornment,
  MenuItem,
  Paper,
  Stack,
  Chip,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import {
  DataGrid,
  GridColDef,
  GridActionsCellItem,
  GridRenderCellParams,
} from '@mui/x-data-grid';
import {
  Visibility as VisibilityIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  AddShoppingCart as AddShoppingCartIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { rfpApi } from '../../api/rfp';
import { RFP, RFPStatus } from '../../types/rfp';
import { format } from 'date-fns';

const RFPStatusLabels: Record<RFPStatus, string> = {
  [RFPStatus.PENDING]: 'Pending',
  [RFPStatus.IN_PROCESS]: 'Diproses',
  [RFPStatus.PO_CREATED]: 'PO Dibuat',
  [RFPStatus.COMPLETED]: 'Selesai',
  [RFPStatus.CANCELLED]: 'Dibatalkan',
};

const RFPStatusColors: Record<
  RFPStatus,
  'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'
> = {
  [RFPStatus.PENDING]: 'warning',
  [RFPStatus.IN_PROCESS]: 'info',
  [RFPStatus.PO_CREATED]: 'primary',
  [RFPStatus.COMPLETED]: 'success',
  [RFPStatus.CANCELLED]: 'error',
};

const RFPQueuePage: React.FC = () => {
  const navigate = useNavigate();
  const [rfps, setRfps] = useState<RFP[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  // Default to show pending RFPs in the queue for Admin Project
  const [statusFilter, setStatusFilter] = useState<RFPStatus | ''>(RFPStatus.PENDING);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalRows, setTotalRows] = useState(0);

  const loadRFPs = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await rfpApi.getAllRFPs({
        search: search || undefined,
        status: statusFilter || undefined,
        page,
        limit: pageSize,
        sort_by: 'created_at',
        sort_order: 'desc',
      });
      setRfps(response.data);
      setTotalRows(response.pagination.total);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Terjadi kesalahan saat memuat data RFP'
      );
      console.error('Error loading RFPs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRFPs();
  }, [page, pageSize, search, statusFilter]);

  const handleViewDetail = (id: string) => {
    navigate(`/rfp/${id}`);
  };

  const handleConvertRFP = (id: string) => {
    navigate(`/rfp/${id}/convert-to-po`);
  };

  const columns: GridColDef[] = [
    {
      field: 'rfp_number',
      headerName: 'Nomor RFP',
      width: 150,
      renderCell: (params: GridRenderCellParams) => (
        <Typography variant="body2" fontWeight="bold" color="primary">
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'project_name',
      headerName: 'Nama Proyek',
      width: 200,
      flex: 1,
    },
    {
      field: 'requester_name',
      headerName: 'Pengaju',
      width: 180,
    },
    {
      field: 'items_count',
      headerName: 'Jumlah Item',
      width: 120,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams) => (
        <Chip label={params.value || 0} size="small" color="default" />
      ),
    },
    {
      field: 'created_at',
      headerName: 'Tanggal Dibuat',
      width: 150,
      renderCell: (params: GridRenderCellParams) =>
        params.value ? format(new Date(params.value), 'dd MMM yyyy') : '-',
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 130,
      renderCell: (params: GridRenderCellParams<RFP>) => (
        <Chip
          label={RFPStatusLabels[params.value as RFPStatus]}
          color={RFPStatusColors[params.value as RFPStatus]}
          size="small"
        />
      ),
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Aksi',
      width: 140,
      getActions: (params) => {
        return [
          <GridActionsCellItem
            icon={
              <Tooltip title="Lihat Detail">
                <VisibilityIcon />
              </Tooltip>
            }
            label="Detail"
            onClick={() => handleViewDetail(params.row.id)}
            showInMenu={false}
          />,
        ];
      },
    },
  ];

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Antrian RFP (Request for Purchase)
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Kelola dan proses permintaan pembelian dari Project Manager
          </Typography>
        </Box>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <TextField
            placeholder="Cari nomor RFP, proyek, atau pengaju..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ flex: 1 }}
            size="small"
          />
          <TextField
            select
            label="Filter Status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as RFPStatus | '')}
            sx={{ minWidth: 180 }}
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <FilterListIcon />
                </InputAdornment>
              ),
            }}
          >
            <MenuItem value="">Semua Status</MenuItem>
            {Object.entries(RFPStatusLabels).map(([value, label]) => (
              <MenuItem key={value} value={value}>
                {label}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
      </Paper>

      <Paper sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={rfps}
          columns={columns}
          loading={loading}
          pagination
          paginationMode="server"
          rowCount={totalRows}
          page={page - 1}
          pageSize={pageSize}
          onPageChange={(newPage) => setPage(newPage + 1)}
          onPageSizeChange={(newPageSize) => setPageSize(newPageSize)}
          rowsPerPageOptions={[5, 10, 25, 50]}
          disableSelectionOnClick
          sx={{
            '& .MuiDataGrid-cell:focus': {
              outline: 'none',
            },
          }}
        />
      </Paper>
    </Box>
  );
};

export default RFPQueuePage;

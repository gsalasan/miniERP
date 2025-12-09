import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  CircularProgress,
  Alert,
  Chip,
} from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { useNavigate } from 'react-router-dom';
import { poApi } from '../../api/po';
import { format } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';

interface PendingPO {
  id: string;
  po_number: string;
  vendor_name: string;
  total_amount: number;
  approval_status: string;
  submitted_for_approval_at: string;
  submitted_by: string;
  order_date: string;
}

const ApprovalPOPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [pendingPOs, setPendingPOs] = useState<PendingPO[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Check if user can approve PO (CEO only)
  const canApprovePO = user?.roles?.some((role: string) =>
    ['CEO'].includes(role)
  );

  const loadPendingPOs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Check if user has approval permission
      if (!canApprovePO) {
        setError('Anda tidak memiliki akses untuk melihat halaman ini. Hanya CEO yang dapat approve PO.');
        setLoading(false);
        // Redirect to main page after 2 seconds
        setTimeout(() => navigate('/'), 2000);
        return;
      }
      
      // Get userId from user object
      const userId = user?.id;
      if (!userId) {
        setError('User ID tidak ditemukan. Silakan login kembali.');
        return;
      }

      const response = await poApi.getPendingApprovals(userId);
      setPendingPOs(response);
    } catch (err) {
      console.error('Error loading pending POs:', err);
      setError(err instanceof Error ? err.message : 'Gagal memuat data PO yang menunggu approval');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPendingPOs();
  }, []);

  const handleViewDetail = (id: string) => {
    navigate(`/purchases/${id}`);
  };

  const columns: GridColDef[] = [
    {
      field: 'po_number',
      headerName: 'Nomor PO',
      width: 150,
      renderCell: (params: GridRenderCellParams) => (
        <Typography variant="body2" fontWeight="bold" color="primary">
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'vendor_name',
      headerName: 'Vendor',
      width: 200,
    },
    {
      field: 'total_amount',
      headerName: 'Total Amount',
      width: 150,
      align: 'right',
      renderCell: (params: GridRenderCellParams) => (
        <Typography variant="body2" fontWeight="bold">
          {new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
          }).format(params.value || 0)}
        </Typography>
      ),
    },
    {
      field: 'approval_status',
      headerName: 'Status',
      width: 150,
      renderCell: (params: GridRenderCellParams) => {
        const statusColors: { [key: string]: 'warning' | 'info' | 'success' | 'error' } = {
          PENDING_L1: 'warning',
          PENDING_L2: 'info',
          APPROVED: 'success',
          REJECTED: 'error',
        };
        return (
          <Chip
            label={params.value}
            color={statusColors[params.value] || 'default'}
            size="small"
          />
        );
      },
    },
    {
      field: 'order_date',
      headerName: 'Tanggal Order',
      width: 130,
      renderCell: (params: GridRenderCellParams) =>
        params.value ? format(new Date(params.value), 'dd MMM yyyy') : '-',
    },
    {
      field: 'submitted_for_approval_at',
      headerName: 'Submitted At',
      width: 150,
      renderCell: (params: GridRenderCellParams) =>
        params.value ? format(new Date(params.value), 'dd MMM yyyy HH:mm') : '-',
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      sortable: false,
      renderCell: (params: GridRenderCellParams) => (
        <Button
          size="small"
          variant="contained"
          onClick={() => handleViewDetail(params.row.id)}
        >
          Detail
        </Button>
      ),
    },
  ];

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Approval Purchase Order
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mb: 3 }}>
        Daftar PO yang menunggu persetujuan Anda
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={pendingPOs}
          columns={columns}
          pageSizeOptions={[10, 25, 50]}
          initialState={{
            pagination: { paginationModel: { pageSize: 10 } },
          }}
          disableRowSelectionOnClick
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

export default ApprovalPOPage;

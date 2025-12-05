import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
} from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { useNavigate } from 'react-router-dom';
import { poApi } from '../../api/po';
import { format } from 'date-fns';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
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
  const [selectedPO, setSelectedPO] = useState<PendingPO | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [comments, setComments] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Check if user can approve PO (CEO or PROCUREMENT_MANAGER)
  const canApprovePO = user?.roles?.some((role: string) =>
    ['CEO', 'PROCUREMENT_MANAGER'].includes(role)
  );

  const loadPendingPOs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Check if user has approval permission
      if (!canApprovePO) {
        setError('Anda tidak memiliki akses untuk melihat halaman ini. Hanya CEO atau PROCUREMENT_MANAGER yang dapat approve PO.');
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

  const handleOpenDialog = (po: PendingPO, action: 'approve' | 'reject') => {
    setSelectedPO(po);
    setActionType(action);
    setComments('');
  };

  const handleCloseDialog = () => {
    setSelectedPO(null);
    setActionType(null);
    setComments('');
  };

  const handleSubmitAction = async () => {
    if (!selectedPO || !actionType) return;

    try {
      setSubmitting(true);
      setError(null);

      const userId = user?.id;
      if (!userId) {
        setError('User ID tidak ditemukan');
        return;
      }

      if (actionType === 'approve') {
        await poApi.approvePO(selectedPO.id, userId, comments || undefined);
      } else {
        await poApi.rejectPO(selectedPO.id, userId, comments);
      }

      // Reload pending POs
      await loadPendingPOs();
      handleCloseDialog();
    } catch (err) {
      console.error(`Error ${actionType}ing PO:`, err);
      setError(err instanceof Error ? err.message : `Gagal ${actionType === 'approve' ? 'menyetujui' : 'menolak'} PO`);
    } finally {
      setSubmitting(false);
    }
  };

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
      width: 280,
      sortable: false,
      renderCell: (params: GridRenderCellParams) => (
        <Box display="flex" gap={1}>
          <Button
            size="small"
            variant="outlined"
            onClick={() => handleViewDetail(params.row.id)}
          >
            Detail
          </Button>
          <Button
            size="small"
            variant="contained"
            color="success"
            startIcon={<CheckCircleIcon />}
            onClick={() => handleOpenDialog(params.row, 'approve')}
          >
            Approve
          </Button>
          <Button
            size="small"
            variant="contained"
            color="error"
            startIcon={<CancelIcon />}
            onClick={() => handleOpenDialog(params.row, 'reject')}
          >
            Reject
          </Button>
        </Box>
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

      {/* Approval/Rejection Dialog */}
      <Dialog open={!!selectedPO && !!actionType} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {actionType === 'approve' ? 'Approve Purchase Order' : 'Reject Purchase Order'}
        </DialogTitle>
        <DialogContent>
          {selectedPO && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                PO Number: <strong>{selectedPO.po_number}</strong>
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Vendor: <strong>{selectedPO.vendor_name}</strong>
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Amount:{' '}
                <strong>
                  {new Intl.NumberFormat('id-ID', {
                    style: 'currency',
                    currency: 'IDR',
                    minimumFractionDigits: 0,
                  }).format(selectedPO.total_amount || 0)}
                </strong>
              </Typography>
            </Box>
          )}
          <TextField
            fullWidth
            label={actionType === 'reject' ? 'Alasan Penolakan *' : 'Komentar (Opsional)'}
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            multiline
            rows={4}
            required={actionType === 'reject'}
            helperText={
              actionType === 'reject'
                ? 'Harap berikan alasan penolakan'
                : 'Tambahkan komentar jika diperlukan'
            }
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={submitting}>
            Batal
          </Button>
          <Button
            onClick={handleSubmitAction}
            variant="contained"
            color={actionType === 'approve' ? 'success' : 'error'}
            disabled={submitting || (actionType === 'reject' && !comments.trim())}
          >
            {submitting ? (
              <CircularProgress size={24} />
            ) : actionType === 'approve' ? (
              'Approve'
            ) : (
              'Reject'
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ApprovalPOPage;

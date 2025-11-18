import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
} from '@mui/material';
import {
  DataGrid,
  GridColDef,
  GridActionsCellItem,
  GridRenderCellParams,
} from '@mui/x-data-grid';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  WarningAmber as WarningIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { customersApi } from '../../api/customers';
import { usersApi, SalesUserOption } from '../../api/users';
import {
  Customer,
  CustomerStatus,
  UpdateCustomerData,
} from '../../types/customer';
import { StatusBadge, LoadingSpinner, EmptyState } from '../../components';
import CustomerEditDialog from '../../components/CustomerEditDialog';

const CustomersPage: React.FC = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );
  const [salesUsers, setSalesUsers] = useState<SalesUserOption[]>([]);
  const [salesMap, setSalesMap] = useState<Record<string, SalesUserOption>>({});
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<string | null>(null);

  // DataGrid columns definition
  const columns: GridColDef[] = [
    {
      field: 'customer_name',
      headerName: 'Nama Customer',
      width: 200,
      sortable: true,
      renderCell: (params: GridRenderCellParams<Customer, string>) => (
        <Button
          variant='text'
          sx={{ p: 0, textTransform: 'none', justifyContent: 'flex-start' }}
          onClick={() => navigate(`/customers/${params.row.id}`)}
        >
          {params.value}
        </Button>
      ),
    },
    {
      field: 'channel',
      headerName: 'Channel',
      width: 130,
      sortable: true,
    },
    {
      field: 'city',
      headerName: 'Kota',
      width: 130,
      sortable: true,
    },
    {
      field: 'district',
      headerName: 'District',
      width: 130,
      sortable: true,
    },
    {
      field: 'alamat',
      headerName: 'Alamat',
      width: 200,
      sortable: false,
      renderCell: (params: GridRenderCellParams<Customer, string>) => (
        <Typography variant='body2' sx={{ whiteSpace: 'pre-line' }}>
          {params.value || '-'}
        </Typography>
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      sortable: true,
      renderCell: (params: GridRenderCellParams<Customer, CustomerStatus>) => {
        const status = params.value;
        if (!status) return null;
        return <StatusBadge status={status} />;
      },
    },
    {
      field: 'top_days',
      headerName: 'TOP (Hari)',
      width: 100,
      sortable: true,
      type: 'number',
    },
    {
      field: 'credit_limit',
      headerName: 'Credit Limit',
      width: 130,
      sortable: true,
      type: 'number',
      valueFormatter: (value: number | null | undefined) => {
        if (value == null) return '-';
        return new Intl.NumberFormat('id-ID', {
          style: 'currency',
          currency: 'IDR',
        }).format(value);
      },
    },
    {
      field: 'assigned_sales_id',
      headerName: 'Sales',
      width: 130,
      sortable: true,
      renderCell: (params: GridRenderCellParams<Customer, string>) => {
        const id = params.value;
        if (!id) return '-';
        const su = salesMap[id];
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Typography variant='body2' sx={{ lineHeight: 1.2 }}>
              {su?.name || id}
            </Typography>
            {su?.email && (
              <Typography
                variant='caption'
                color='text.secondary'
                sx={{ lineHeight: 1 }}
              >
                {su.email}
              </Typography>
            )}
          </Box>
        );
      },
    },
    {
      field: 'contacts_count',
      headerName: 'Jumlah Kontak',
      width: 120,
      sortable: false,
      renderCell: (params: GridRenderCellParams<Customer>) => {
        const customer = params.row;
        return customer.customer_contacts?.length || 0;
      },
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Aksi',
      width: 120,
      getActions: params => [
        <GridActionsCellItem
          key='view'
          icon={<VisibilityIcon />}
          label='Detail'
          onClick={() => navigate(`/customers/${params.row.id}`)}
        />,
        <GridActionsCellItem
          key='delete'
          icon={<DeleteIcon />}
          label='Delete'
          onClick={() => handleDelete(params.row.id)}
        />,
      ],
    },
  ];

  // Load customers data
  const loadCustomers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await customersApi.getAllCustomers();
      setCustomers(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Terjadi kesalahan saat memuat data'
      );
      // eslint-disable-next-line no-console
      console.error('Error loading customers:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load sales users for mapping assigned_sales_id -> name/email
  const loadSalesUsers = async () => {
    try {
      const list = await usersApi.getSalesUsers();
      setSalesUsers(list);
      const map = list.reduce<Record<string, SalesUserOption>>((acc, u) => {
        acc[u.id] = u;
        return acc;
      }, {});
      setSalesMap(map);
    } catch {
      // keep empty mapping if HR is unavailable
      setSalesUsers([]);
      setSalesMap({});
    }
  };

  // Handle update customer
  const handleUpdateCustomer = async (id: string, data: UpdateCustomerData) => {
    try {
      await customersApi.updateCustomer(id, data);
      await loadCustomers(); // Reload data after update
      setError(null); // Clear any previous errors
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Terjadi kesalahan saat mengupdate customer';
      setError(errorMessage);
      // eslint-disable-next-line no-console
      console.error('Error updating customer:', err);
      throw err; // Re-throw error so dialog can handle it
    }
  };

  // Handle close edit dialog
  const handleCloseEditDialog = () => {
    setEditDialogOpen(false);
    setSelectedCustomer(null);
  };

  // Handle delete customer
  const handleDelete = (customerId: string) => {
    setCustomerToDelete(customerId);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!customerToDelete) return;

    try {
      await customersApi.deleteCustomer(customerToDelete);
      await loadCustomers(); // Reload data
      setDeleteDialogOpen(false);
      setCustomerToDelete(null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Terjadi kesalahan saat menghapus customer'
      );
      // eslint-disable-next-line no-console
      console.error('Error deleting customer:', err);
      setDeleteDialogOpen(false);
      setCustomerToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setDeleteDialogOpen(false);
    setCustomerToDelete(null);
  };

  // Handle add new customer
  const handleAdd = () => {
    navigate('/customers/new');
  };

  useEffect(() => {
    loadCustomers();
    loadSalesUsers();
  }, []);

  if (loading) {
    return <LoadingSpinner message='Memuat data customer...' />;
  }

  return (
    <Box sx={{ px: { xs: 1, sm: 2, md: 0 } }}>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'center' },
          mb: { xs: 2, sm: 4 },
          gap: 2,
        }}
      >
        <Box>
          <Typography
            variant={window.innerWidth < 600 ? 'h5' : 'h2'}
            sx={{
              mb: 1,
              background: 'linear-gradient(45deg, #1976d2, #42a5f5)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontWeight: 700,
              fontSize: { xs: '1.5rem', sm: '2.5rem' },
            }}
          >
            Customers
          </Typography>
          <Typography variant='body1' color='text.secondary'>
            Kelola data pelanggan dan kontak
          </Typography>
        </Box>
        <Button
          variant='contained'
          size={window.innerWidth < 600 ? 'medium' : 'large'}
          startIcon={<AddIcon />}
          onClick={handleAdd}
          sx={{
            minWidth: { xs: 120, sm: 160 },
            borderRadius: 3,
            textTransform: 'none',
            fontWeight: 600,
            boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)',
            fontSize: { xs: '0.95rem', sm: '1rem' },
            py: { xs: 1, sm: 2 },
            '&:hover': {
              boxShadow: '0 6px 20px rgba(25, 118, 210, 0.4)',
            },
          }}
        >
          Add Customer
        </Button>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert
          severity='error'
          sx={{
            mb: 3,
            borderRadius: 2,
            '& .MuiAlert-message': {
              fontSize: '0.875rem',
            },
          }}
          onClose={() => setError(null)}
        >
          {error}
        </Alert>
      )}

      {/* Content */}
      {customers.length === 0 ? (
        <EmptyState
          title='Belum ada customer'
          description='Mulai dengan menambahkan customer pertama Anda untuk membangun database pelanggan yang kuat.'
          actionText='Tambah Customer Pertama'
          onAction={handleAdd}
        />
      ) : (
        <Box
          sx={{
            bgcolor: 'white',
            borderRadius: 3,
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            overflow: 'auto',
            width: '100%',
            maxWidth: '100vw',
          }}
        >
          <Box sx={{ minWidth: 600 }}>
            <DataGrid
              rows={customers}
              columns={columns}
              initialState={{
                pagination: {
                  paginationModel: {
                    pageSize: 10,
                  },
                },
              }}
              pageSizeOptions={[5, 10, 25, 50]}
              checkboxSelection
              disableRowSelectionOnClick
              autoHeight={false}
              sx={{
                minHeight: { xs: 350, sm: 500 },
                border: 'none',
                fontSize: { xs: '0.8rem', sm: '0.875rem' },
                '& .MuiDataGrid-cell': {
                  fontSize: { xs: '0.8rem', sm: '0.875rem' },
                  borderBottom: '1px solid #f0f0f0',
                  py: { xs: 1, sm: 1.5 },
                },
                '& .MuiDataGrid-columnHeaders': {
                  backgroundColor: '#f8f9fa',
                  fontSize: { xs: '0.8rem', sm: '0.875rem' },
                  fontWeight: 600,
                  color: '#495057',
                  borderBottom: '2px solid #e9ecef',
                },
                '& .MuiDataGrid-row': {
                  '&:hover': {
                    backgroundColor: '#f8f9fa',
                  },
                },
                '& .MuiDataGrid-footerContainer': {
                  borderTop: '1px solid #e9ecef',
                  backgroundColor: '#fafafa',
                },
              }}
            />
          </Box>
        </Box>
      )}

      {/* Edit Dialog */}
      <CustomerEditDialog
        open={editDialogOpen}
        customer={selectedCustomer}
        onClose={handleCloseEditDialog}
        onSave={handleUpdateCustomer}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleCancelDelete}
        maxWidth='xs'
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          },
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            pb: 1,
            pt: 3,
            px: 3,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 48,
                height: 48,
                borderRadius: 2,
                bgcolor: 'error.light',
                color: 'error.main',
              }}
            >
              <WarningIcon sx={{ fontSize: 28 }} />
            </Box>
            <Typography variant='h6' fontWeight={600} color='text.primary'>
              Hapus Customer
            </Typography>
          </Box>
          <IconButton
            onClick={handleCancelDelete}
            size='small'
            sx={{
              color: 'text.secondary',
              '&:hover': { bgcolor: 'action.hover' },
            }}
          >
            <CloseIcon fontSize='small' />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ px: 3, py: 2 }}>
          <Typography variant='body1' color='text.secondary'>
            Yakin mau hapus customer ini? Data tidak bisa dikembalikan lagi.
          </Typography>
        </DialogContent>

        <DialogActions
          sx={{
            px: 3,
            pb: 3,
            pt: 1,
            gap: 1.5,
          }}
        >
          <Button
            onClick={handleCancelDelete}
            variant='outlined'
            size='large'
            fullWidth
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              borderColor: 'divider',
              color: 'text.secondary',
              '&:hover': {
                borderColor: 'text.secondary',
                bgcolor: 'action.hover',
              },
            }}
          >
            Batal
          </Button>
          <Button
            onClick={handleConfirmDelete}
            variant='contained'
            color='error'
            size='large'
            fullWidth
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              boxShadow: '0 4px 12px rgba(211, 47, 47, 0.3)',
              '&:hover': {
                boxShadow: '0 6px 20px rgba(211, 47, 47, 0.4)',
              },
            }}
          >
            Ya, Hapus
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CustomersPage;

import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, CircularProgress, Alert, Button, Chip
} from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { useNavigate } from 'react-router-dom';
import { poApi } from '../api/po';

const statusLabels: Record<string, string> = {
  DRAFT: 'Draft',
  SENT_TO_VENDOR: 'Terkirim',
  ACKNOWLEDGED: 'Diterima Vendor',
  PARTIALLY_RECEIVED: 'Sebagian Diterima',
  COMPLETED: 'Selesai',
  CANCELLED: 'Dibatalkan',
};

const statusColors: Record<string, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
  DRAFT: 'warning',
  SENT_TO_VENDOR: 'info',
  ACKNOWLEDGED: 'primary',
  PARTIALLY_RECEIVED: 'secondary',
  COMPLETED: 'success',
  CANCELLED: 'error',
};

const PurchaseListPage: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await poApi.getAllPOs({ page: 1, limit: 25 });
        if (!mounted) return;
        setData(res.data || []);
      } catch (err) {
        console.error('Error loading POs', err);
        if (!mounted) return;
        setError('Gagal memuat data PO');
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const columns: GridColDef[] = [
    { field: 'po_number', headerName: 'No. PO', width: 180 },
    { field: 'vendor_name', headerName: 'Vendor', width: 200 },
    { field: 'order_date', headerName: 'Tanggal Order', width: 150 },
    {
      field: 'status',
      headerName: 'Status',
      width: 140,
      renderCell: (params: GridRenderCellParams) => (
        <Chip label={statusLabels[params.value] || params.value} color={statusColors[params.value] || 'default'} size="small" />
      ),
    },
    {
      field: 'total_amount',
      headerName: 'Total',
      width: 150,
      valueFormatter: (params) =>
        params.value ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(params.value) : '-',
    },
    {
      field: 'actions',
      headerName: 'Aksi',
      width: 120,
      renderCell: (params: GridRenderCellParams) => (
        <Button size="small" onClick={() => navigate(`/po/${params.row.id}`)}>
          Detail
        </Button>
      ),
    },
  ];

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Daftar Purchase Order / Work Order
      </Typography>
      <Paper sx={{ p: 2, mt: 2 }}>
        {error && <Alert severity="error">{error}</Alert>}
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
            <CircularProgress />
          </Box>
        ) : (
          <div style={{ height: 420, width: '100%' }}>
            <DataGrid
              rows={data}
              columns={columns}
              pageSize={10}
              rowsPerPageOptions={[10, 25, 50]}
              disableSelectionOnClick
            />
          </div>
        )}
      </Paper>
    </Box>
  );
};

export default PurchaseListPage;

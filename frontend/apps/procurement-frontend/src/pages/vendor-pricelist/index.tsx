import React, { useEffect, useState } from "react";
import { Box, Typography, Button, Alert, TextField, MenuItem, Stack, Paper, Chip, Tooltip } from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  ArrowBack as ArrowBackIcon,
  FilterList as FilterListIcon,
  TrendingUp as TrendingUpIcon,
} from "@mui/icons-material";
import { GridActionsCellItem } from "@mui/x-data-grid";
import { vendorPricelistApi } from "../../api/vendorPricelist";
import { vendorsApi } from "../../api/vendors";
import { VendorPrice } from "../../types/vendorPricelist";
import { Vendor } from "../../types/vendor";
import type { Material } from "../../types/material.ts";
import { materialsApi } from "../../api/materials";
import { useNavigate, useLocation } from "react-router-dom";
import { LoadingSpinner, EmptyState } from "../../components";

const VendorPriceListPage: React.FC = () => {
  const navigate = useNavigate();
  // const location = useLocation();
  const [items, setItems] = useState<VendorPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [vendorFilter, setVendorFilter] = useState("");
  const [materialFilter, setMaterialFilter] = useState("");
  const [materials, setMaterials] = useState<Material[]>([]);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const [data, v, m] = await Promise.all([
        vendorPricelistApi.getAll(),
        vendorsApi.getAllVendors(),
        materialsApi.getAll(),
      ]);
      console.log('Vendor pricelist data:', data);
      console.log('Sample item:', JSON.stringify(data[0], null, 2));
      console.log('Has Material?', data[0]?.Material);
      console.log('Has Vendor?', data[0]?.Vendor);
      setItems(data);
      setVendors(v);
      setMaterials(m);
    } catch (err) {
      console.error('Error loading vendor pricelist page:', err);
      setError(err instanceof Error ? err.message : 'Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  // read vendor_id from query params and load data
  const location = useLocation();
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const vid = params.get('vendor_id') || '';
    if (vid) setVendorFilter(vid);
    (async () => { await load(); })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Hapus entry ini?')) return;
    try {
      await vendorPricelistApi.delete(id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menghapus');
    }
  };

  // highlight preferred vendor row
  const getRowClassName = (params: any) => {
    const row = params?.row;
    if (!row) return '';
    const vendor = vendors.find(v => v.id === row.vendor_id);
    return vendor && vendor.is_preferred ? 'preferred-vendor-row' : '';
  };

  const filteredItems = items.filter(item => {
    let ok = true;
    if (vendorFilter) ok = ok && item.vendor_id === vendorFilter;
    if (materialFilter) ok = ok && item.material_id === materialFilter;
    return ok;
  });

  const columns: GridColDef[] = [
    {
      field: 'vendor_name',
      headerName: 'Vendor',
      flex: 1,
      minWidth: 180,
      renderCell: (params) => {
        const row = params?.row;
        if (!row) return '-';
        const vendor = vendors.find(v => v.id === row.vendor_id);
        const vendorName = row.Vendor?.vendor_name || row.vendor?.vendor_name || 
                          vendor?.vendor_name || row.vendor_id || '-';
        const isPreferred = vendor?.is_preferred || row.Vendor?.is_preferred;
        return (
          <Box>
            <Typography variant="body2" fontWeight={500}>
              {vendorName}
            </Typography>
            {isPreferred && (
              <Chip 
                label="Preferred" 
                size="small" 
                color="success" 
                sx={{ height: 18, fontSize: 10, mt: 0.5 }}
              />
            )}
          </Box>
        );
      },
    },
    {
      field: 'material_name',
      headerName: 'Material',
      flex: 1,
      minWidth: 200,
      renderCell: (params) => {
        const row = params?.row;
        if (!row) return '-';
        const material = materials.find(m => m.id === row.material_id);
        const materialName = row.Material?.item_name || row.material?.item_name || 
                            material?.item_name || row.material_id || '-';
        const brand = row.Material?.brand || material?.brand;
        return (
          <Box>
            <Typography variant="body2" fontWeight={500}>
              {materialName}
            </Typography>
            {brand && (
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: 11 }}>
                Brand: {brand}
              </Typography>
            )}
          </Box>
        );
      },
    },
    {
      field: 'price',
      headerName: 'Price',
      width: 160,
      renderCell: (params) => {
        const row = params?.row;
        if (!row) return null;
        const price = Number(row.price ?? 0);
        return (
          <Box>
            <Typography variant="body2" fontWeight={700} color="primary.main">
              {row.currency || 'IDR'} {price.toLocaleString('id-ID')}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10 }}>
              Updated: {row.price_updated_at ? new Date(row.price_updated_at).toLocaleDateString('id-ID') : '-'}
            </Typography>
          </Box>
        );
      },
    },
    {
      field: 'currency',
      headerName: 'Currency',
      width: 90,
      renderCell: (params) => (
        <Chip 
          label={params.row?.currency || 'IDR'} 
          size="small" 
          variant="outlined"
          sx={{ fontWeight: 600 }}
        />
      ),
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Actions',
      width: 100,
      getActions: (params) => [
        <GridActionsCellItem
          icon={
            <Tooltip title="Delete Price">
              <DeleteIcon />
            </Tooltip>
          }
          label="Hapus"
          onClick={() => handleDelete(params.id as string)}
          sx={{ color: 'error.main' }}
        />
      ]
    },
  ];

  if (loading) return <LoadingSpinner message="Memuat vendor pricelist..." />;

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Header Section */}
      <Paper 
        elevation={0} 
        sx={{ 
          p: 3, 
          mb: 3, 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: 2,
        }}
      >
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
          <Button 
            variant="outlined" 
            startIcon={<ArrowBackIcon />} 
            onClick={() => navigate('/vendors')}
            sx={{ 
              color: 'white', 
              borderColor: 'rgba(255,255,255,0.5)',
              '&:hover': { 
                borderColor: 'white',
                background: 'rgba(255,255,255,0.1)'
              }
            }}
          >
            Kembali
          </Button>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'white', display: 'flex', alignItems: 'center', gap: 1 }}>
              <TrendingUpIcon sx={{ fontSize: 32 }} />
              Vendor Pricelist
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)', mt: 0.5 }}>
              Kelola dan bandingkan harga dari berbagai vendor
            </Typography>
          </Box>
          <Button 
            variant="contained" 
            size="large"
            startIcon={<AddIcon />} 
            onClick={() => navigate('/vendor-pricelist/new')}
            sx={{ 
              background: 'white',
              color: '#667eea',
              fontWeight: 600,
              '&:hover': { 
                background: 'rgba(255,255,255,0.9)',
              }
            }}
          >
            Tambah Harga
          </Button>
        </Stack>

        {/* Stats Cards */}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <Paper sx={{ p: 2, flex: 1, background: 'rgba(255,255,255,0.95)' }}>
            <Typography variant="caption" color="text.secondary">Total Entries</Typography>
            <Typography variant="h5" fontWeight={700} color="primary.main">
              {items.length}
            </Typography>
          </Paper>
          <Paper sx={{ p: 2, flex: 1, background: 'rgba(255,255,255,0.95)' }}>
            <Typography variant="caption" color="text.secondary">Unique Vendors</Typography>
            <Typography variant="h5" fontWeight={700} color="success.main">
              {new Set(items.map(i => i.vendor_id)).size}
            </Typography>
          </Paper>
          <Paper sx={{ p: 2, flex: 1, background: 'rgba(255,255,255,0.95)' }}>
            <Typography variant="caption" color="text.secondary">Unique Materials</Typography>
            <Typography variant="h5" fontWeight={700} color="secondary.main">
              {new Set(items.map(i => i.material_id)).size}
            </Typography>
          </Paper>
        </Stack>
      </Paper>

      {/* Filter Section */}
      <Paper elevation={0} sx={{ p: 2, mb: 3, borderRadius: 2, border: '1px solid #e0e0e0' }}>
        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
          <FilterListIcon color="action" />
          <TextField
            select
            size="small"
            label="Filter Vendor"
            value={vendorFilter}
            onChange={(e) => setVendorFilter((e.target as HTMLInputElement).value)}
            sx={{ minWidth: 200, flex: 1 }}
          >
            <MenuItem value="">Semua Vendor</MenuItem>
            {vendors.map(v => (
              <MenuItem key={v.id} value={v.id}>
                {v.vendor_name} {v.is_preferred ? '⭐' : ''}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            size="small"
            label="Filter Material"
            value={materialFilter}
            onChange={(e) => setMaterialFilter((e.target as HTMLInputElement).value)}
            sx={{ minWidth: 200, flex: 1 }}
          >
            <MenuItem value="">Semua Material</MenuItem>
            {materials.map(m => (
              <MenuItem key={m.id} value={m.id}>
                {m.item_name}
              </MenuItem>
            ))}
          </TextField>
          {(vendorFilter || materialFilter) && (
            <Button 
              size="small" 
              onClick={() => { setVendorFilter(''); setMaterialFilter(''); }}
            >
              Clear Filters
            </Button>
          )}
        </Stack>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Data Grid */}
      {filteredItems.length === 0 ? (
        <EmptyState 
          title="Belum ada harga" 
          description="Tambahkan harga vendor untuk material" 
          actionText="Tambah Harga" 
          onAction={() => navigate('/vendor-pricelist/new')} 
        />
      ) : (
        <Paper elevation={0} sx={{ borderRadius: 2, overflow: 'hidden', border: '1px solid #e0e0e0' }}>
          <DataGrid
            rows={filteredItems}
            columns={columns}
            autoHeight
            getRowId={(r) => r.id}
            pageSizeOptions={[5, 10, 25, 50]}
            initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
            getRowClassName={getRowClassName}
            disableRowSelectionOnClick
            sx={{
              '& .preferred-vendor-row': { 
                background: 'linear-gradient(90deg, #fffde7 0%, #fff9c4 100%)',
              },
              '& .MuiDataGrid-columnHeaders': { 
                background: '#f5f5f5',
                fontWeight: 600,
              },
              '& .MuiDataGrid-cell': {
                py: 1.5,
              },
              '& .MuiDataGrid-row:hover': {
                background: '#f8f9fa',
              },
              border: 'none',
            }}
          />
        </Paper>
      )}
    </Box>
  );
};

export default VendorPriceListPage;

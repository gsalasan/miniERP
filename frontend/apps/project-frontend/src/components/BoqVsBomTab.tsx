import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
  Stack,
  Divider,
  Grid,
  Chip,
} from '@mui/material';
import { DataGrid, GridColDef, GridRowsProp } from '@mui/x-data-grid';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import BuildOutlinedIcon from '@mui/icons-material/BuildOutlined';
import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import { projectApi } from '../api/projectApi';
import type { EstimationItem, ProjectBOM, BomItem } from '../types';

interface BoqVsBomTabProps {
  projectId: string;
  estimationItems: EstimationItem[];
  existingBomItems: ProjectBOM[];
  onBomSaved: () => void;
  canEdit: boolean;
  projectStatus: string;
}

interface BomRow {
  id: string;
  itemId: string;
  itemName: string;
  itemType: string;
  quantity: number;
  isNew?: boolean;
}

const BoqVsBomTab: React.FC<BoqVsBomTabProps> = ({
  projectId,
  estimationItems,
  existingBomItems,
  onBomSaved,
  canEdit,
  projectStatus,
}) => {
  const [bomRows, setBomRows] = useState<BomRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (existingBomItems.length > 0) {
      setBomRows(
        existingBomItems.map((item) => ({
          id: item.id,
          itemId: item.item_id,
          itemName: item.item_name || item.item_id,
          itemType: item.item_type,
          quantity: Number(item.quantity),
        }))
      );
    }
  }, [existingBomItems]);

  const boqColumns: GridColDef[] = [
    {
      field: 'itemName',
      headerName: 'Nama Item',
      flex: 1,
      minWidth: 300,
    },
    {
      field: 'itemType',
      headerName: 'Tipe',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value}
          size="small"
          color={params.value === 'MATERIAL' ? 'primary' : 'secondary'}
        />
      ),
    },
    {
      field: 'quantity',
      headerName: 'Qty',
      width: 100,
      type: 'number',
    },
    {
      field: 'hppAtEstimation',
      headerName: 'HPP',
      width: 150,
      valueFormatter: (params) => {
        if (params) {
          return `Rp ${Number(params).toLocaleString('id-ID')}`;
        }
        return '-';
      },
    },
  ];

  const bomColumns: GridColDef[] = [
    {
      field: 'itemName',
      headerName: 'Nama Item',
      flex: 1,
      minWidth: 300,
      editable: false,
    },
    {
      field: 'itemType',
      headerName: 'Tipe',
      width: 120,
      editable: canEdit,
      type: 'singleSelect',
      valueOptions: ['MATERIAL', 'SERVICE'],
      renderCell: (params) => (
        <Chip
          label={params.value}
          size="small"
          color={params.value === 'MATERIAL' ? 'primary' : 'secondary'}
        />
      ),
    },
    {
      field: 'quantity',
      headerName: 'Qty',
      width: 100,
      type: 'number',
      editable: canEdit,
    },
    {
      field: 'actions',
      headerName: 'Aksi',
      width: 80,
      sortable: false,
      renderCell: (params) => {
        if (!canEdit) return null;
        return (
          <Tooltip title="Hapus">
            <IconButton
              size="small"
              color="error"
              onClick={() => handleDeleteRow(params.row.id)}
            >
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        );
      },
    },
  ];

  const handleCopyFromBoq = () => {
    const copiedRows = estimationItems.map((item, index) => ({
      id: `temp-${Date.now()}-${index}`,
      itemId: item.item_id,
      itemName: item.item_name || item.item_id,
      itemType: item.item_type,
      quantity: Number(item.quantity),
      isNew: true,
    }));
    setBomRows(copiedRows);
    setHasChanges(true);
    setSuccess('BoQ berhasil disalin ke BoM. Silakan review dan simpan.');
    setError(null);
  };

  const handleAddItem = () => {
    const newRow: BomRow = {
      id: `new-${Date.now()}`,
      itemId: '',
      itemName: 'Item Baru',
      itemType: 'MATERIAL',
      quantity: 1,
      isNew: true,
    };
    setBomRows([...bomRows, newRow]);
    setHasChanges(true);
  };

  const handleDeleteRow = (id: string) => {
    setBomRows(bomRows.filter((row) => row.id !== id));
    setHasChanges(true);
  };

  const handleSaveBom = async () => {
    // Validation
    const emptyItems = bomRows.filter((row) => !row.itemId || row.itemId.trim() === '');
    if (emptyItems.length > 0) {
      setError('Semua item harus memiliki Item ID yang valid');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const items: BomItem[] = bomRows.map((row) => ({
        itemId: row.itemId,
        itemType: row.itemType as 'MATERIAL' | 'SERVICE',
        quantity: row.quantity,
      }));

      await projectApi.createOrUpdateBom(projectId, items);
      setSuccess(`✅ Bill of Materials berhasil disimpan (${items.length} item)!`);
      setHasChanges(false);
      onBomSaved();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal menyimpan BoM');
    } finally {
      setLoading(false);
    }
  };

  const handleProcessRowUpdate = (newRow: any) => {
    const updatedRows = bomRows.map((row) =>
      row.id === newRow.id ? { ...row, ...newRow } : row
    );
    setBomRows(updatedRows);
    setHasChanges(true);
    return newRow;
  };

  const boqRows: GridRowsProp = estimationItems.map((item) => ({
    id: item.id,
    itemId: item.item_id,
    itemName: item.item_name || item.item_id,
    itemType: item.item_type,
    quantity: Number(item.quantity),
    hppAtEstimation: Number(item.hpp_at_estimation),
  }));

  return (
    <Box>
      {/* Header Info */}
      <Paper sx={{ p: 2, mb: 3, bgcolor: 'info.lighter' }}>
        <Stack spacing={1}>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            Bill of Quantity (BoQ) vs Bill of Materials (BoM)
          </Typography>
          <Typography variant="body2" color="text.secondary">
            BoQ adalah data dari estimasi (read-only). BoM adalah rencana material/service yang dapat Anda edit.
          </Typography>
          {!canEdit && (
            <Alert severity="warning" icon={<WarningAmberOutlinedIcon />}>
              Anda hanya dapat mengedit BoM jika Anda adalah Project Manager yang ditugaskan.
            </Alert>
          )}
        </Stack>
      </Paper>

      {/* Alerts */}
      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" onClose={() => setSuccess(null)} sx={{ mb: 2 }} icon={<CheckCircleOutlineIcon />}>
          {success}
        </Alert>
      )}

      {/* Two Column Layout */}
      <Grid container spacing={3}>
        {/* Left Panel - BoQ (Read Only) */}
        <Grid item xs={12} lg={6}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Stack spacing={2}>
              <Box>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                  <DescriptionOutlinedIcon color="primary" />
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    Bill of Quantity (BoQ)
                  </Typography>
                </Stack>
                <Chip label="Read-Only" size="small" color="default" />
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Data dari estimasi penjualan
                </Typography>
              </Box>
              <Divider />
              <Box sx={{ height: 500 }}>
                <DataGrid
                  rows={boqRows}
                  columns={boqColumns}
                  pageSize={10}
                  rowsPerPageOptions={[10, 25, 50]}
                  disableSelectionOnClick
                  density="compact"
                  sx={{
                    '& .MuiDataGrid-cell': {
                      fontSize: '0.875rem',
                    },
                  }}
                />
              </Box>
              <Alert severity="info" sx={{ mt: 2 }}>
                Total Items: <strong>{boqRows.length}</strong>
              </Alert>
            </Stack>
          </Paper>
        </Grid>

        {/* Right Panel - BoM (Editable) */}
        <Grid item xs={12} lg={6}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Stack spacing={2}>
              <Box>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                      <BuildOutlinedIcon color="success" />
                      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        Bill of Materials (BoM)
                      </Typography>
                    </Stack>
                    {canEdit ? (
                      <Chip label="Editable" size="small" color="success" />
                    ) : (
                      <Chip label="View Only" size="small" color="default" />
                    )}
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Rencana material & service untuk proyek
                    </Typography>
                  </Box>
                  {canEdit && (
                    <Stack direction="row" spacing={1}>
                      <Tooltip title="Salin dari BoQ">
                        <Button
                          variant="outlined"
                          startIcon={<ContentCopyOutlinedIcon />}
                          onClick={handleCopyFromBoq}
                          size="small"
                          disabled={loading || boqRows.length === 0}
                        >
                          Salin BoQ
                        </Button>
                      </Tooltip>
                      <Tooltip title="Tambah Item Baru">
                        <Button
                          variant="outlined"
                          startIcon={<AddCircleOutlineIcon />}
                          onClick={handleAddItem}
                          size="small"
                          disabled={loading}
                        >
                          Tambah
                        </Button>
                      </Tooltip>
                    </Stack>
                  )}
                </Stack>
              </Box>
              <Divider />
              <Box sx={{ height: 500 }}>
                <DataGrid
                  rows={bomRows}
                  columns={bomColumns}
                  pageSize={10}
                  rowsPerPageOptions={[10, 25, 50]}
                  disableSelectionOnClick
                  processRowUpdate={handleProcessRowUpdate}
                  experimentalFeatures={{ newEditingApi: true }}
                  density="compact"
                  sx={{
                    '& .MuiDataGrid-cell': {
                      fontSize: '0.875rem',
                    },
                    '& .MuiDataGrid-cell--editable': {
                      bgcolor: canEdit ? 'action.hover' : 'transparent',
                    },
                  }}
                />
              </Box>
              <Stack direction="row" spacing={2} justifyContent="space-between" alignItems="center">
                <Alert severity={bomRows.length > 0 ? 'success' : 'warning'} sx={{ flex: 1 }}>
                  Total Items: <strong>{bomRows.length}</strong>
                  {hasChanges && canEdit && <Chip label="Belum Disimpan" size="small" color="warning" sx={{ ml: 1 }} />}
                </Alert>
                {canEdit && (
                  <Button
                    variant="contained"
                    startIcon={loading ? <CircularProgress size={20} /> : <SaveOutlinedIcon />}
                    onClick={handleSaveBom}
                    disabled={loading || bomRows.length === 0 || !hasChanges}
                    size="large"
                  >
                    {loading ? 'Menyimpan...' : 'Simpan BoM'}
                  </Button>
                )}
              </Stack>
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default BoqVsBomTab;

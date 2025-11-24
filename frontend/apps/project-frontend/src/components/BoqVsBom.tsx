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
} from '@mui/material';
import { DataGrid, GridColDef, GridRowsProp } from '@mui/x-data-grid';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import DeleteIcon from '@mui/icons-material/Delete';
import { projectApi } from '../api/projectApi';
import type { EstimationItem, ProjectBOM, BomItem } from '../types';

interface BoqVsBomProps {
  projectId: string;
  estimationItems: EstimationItem[];
  existingBomItems: ProjectBOM[];
  onBomSaved: () => void;
  canEdit: boolean;
}

interface BomRow {
  id: string;
  itemId: string;
  itemType: string;
  quantity: number;
  isNew?: boolean;
}

const BoqVsBom: React.FC<BoqVsBomProps> = ({
  projectId,
  estimationItems,
  existingBomItems,
  onBomSaved,
  canEdit,
}) => {
  const [bomRows, setBomRows] = useState<BomRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (existingBomItems.length > 0) {
      setBomRows(
        existingBomItems.map((item) => ({
          id: item.id,
          itemId: item.item_id,
          itemType: item.item_type,
          quantity: Number(item.quantity),
        }))
      );
    }
  }, [existingBomItems]);

  const boqColumns: GridColDef[] = [
    { 
      field: 'itemId', 
      headerName: 'Item ID', 
      width: 250,
      flex: 1,
    },
    { 
      field: 'itemType', 
      headerName: 'Tipe', 
      width: 120,
    },
    {
      field: 'quantity',
      headerName: 'Kuantitas',
      width: 120,
      type: 'number',
    },
    {
      field: 'hppAtEstimation',
      headerName: 'HPP',
      width: 150,
      valueFormatter: (params) => {
        if (params.value) {
          return `Rp ${Number(params.value).toLocaleString('id-ID')}`;
        }
        return '-';
      },
    },
  ];

  const bomColumns: GridColDef[] = [
    { 
      field: 'itemId', 
      headerName: 'Item ID', 
      width: 250,
      flex: 1,
      editable: canEdit,
    },
    { 
      field: 'itemType', 
      headerName: 'Tipe', 
      width: 120,
      editable: canEdit,
      type: 'singleSelect',
      valueOptions: ['MATERIAL', 'SERVICE'],
    },
    {
      field: 'quantity',
      headerName: 'Kuantitas',
      width: 120,
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
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        );
      },
    },
  ];

  const handleCopyFromBoq = () => {
    const copiedRows = estimationItems.map((item, index) => ({
      id: `temp-${index}`,
      itemId: item.item_id,
      itemType: item.item_type,
      quantity: Number(item.quantity),
      isNew: true,
    }));
    setBomRows(copiedRows);
    setSuccess('BoQ berhasil disalin ke BoM. Silakan modifikasi dan simpan.');
    setError(null);
  };

  const handleAddItem = () => {
    const newRow: BomRow = {
      id: `new-${Date.now()}`,
      itemId: '',
      itemType: 'MATERIAL',
      quantity: 1,
      isNew: true,
    };
    setBomRows([...bomRows, newRow]);
  };

  const handleDeleteRow = (id: string) => {
    setBomRows(bomRows.filter((row) => row.id !== id));
  };

  const handleSaveBom = async () => {
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
      setSuccess('Rencana BoM berhasil disimpan!');
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
    return newRow;
  };

  const boqRows: GridRowsProp = estimationItems.map((item) => ({
    id: item.id,
    itemId: item.item_id,
    itemType: item.item_type,
    quantity: Number(item.quantity),
    hppAtEstimation: Number(item.hpp_at_estimation),
  }));

  return (
    <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
      {/* Left Panel - BoQ (Read-only) */}
      <Paper sx={{ flex: 1, p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Bill of Quantity (Dari Estimasi)
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Data estimasi dari tim PE (Read-only)
        </Typography>
        <DataGrid
          rows={boqRows}
          columns={boqColumns}
          autoHeight
          density="compact"
          hideFooter={boqRows.length <= 10}
          sx={{ minHeight: 300 }}
          pageSizeOptions={[10, 25, 50]}
        />
      </Paper>

      {/* Right Panel - BoM (Editable) */}
      <Paper sx={{ flex: 1, p: 3 }}>
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6">
            Bill of Materials/Services (Rencana Eksekusi)
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Rencana material & jasa untuk eksekusi proyek
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}

        {bomRows.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6, bgcolor: '#f5f5f5', borderRadius: 2 }}>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              BoM masih kosong
            </Typography>
            {canEdit && (
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                <Button
                  variant="contained"
                  startIcon={<ContentCopyIcon />}
                  onClick={handleCopyFromBoq}
                >
                  Salin dari BoQ
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={handleAddItem}
                >
                  Tambah Item Manual
                </Button>
              </Box>
            )}
          </Box>
        ) : (
          <>
            <DataGrid
              rows={bomRows}
              columns={bomColumns}
              autoHeight
              density="compact"
              hideFooter={bomRows.length <= 10}
              processRowUpdate={handleProcessRowUpdate}
              sx={{ minHeight: 300, mb: 2 }}
              pageSizeOptions={[10, 25, 50]}
            />
            {canEdit && (
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  variant="contained"
                  startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
                  onClick={handleSaveBom}
                  disabled={loading}
                >
                  Simpan Rencana BoM
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={handleAddItem}
                  disabled={loading}
                >
                  Tambah Item
                </Button>
              </Box>
            )}
          </>
        )}
      </Paper>
    </Box>
  );
};

export default BoqVsBom;

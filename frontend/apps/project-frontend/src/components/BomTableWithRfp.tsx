import React, { useMemo, useState } from 'react';
import {
  Box,
  Button,
  Paper,
  Stack,
  Typography,
  Chip,
  Divider,
  Alert,
  CircularProgress,
  IconButton,
} from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { DataGrid, GridColDef, GridSelectionModel } from '@mui/x-data-grid';
import RfpConfirmationModal from './RfpConfirmationModal';
import ConfirmDialog from './ConfirmDialog';
import { useCreateRfp } from '../hooks/useRfpHooks';

interface BomRow {
  id: string;
  itemId: string;
  itemName: string;
  itemType: 'MATERIAL' | 'SERVICE';
  quantity: number;
  available_stock?: number;
  procurement_need?: number;
  procurement_status?: string;
}

interface Props {
  projectId: string;
  bomItems: BomRow[];
  canEdit: boolean;
  onRfpCreated?: () => void;
  onBomChange?: (rows: BomRow[]) => void;
}

const BomTableWithRfp: React.FC<Props> = ({ projectId, bomItems, canEdit, onRfpCreated, onBomChange }) => {
  const [selection, setSelection] = useState<GridSelectionModel>([]);
  const [openConfirm, setOpenConfirm] = useState(false);
  const createRfp = useCreateRfp(projectId);
  const [localRows, setLocalRows] = useState<BomRow[]>(bomItems || []);

  // keep local editable rows in sync with incoming prop
  React.useEffect(() => {
    setLocalRows(
      (bomItems || []).map((r) => ({
        ...r,
        procurement_need: typeof r.procurement_need === 'number' ? r.procurement_need : Math.max(0, r.quantity - (r.available_stock || 0)),
      }))
    );
  }, [bomItems]);

  const rows = localRows;

  const columns: GridColDef[] = [
    { field: 'itemName', headerName: 'Nama Item', flex: 1, minWidth: 240 },
    {
      field: 'itemType',
      headerName: 'Tipe',
      width: 120,
      renderCell: (params) => <Chip label={String(params?.value ?? '')} size="small" />,
    },
    {
      field: 'quantity',
      headerName: 'Qty',
      width: 100,
      type: 'number',
      editable: canEdit,
    },
    {
      field: 'available_stock',
      headerName: 'Stok Tersedia',
      width: 150,
      valueFormatter: (params) => {
        const val = params?.value;
        return val === null || val === undefined ? '-' : String(val);
      },
    },
    {
      field: 'procurement_need',
      headerName: 'Kebutuhan Pengadaan',
      width: 180,
      valueFormatter: (params) => {
        const val = params?.value;
        return val === null || val === undefined ? '0' : String(val);
      },
    },
    {
      field: 'procurement_status',
      headerName: 'Status Pengadaan',
      width: 160,
      renderCell: (params) => <Chip label={String(params?.value ?? 'STOCK_SUFFICIENT')} size="small" />,
    },
    {
      field: 'actions',
      headerName: 'Aksi',
      width: 80,
      sortable: false,
      filterable: false,
      renderCell: (params) => {
        if (!canEdit) return null;
        return (
          <IconButton size="small" color="error" onClick={() => handleRequestDelete(String(params?.id))}>
            <DeleteOutlineIcon fontSize="small" />
          </IconButton>
        );
      },
    },
  ];

  const selectableIds = useMemo(() => rows.filter((r) => (r.procurement_need || 0) > 0).map((r) => r.id), [rows]);

  const handleSelectionModelChange = (newSelection: GridSelectionModel) => {
    // Only keep selectable IDs
    const filtered = (newSelection || []).filter((id) => selectableIds.includes(String(id)));
    // normalize ids to strings for consistent comparisons
    const normalized = filtered.map((id) => String(id));
    setSelection(normalized);
    // Notify parent that a user interaction happened on the BoM tab
    if (typeof onBomChange === 'function') onBomChange(rows);
  };

  const openModal = () => setOpenConfirm(true);

  const handleConfirm = async (payload: { items: any[]; notes?: string }) => {
    const items = payload.items.map((it) => ({ itemId: it.itemId, itemType: it.itemType, quantity: it.quantity }));
    try {
      await createRfp.mutateAsync({ items, notes: payload.notes });
      setOpenConfirm(false);
      setSelection([]);
      if (onRfpCreated) onRfpCreated();
    } catch (err) {
      // error handled in hook; keep modal open
    }
  };

  const handleDeleteRow = (id: string) => {
    const updated = rows.filter((r) => r.id !== id);
    setLocalRows(updated);
    if (typeof onBomChange === 'function') onBomChange(updated);
    // also ensure selection is cleared for deleted id
    setSelection((prev) => (Array.isArray(prev) ? prev.filter((s) => String(s) !== String(id)) : []));
  };

  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [confirmTargetId, setConfirmTargetId] = React.useState<string | null>(null);

  const handleRequestDelete = (id: string) => {
    setConfirmTargetId(id);
    setConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (confirmTargetId) {
      handleDeleteRow(confirmTargetId);
    }
    setConfirmTargetId(null);
    setConfirmOpen(false);
  };

  return (
    <Box>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Bill of Materials (BoM)</Typography>
          <Stack direction="row" spacing={2}>
            <Button
              variant="contained"
              disabled={selection.length === 0 || !canEdit || createRfp.isLoading}
              onClick={openModal}
            >
              {createRfp.isLoading ? <CircularProgress size={18} /> : 'Buat RFP'}
            </Button>
          </Stack>
        </Stack>
      </Paper>

      <Paper sx={{ height: '100%', p: 1, display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ flex: 1, minHeight: 0 }}>
          <DataGrid
            rows={rows}
            columns={columns}
            pageSize={10}
            rowsPerPageOptions={[10, 25, 50]}
            checkboxSelection
            onSelectionModelChange={handleSelectionModelChange}
            selectionModel={selection}
            getRowId={(r) => r.id}
            disableSelectionOnClick
            sx={{ height: '100%' }}
            experimentalFeatures={{ newEditingApi: true }}
            processRowUpdate={(newRow) => {
              const updated = rows.map((r) => (r.id === newRow.id ? { ...(r as BomRow), ...(newRow as any) } : r));
              setLocalRows(updated);
              if (typeof onBomChange === 'function') onBomChange(updated);
              return newRow;
            }}
          />
        </Box>
      </Paper>

      <RfpConfirmationModal
        open={openConfirm}
        items={rows.filter((r) => selection.includes(r.id)).map((r) => ({ itemId: r.itemId, itemType: r.itemType, itemName: r.itemName, quantity: r.procurement_need || r.quantity }))}
        onClose={() => setOpenConfirm(false)}
        onConfirm={handleConfirm}
      />
      <ConfirmDialog
        open={confirmOpen}
        title="Hapus item BoM"
        description="Yakin ingin menghapus item ini dari BoM? Aksi ini tidak bisa dibatalkan."
        confirmLabel="Hapus"
        cancelLabel="Batal"
        onClose={() => { setConfirmOpen(false); setConfirmTargetId(null); }}
        onConfirm={handleConfirmDelete}
      />
    </Box>
  );
};

export default BomTableWithRfp;

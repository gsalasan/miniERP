import React, { useMemo, useState } from 'react';
import {
  Box,
  Button,
  Stack,
  Typography,
  Chip,
  CircularProgress,
  IconButton,
} from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { DataGrid, GridColDef, GridRowSelectionModel, GridRowId } from '@mui/x-data-grid';
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
  const [selection, setSelection] = useState<readonly GridRowId[]>([]);
  const [openConfirm, setOpenConfirm] = useState(false);
  const createRfp = useCreateRfp(projectId);
  const [localRows, setLocalRows] = useState<BomRow[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // keep local editable rows in sync with incoming prop
  React.useEffect(() => {
    const safeItems = Array.isArray(bomItems) ? bomItems : [];
    const processedRows = safeItems.map((r) => ({
      ...r,
      id: r.id || `temp-${Date.now()}-${Math.random()}`,
      procurement_need: r.procurement_need || r.quantity,
      procurement_status: r.procurement_status || 'NOT_STARTED',
    }));
    setLocalRows(processedRows);
    setIsInitialized(true);
  }, [bomItems]);

  const rows = React.useMemo(() => {
    if (!isInitialized) return [];
    return Array.isArray(localRows) ? localRows : [];
  }, [localRows, isInitialized]);

  // For RFP without inventory: Allow selection of all items
  const selectableIds = useMemo(() => rows.map((r) => r.id), [rows]);

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
      headerName: 'Qty BoM',
      width: 100,
      type: 'number',
      editable: canEdit,
    },
    {
      field: 'procurement_need',
      headerName: 'Kebutuhan Pengadaan',
      width: 180,
      valueFormatter: (value: any) => {
        return value === null || value === undefined ? '0' : String(value);
      },
    },
    {
      field: 'procurement_status',
      headerName: 'Status Pengadaan',
      width: 180,
      renderCell: (params) => {
        const status = String(params?.value ?? 'NOT_STARTED');
        const colorMap: Record<string, 'default' | 'warning' | 'success' | 'info' | 'error'> = {
          NOT_STARTED: 'default',
          RFP_SUBMITTED: 'info',
          IN_PROCUREMENT: 'warning',
          RECEIVED: 'success',
          STOCK_AVAILABLE: 'success',
        };
        return <Chip label={status} size="small" color={colorMap[status] || 'default'} />;
      },
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

  const handleSelectionModelChange = (newSelection: GridRowSelectionModel) => {
    console.log('[BomTable] Selection changed:', newSelection);
    console.log('[BomTable] Selectable IDs:', selectableIds);
    
    // Convert to array if needed
    const selectionArray: readonly GridRowId[] = Array.isArray(newSelection) 
      ? newSelection 
      : [];
    
    // Only keep selectable IDs
    const filtered = selectionArray.filter((id) => selectableIds.includes(String(id)));
    console.log('[BomTable] Filtered:', filtered);
    
    setSelection(filtered);
    
    // Notify parent that a user interaction happened on the BoM tab
    if (typeof onBomChange === 'function') onBomChange(rows);
  };

  const openModal = () => setOpenConfirm(true);

  const handleConfirm = async (payload: { items: any[]; notes?: string }) => {
    const items = payload.items.map((it) => ({ itemId: it.itemId, itemType: it.itemType, quantity: it.quantity }));
    
    try {
      const result = await createRfp.mutateAsync({ items, notes: payload.notes });
      setOpenConfirm(false);
      setSelection([]);
      if (onRfpCreated) onRfpCreated();
    } catch (err) {
      console.error('Error creating RFP:', err);
      // error handled in hook with toast; keep modal open
    }
  };

  const handleDeleteRow = (id: string) => {
    const updated = rows.filter((r) => r.id !== id);
    setLocalRows(updated);
    if (typeof onBomChange === 'function') onBomChange(updated);
    // also ensure selection is cleared for deleted id
    setSelection((prev) => {
      const prevArray = Array.isArray(prev) ? prev : [];
      return prevArray.filter((s) => String(s) !== String(id));
    });
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
      {/* RFP Button */}
      {rows.length > 0 && (
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Typography variant="caption" color="text.secondary">
            {(Array.isArray(selection) ? selection.length : 0) > 0 && 
              `${Array.isArray(selection) ? selection.length : 0} item dipilih untuk RFP`}
          </Typography>
          <Button
            variant="contained"
            disabled={(Array.isArray(selection) ? selection.length : 0) === 0 || !canEdit || createRfp.isPending}
            onClick={openModal}
          >
            {createRfp.isPending ? <CircularProgress size={18} /> : 'Buat RFP'}
          </Button>
        </Stack>
      )}

      {/* DataGrid Container */}
      <Box sx={{ height: 500 }}>
        {!isInitialized ? (
          <Box display="flex" justifyContent="center" alignItems="center" height="100%">
            <CircularProgress />
          </Box>
        ) : rows.length === 0 ? (
          <Box 
            display="flex" 
            justifyContent="center" 
            alignItems="center" 
            height="100%"
            sx={{ border: '1px dashed', borderColor: 'divider', borderRadius: 1 }}
          >
            <Typography variant="body2" color="text.secondary">
              Belum ada item BoM. Salin dari BoQ atau tambah manual.
            </Typography>
          </Box>
        ) : (
          <DataGrid
            rows={rows}
            columns={columns}
            checkboxSelection
            onRowSelectionModelChange={handleSelectionModelChange}
            rowSelectionModel={selection as any}
            getRowId={(r) => r.id}
            isRowSelectable={() => true}
            disableRowSelectionOnClick
            hideFooter
            autoHeight
            sx={{ 
              minHeight: 300,
              maxHeight: 500,
              '& .MuiDataGrid-main': {
                minHeight: '300px',
              },
            }}
            processRowUpdate={(newRow) => {
              const updated = rows.map((r) => (r.id === newRow.id ? { ...(r as BomRow), ...(newRow as any) } : r));
              setLocalRows(updated);
              if (typeof onBomChange === 'function') onBomChange(updated);
              return newRow;
            }}
            onProcessRowUpdateError={(error) => {
              console.error('[BomTable] Row update error:', error);
            }}
          />
        )}
      </Box>

      <RfpConfirmationModal
        open={openConfirm}
        items={rows.filter((r) => {
          const selArray = Array.isArray(selection) ? selection : [];
          return selArray.some((id) => String(id) === String(r.id));
        }).map((r) => ({ 
          itemId: r.itemId, 
          itemType: r.itemType, 
          itemName: r.itemName, 
          quantity: r.quantity  // Use full quantity without inventory adjustment
        }))}
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

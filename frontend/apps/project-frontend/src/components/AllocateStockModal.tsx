import React, { useState, useEffect } from 'react';
import { Box, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Typography } from '@mui/material';
import { inventoryApi } from '../api/inventoryApi';

interface Props {
  open: boolean;
  onClose: () => void;
  projectId: string;
  materialId: string;
  materialName: string;
  needQty?: number; // remaining need for project
  availableQty?: number; // available in warehouse
  onAllocated?: (res: any) => void;
}

const AllocateStockModal: React.FC<Props> = ({ open, onClose, projectId, materialId, materialName, needQty = 0, availableQty = 0, onAllocated }) => {
  const [qty, setQty] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [availableLocal, setAvailableLocal] = useState<number | null>(null);
  const [loadingStock, setLoadingStock] = useState(false);

  useEffect(() => {
    setError(null);
    setAvailableLocal(null);
    setQty(0);
    if (!open) return;
    // fetch latest stock info for this project+material
    (async () => {
      try {
        setLoadingStock(true);
        const mats = await inventoryApi.getBomMaterials(projectId);
        const keyCandidates = ['material_id', 'itemId', 'id'];
        const found = mats.find((m: any) => {
          for (const k of keyCandidates) {
            if (m[k] && String(m[k]) === String(materialId)) return true;
          }
          return false;
        });
        if (found) {
          const physical = Number(found.physical_qty ?? found.physicalQty ?? 0);
          const allocatedTotal = Number(found.allocated_total ?? found.allocatedTotal ?? 0);
          const available = Number(found.available ?? found.available_qty ?? Math.max(0, physical - allocatedTotal));
          setAvailableLocal(available);
          // Prefill suggested qty as min(need, available) but not greater than need
          const suggested = Math.min(Number(needQty || 0), available);
          setQty(suggested > 0 ? suggested : Number(needQty || 0));
        } else {
          // material not found in inventory response - keep availableLocal null
          setAvailableLocal(null);
          setQty(Number(needQty || 0));
        }
      } catch (e) {
        setAvailableLocal(null);
        setQty(Number(needQty || 0));
      } finally {
        setLoadingStock(false);
      }
    })();
  }, [open, projectId, materialId, needQty]);

  const handleConfirm = async () => {
    setError(null);
    const n = Number(qty || 0);
    if (!n || n <= 0) return setError('Masukkan jumlah alokasi yang valid');
    if (availableLocal !== null && n > availableLocal) return setError('Jumlah melebihi stok tersedia');
    if (n > (needQty || 0)) return setError('Jumlah melebihi kebutuhan proyek');

    try {
      setLoading(true);
      const res = await inventoryApi.allocate({ projectId, materialId, quantity: n, need: needQty });
      if (onAllocated) onAllocated(res);
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Gagal melakukan alokasi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Alokasikan Stok — {materialName}</DialogTitle>
      <DialogContent>
        <Box sx={{ my: 1 }}>
          <Typography variant="body2">Kebutuhan: {needQty}</Typography>
          <Typography variant="body2">Stok tersedia: {loadingStock ? 'Memuat...' : (availableLocal !== null ? String(availableLocal) : 'Tidak diketahui')}</Typography>
        </Box>
        <TextField
          label="Jumlah yang dialokasikan"
          type="number"
          fullWidth
          value={qty}
          onChange={(e) => setQty(Number(e.target.value))}
          inputProps={{ min: 0, step: 0.01 }}
          helperText={error}
          error={!!error}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>Batal</Button>
        <Button onClick={handleConfirm} variant="contained" disabled={loading}>{loading ? 'Processing...' : 'Konfirmasi Alokasi'}</Button>
      </DialogActions>
    </Dialog>
  );
};

export default AllocateStockModal;

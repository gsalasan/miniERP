import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  CircularProgress,
} from "@mui/material";
import { SelectChangeEvent } from "@mui/material/Select";
import { vendorsService } from "../api/vendorsApi";
import { useNotification } from "../contexts/NotificationContext";
import { Vendor } from "../types/vendor";

type Classification = "Local" | "International" | "Principal" | "Distributor" | "Freelance";

interface VendorCreateDialogProps {
  open: boolean;
  initialName?: string;
  onClose: () => void;
  onCreated: (vendor: Vendor) => void;
}

export const VendorCreateDialog: React.FC<VendorCreateDialogProps> = ({
  open,
  initialName,
  onClose,
  onCreated,
}) => {
  const [vendorName, setVendorName] = useState(initialName || "");
  const [classification, setClassification] = useState<Classification | "">("");
  const [category, setCategory] = useState<string>("");
  const [isPreferred, setIsPreferred] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ vendor_name?: string; classification?: string }>({});

  const { showSuccess, showError } = useNotification();

  useEffect(() => {
    if (open) {
      setVendorName(initialName || "");
      setClassification("");
      setCategory("");
      setIsPreferred(false);
      setErrors({});
    }
  }, [open, initialName]);

  const validate = () => {
    const e: { vendor_name?: string; classification?: string } = {};
    if (!vendorName.trim()) e.vendor_name = "Vendor name wajib diisi";
    if (!classification) e.classification = "Classification wajib diisi";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    try {
      setLoading(true);
      const created = await vendorsService.createVendor({
        vendor_name: vendorName.trim(),
        classification: classification as Classification,
        category: category || undefined,
        is_preferred: isPreferred,
      });
      showSuccess(`Vendor "${created.vendor_name}" berhasil dibuat`);
      onCreated(created);
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Gagal membuat vendor";
      showError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle>Tambah Vendor Baru</DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={2} sx={{ mt: 0 }}>
          <Grid item xs={12}>
            <TextField
              label="Vendor Name"
              value={vendorName}
              onChange={(e) => setVendorName((e.target as unknown as { value: string }).value)}
              fullWidth
              required
              error={!!errors.vendor_name}
              helperText={errors.vendor_name}
              disabled={loading}
              autoFocus
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth required error={!!errors.classification} disabled={loading}>
              <InputLabel>Classification</InputLabel>
              <Select
                value={classification}
                label="Classification"
                onChange={(e: SelectChangeEvent) =>
                  setClassification((e.target as { value: string }).value as Classification | "")
                }
              >
                <MenuItem value="">
                  <em>Pilih classification</em>
                </MenuItem>
                <MenuItem value="Local">Local</MenuItem>
                <MenuItem value="International">International</MenuItem>
                <MenuItem value="Principal">Principal</MenuItem>
                <MenuItem value="Distributor">Distributor</MenuItem>
                <MenuItem value="Freelance">Freelance</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Category (opsional)"
              value={category}
              onChange={(e) => setCategory((e.target as unknown as { value: string }).value)}
              fullWidth
              disabled={loading}
            />
          </Grid>
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={isPreferred}
                  onChange={(e) =>
                    setIsPreferred((e.target as unknown as { checked: boolean }).checked)
                  }
                  disabled={loading}
                />
              }
              label="Preferred vendor"
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading} variant="outlined">
          Batal
        </Button>
        <Button onClick={handleSubmit} disabled={loading} variant="contained">
          {loading ? <CircularProgress size={20} /> : "Simpan"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default VendorCreateDialog;

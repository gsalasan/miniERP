import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControlLabel,
  Checkbox,
  Alert,
  Box,
  Typography,
  CircularProgress,
} from "@mui/material";
import { topApi, ChangeTOPRequest } from "../api/top";

interface EditTOPModalProps {
  open: boolean;
  onClose: () => void;
  customerId: string;
  customerName: string;
  currentTOP: number;
  onSuccess?: () => void;
}

const EditTOPModal: React.FC<EditTOPModalProps> = ({
  open,
  onClose,
  customerId,
  customerName,
  currentTOP,
  onSuccess,
}) => {
  const [formData, setFormData] = useState<ChangeTOPRequest>({
    new_top_days: currentTOP,
    effective_date: null,
    reason: "",
    request_for_approval: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleChange = (
    field: keyof ChangeTOPRequest,
    value: string | number | boolean | null,
  ) => {
    setFormData((prev: ChangeTOPRequest) => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      // Validation
      if (formData.new_top_days < 0 || formData.new_top_days > 365) {
        setError("TOP harus antara 0 sampai 365 hari");
        return;
      }

      if (!formData.reason || formData.reason.trim().length < 5) {
        setError("Alasan harus diisi minimal 5 karakter");
        return;
      }

      const result = await topApi.changeTOP(customerId, formData);

      setSuccess(result.message);

      // Close modal after 2 seconds
      setTimeout(() => {
        onClose();
        if (onSuccess) onSuccess();
        // Reset form
        setFormData({
          new_top_days: currentTOP,
          effective_date: null,
          reason: "",
          request_for_approval: false,
        });
        setSuccess(null);
      }, 2000);
    } catch (err: unknown) {
      if (err && typeof err === "object" && "response" in err) {
        const axiosError = err as {
          response?: { data?: { message?: string } };
        };
        setError(axiosError.response?.data?.message || "Gagal mengubah TOP");
      } else {
        setError("Gagal mengubah TOP");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({
        new_top_days: currentTOP,
        effective_date: null,
        reason: "",
        request_for_approval: false,
      });
      setError(null);
      setSuccess(null);
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Ubah TOP (Terms of Payment)</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2 }}>
          {/* Info Banner */}
          <Alert severity="info" sx={{ mb: 3 }}>
            Perubahan TOP hanya berlaku untuk faktur yang dibuat setelah tanggal berlaku.
            Faktur lama tidak akan diubah.
          </Alert>

          {/* Customer Info */}
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Customer: <strong>{customerName}</strong>
          </Typography>

          {/* Current TOP (Read-only) */}
          <TextField
            fullWidth
            label="TOP Saat Ini"
            value={`${currentTOP} hari`}
            disabled
            variant="outlined"
            sx={{ mb: 2 }}
          />

          {/* New TOP */}
          <TextField
            fullWidth
            label="TOP Baru"
            type="number"
            value={formData.new_top_days}
            onChange={(e) => handleChange("new_top_days", parseInt(e.target.value))}
            disabled={loading}
            required
            inputProps={{ min: 0, max: 365 }}
            helperText="Antara 0 sampai 365 hari"
            sx={{ mb: 2 }}
          />

          {/* Effective Date (Optional) */}
          <TextField
            fullWidth
            label="Tanggal Berlaku"
            type="date"
            value={formData.effective_date || ""}
            onChange={(e) => handleChange("effective_date", e.target.value || null)}
            disabled={loading}
            InputLabelProps={{ shrink: true }}
            helperText="Kosongkan untuk berlaku segera"
            sx={{ mb: 2 }}
          />

          {/* Reason */}
          <TextField
            fullWidth
            label="Alasan Perubahan"
            multiline
            rows={3}
            value={formData.reason}
            onChange={(e) => handleChange("reason", e.target.value)}
            disabled={loading}
            required
            helperText="Minimal 5 karakter"
            sx={{ mb: 2 }}
          />

          {/* Request for Approval */}
          <FormControlLabel
            control={
              <Checkbox
                checked={formData.request_for_approval || false}
                onChange={(e) =>
                  handleChange("request_for_approval", e.target.checked)
                }
                disabled={loading}
              />
            }
            label="Ajukan untuk persetujuan (tidak langsung berlaku)"
          />

          {/* Error Message */}
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}

          {/* Success Message */}
          {success && (
            <Alert severity="success" sx={{ mt: 2 }}>
              {success}
            </Alert>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Batal
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading}
                startIcon={loading ? <CircularProgress size={16} /> : null}
        >
          {loading ? "Menyimpan..." : "Simpan"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditTOPModal;
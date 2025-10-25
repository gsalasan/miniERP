import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
  IconButton,
} from "@mui/material";
import {
  Warning as WarningIcon,
  Close as CloseIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import { Material } from "../types/material";

interface DeleteConfirmationModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  material: Material | null;
  loading?: boolean;
  error?: string | null;
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  open,
  onClose,
  onConfirm,
  material,
  loading = false,
  error = null,
}) => {
  if (!material) return null;

  return (
    <Dialog open={open} onClose={!loading ? onClose : undefined} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography
            variant="h6"
            component="div"
            sx={{ display: "flex", alignItems: "center", color: "error.main" }}
          >
            <WarningIcon sx={{ mr: 1 }} />
            Delete Material
          </Typography>
          <IconButton onClick={onClose} disabled={loading}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="body2">
            <strong>Warning:</strong> This action cannot be undone. The material data will be
            permanently deleted from the system.
          </Typography>
        </Alert>

        <Typography variant="body1" gutterBottom>
          Are you sure you want to delete the following material?
        </Typography>

        <Box
          sx={{
            mt: 2,
            p: 2,
            border: "1px solid",
            borderColor: "grey.300",
            borderRadius: 1,
            bgcolor: "grey.50",
          }}
        >
          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
            {material.item_name}
          </Typography>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
            {material.brand && (
              <Typography variant="body2" color="text.secondary">
                <strong>Brand:</strong> {material.brand}
              </Typography>
            )}

            {material.owner_pn && (
              <Typography variant="body2" color="text.secondary">
                <strong>Part Number:</strong> {material.owner_pn}
              </Typography>
            )}

            {material.vendor && (
              <Typography variant="body2" color="text.secondary">
                <strong>Vendor:</strong> {material.vendor}
              </Typography>
            )}

            <Typography variant="body2" color="text.secondary">
              <strong>Status:</strong> {material.status || "Unknown"}
            </Typography>

            <Typography variant="body2" color="text.secondary">
              <strong>Location:</strong> {material.location || "Unknown"}
            </Typography>
          </Box>
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Material ID: <code>{material.id}</code>
        </Typography>
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose} disabled={loading} variant="outlined">
          Cancel
        </Button>
        <Button
          onClick={onConfirm}
          disabled={loading}
          variant="contained"
          color="error"
          startIcon={loading ? <CircularProgress size={20} /> : <DeleteIcon />}
        >
          {loading ? "Deleting..." : "Delete Material"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteConfirmationModal;

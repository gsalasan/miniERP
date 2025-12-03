import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Tabs,
  Tab,
  Box,
  List,
  ListItem,
  ListItemText,
  IconButton,
  TextField,
  Stack,
  Typography,
  Divider,
  Chip,
} from "@mui/material";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import { vendorLookupsApi } from "../api/vendorLookups";
import { useNotification } from "../hooks/useNotification";

interface LookupItem {
  value: string;
  label: string;
  created_at?: string;
}

interface ManageVendorLookupsDialogProps {
  open: boolean;
  onClose: () => void;
  onUpdated?: () => void;
}

const ManageVendorLookupsDialog: React.FC<ManageVendorLookupsDialogProps> = ({
  open,
  onClose,
  onUpdated,
}) => {
  const [tab, setTab] = useState(0);
  const [categories, setCategories] = useState<LookupItem[]>([]);
  const [classifications, setClassifications] = useState<LookupItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingItem, setEditingItem] = useState<LookupItem | null>(null);
  const [newItemValue, setNewItemValue] = useState("");
  const [newItemLabel, setNewItemLabel] = useState("");
  const notification = useNotification();

  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [cats, classifs] = await Promise.all([
        vendorLookupsApi.getCategories(),
        vendorLookupsApi.getClassifications(),
      ]);
      setCategories(cats);
      setClassifications(classifs);
    } catch (err) {
      notification.error("Gagal memuat data");
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async () => {
    if (!newItemValue.trim()) {
      notification.warning("Value harus diisi");
      return;
    }
    try {
      setLoading(true);
      await vendorLookupsApi.createCategory({
        value: newItemValue.trim(),
        label: newItemLabel.trim() || newItemValue.trim(),
      });
      notification.success("Category berhasil ditambahkan");
      setNewItemValue("");
      setNewItemLabel("");
      await loadData();
      onUpdated?.();
    } catch (err) {
      notification.error(err instanceof Error ? err.message : "Gagal menambahkan category");
    } finally {
      setLoading(false);
    }
  };

  const handleAddClassification = async () => {
    if (!newItemValue.trim()) {
      notification.warning("Value harus diisi");
      return;
    }
    try {
      setLoading(true);
      await vendorLookupsApi.createClassification({
        value: newItemValue.trim(),
        label: newItemLabel.trim() || newItemValue.trim(),
      });
      notification.success("Classification berhasil ditambahkan");
      setNewItemValue("");
      setNewItemLabel("");
      await loadData();
      onUpdated?.();
    } catch (err) {
      notification.error(err instanceof Error ? err.message : "Gagal menambahkan classification");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = async (value: string) => {
    if (!window.confirm(`Hapus category "${value}"?`)) return;
    try {
      setLoading(true);
      const result = await vendorLookupsApi.deleteCategory(value, { force: false });
      if (result.success) {
        notification.success("Category berhasil dihapus");
        await loadData();
        onUpdated?.();
      } else if (result.used && result.used.length > 0) {
        const confirm = window.confirm(
          `Category ini digunakan oleh ${result.used.length} vendor. Hapus paksa dan set category vendor menjadi kosong?`
        );
        if (confirm) {
          await vendorLookupsApi.deleteCategory(value, { force: true });
          notification.success("Category berhasil dihapus (force)");
          await loadData();
          onUpdated?.();
        }
      }
    } catch (err) {
      notification.error(err instanceof Error ? err.message : "Gagal menghapus category");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClassification = async (value: string) => {
    if (!window.confirm(`Hapus classification "${value}"?`)) return;
    try {
      setLoading(true);
      const result = await vendorLookupsApi.deleteClassification(value, { force: false });
      if (result.success) {
        notification.success("Classification berhasil dihapus");
        await loadData();
        onUpdated?.();
      } else if (result.used && result.used.length > 0) {
        const confirm = window.confirm(
          `Classification ini digunakan oleh ${result.used.length} vendor. Hapus paksa dan set classification vendor menjadi kosong?`
        );
        if (confirm) {
          await vendorLookupsApi.deleteClassification(value, { force: true });
          notification.success("Classification berhasil dihapus (force)");
          await loadData();
          onUpdated?.();
        }
      }
    } catch (err) {
      notification.error(err instanceof Error ? err.message : "Gagal menghapus classification");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="h6" fontWeight={600}>
            Kelola Category & Classification
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
          <Tab label="Category" />
          <Tab label="Classification" />
        </Tabs>

        {tab === 0 && (
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Jenis produk atau layanan yang disediakan vendor
            </Typography>

            <Stack spacing={2} sx={{ mb: 3 }}>
              <TextField
                label="Value (ID)"
                value={newItemValue}
                onChange={(e) => setNewItemValue(e.target.value)}
                size="small"
                fullWidth
                placeholder="e.g., Material"
              />
              <TextField
                label="Label (Display)"
                value={newItemLabel}
                onChange={(e) => setNewItemLabel(e.target.value)}
                size="small"
                fullWidth
                placeholder="e.g., Material - Bahan fisik"
              />
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleAddCategory}
                disabled={loading || !newItemValue.trim()}
                fullWidth
              >
                Tambah Category
              </Button>
            </Stack>

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Daftar Category ({categories.length})
            </Typography>
            <List dense>
              {categories.map((item) => (
                <ListItem
                  key={item.value}
                  secondaryAction={
                    <IconButton
                      edge="end"
                      onClick={() => handleDeleteCategory(item.value)}
                      disabled={loading}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  }
                  sx={{
                    bgcolor: "#f9fafb",
                    borderRadius: 1,
                    mb: 1,
                    border: "1px solid #e5e7eb",
                  }}
                >
                  <ListItemText
                    primary={
                      <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                        <Chip label={item.value} size="small" color="primary" />
                        <Typography variant="body2">{item.label}</Typography>
                      </Box>
                    }
                  />
                </ListItem>
              ))}
              {categories.length === 0 && (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", py: 2 }}>
                  Belum ada category
                </Typography>
              )}
            </List>
          </Box>
        )}

        {tab === 1 && (
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Tipe hubungan kerja atau asal vendor
            </Typography>

            <Stack spacing={2} sx={{ mb: 3 }}>
              <TextField
                label="Value (ID)"
                value={newItemValue}
                onChange={(e) => setNewItemValue(e.target.value)}
                size="small"
                fullWidth
                placeholder="e.g., Local"
              />
              <TextField
                label="Label (Display)"
                value={newItemLabel}
                onChange={(e) => setNewItemLabel(e.target.value)}
                size="small"
                fullWidth
                placeholder="e.g., Local - Vendor dalam negeri"
              />
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleAddClassification}
                disabled={loading || !newItemValue.trim()}
                fullWidth
              >
                Tambah Classification
              </Button>
            </Stack>

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Daftar Classification ({classifications.length})
            </Typography>
            <List dense>
              {classifications.map((item) => (
                <ListItem
                  key={item.value}
                  secondaryAction={
                    <IconButton
                      edge="end"
                      onClick={() => handleDeleteClassification(item.value)}
                      disabled={loading}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  }
                  sx={{
                    bgcolor: "#f9fafb",
                    borderRadius: 1,
                    mb: 1,
                    border: "1px solid #e5e7eb",
                  }}
                >
                  <ListItemText
                    primary={
                      <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                        <Chip label={item.value} size="small" color="secondary" />
                        <Typography variant="body2">{item.label}</Typography>
                      </Box>
                    }
                  />
                </ListItem>
              ))}
              {classifications.length === 0 && (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", py: 2 }}>
                  Belum ada classification
                </Typography>
              )}
            </List>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} variant="outlined">
          Tutup
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ManageVendorLookupsDialog;

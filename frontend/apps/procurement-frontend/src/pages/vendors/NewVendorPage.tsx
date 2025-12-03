import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Paper,
  Button,
  Breadcrumbs,
  Link,
  TextField,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Stack,
  Divider,
  IconButton,
  Tooltip,
} from "@mui/material";
import { 
  ArrowBack as ArrowBackIcon, 
  Save as SaveIcon,
  Settings as SettingsIcon,
} from "@mui/icons-material";
import { vendorsApi } from "../../api/vendors";
import { vendorLookupsApi } from "../../api/vendorLookups";
import { useNotification } from "../../hooks/useNotification";
import ManageVendorLookupsDialog from "../../components/ManageVendorLookupsDialog";

interface LookupItem {
  value: string;
  label: string;
}

const NewVendorPage: React.FC = () => {
  const navigate = useNavigate();
  const notification = useNotification();
  const [loading, setLoading] = useState(false);
  const [categoryOptions, setCategoryOptions] = useState<LookupItem[]>([]);
  const [classificationOptions, setClassificationOptions] = useState<LookupItem[]>([]);
  const [openManageDialog, setOpenManageDialog] = useState(false);

  const [formData, setFormData] = useState({
    vendor_name: "",
    category: "",
    classification: "",
    is_preferred: false,
  });

  useEffect(() => {
    loadLookups();
  }, []);

  const loadLookups = async () => {
    try {
      const [cats, classifs] = await Promise.all([
        vendorLookupsApi.getCategories(),
        vendorLookupsApi.getClassifications(),
      ]);
      setCategoryOptions(cats);
      setClassificationOptions(classifs);
    } catch (err) {
      notification.error("Gagal memuat data category dan classification");
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);

      if (!formData.vendor_name.trim()) {
        notification.warning("Vendor name harus diisi");
        return;
      }

      const payload = {
        vendor_name: formData.vendor_name.trim(),
        category: formData.category?.trim() || undefined,
        classification: formData.classification,
        is_preferred: !!formData.is_preferred,
      };

      await vendorsApi.createVendor(payload);
      notification.success("Vendor berhasil dibuat!");
      setTimeout(() => navigate("/vendors"), 1200);
    } catch (err) {
      notification.error(err instanceof Error ? err.message : "Gagal membuat vendor");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    try {
      navigate(-1);
    } catch {
      navigate("/vendors");
    }
  };

  return (
    <Box sx={{ maxWidth: 980, mx: "auto", p: 3 }}>
      <Breadcrumbs sx={{ mb: 3 }}>
        <Link
          component="button"
          variant="body1"
          onClick={() => navigate("/vendors")}
          sx={{ textDecoration: "none" }}
        >
          Vendors
        </Link>
        <Typography color="text.primary">Tambah Vendor Baru</Typography>
      </Breadcrumbs>

      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", sm: "center" },
          gap: 2,
          mb: 3,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Button
            type="button"
            onClick={handleCancel}
            startIcon={<ArrowBackIcon />}
            variant="outlined"
            size="small"
          >
            Kembali
          </Button>
          <Typography variant="h4" component="h1" fontWeight={600}>
            Tambah Vendor Baru
          </Typography>
        </Box>

        <Box sx={{ display: "flex", gap: 2 }}>
          <Button type="button" onClick={handleCancel} variant="outlined" disabled={loading}>
            Batal
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            startIcon={<SaveIcon />}
            disabled={loading}
          >
            {loading ? "Menyimpan..." : "Simpan"}
          </Button>
        </Box>
      </Box>

      <Paper
        elevation={4}
        sx={{
          p: 3,
          borderRadius: 3,
          background: "linear-gradient(145deg,#ffffff 0%, #f6fbff 100%)",
        }}
      >
        <Box sx={{ display: { xs: "block", md: "flex" }, gap: 3 }}>
          <Box sx={{ flex: 1 }}>
            <Stack spacing={2}>
              <TextField
                label="Vendor Name"
                value={formData.vendor_name}
                onChange={(e) => setFormData({ ...formData, vendor_name: e.target.value })}
                fullWidth
                required
                size="small"
                placeholder="Contoh: PT Sumber Makmur"
                helperText="Nama perusahaan pemasok"
              />

              <Box sx={{ display: "flex", gap: 1, alignItems: "flex-start" }}>
                <TextField
                  select
                  label="Category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  fullWidth
                  size="small"
                  helperText="Jenis produk atau layanan yang disediakan"
                >
                  <MenuItem value="">
                    <em>-- Pilih kategori --</em>
                  </MenuItem>
                  {categoryOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
                <Tooltip title="Kelola Category & Classification">
                  <IconButton 
                    onClick={() => setOpenManageDialog(true)} 
                    color="primary"
                    sx={{ mt: 0.5 }}
                  >
                    <SettingsIcon />
                  </IconButton>
                </Tooltip>
              </Box>

              <Box sx={{ display: "flex", gap: 1, alignItems: "flex-start" }}>
                <TextField
                  select
                  label="Classification"
                  value={formData.classification}
                  onChange={(e) => setFormData({ ...formData, classification: e.target.value })}
                  fullWidth
                  size="small"
                  helperText="Tipe hubungan kerja atau asal vendor"
                >
                  <MenuItem value="">
                    <em>-- Pilih klasifikasi --</em>
                  </MenuItem>
                  {classificationOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
                <Tooltip title="Kelola Category & Classification">
                  <IconButton 
                    onClick={() => setOpenManageDialog(true)} 
                    color="primary"
                    sx={{ mt: 0.5 }}
                  >
                    <SettingsIcon />
                  </IconButton>
                </Tooltip>
              </Box>

              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.is_preferred}
                    onChange={(e) => setFormData({ ...formData, is_preferred: e.target.checked })}
                  />
                }
                label="Mark as preferred vendor"
              />
            </Stack>
          </Box>

          <Divider orientation="vertical" flexItem sx={{ display: { xs: "none", md: "block" } }} />

          <Box
            sx={{
              width: { xs: "100%", md: 300 },
              bgcolor: "#fff",
              borderRadius: 2,
              p: 2,
              boxShadow: "0 6px 18px rgba(2,6,23,0.06)",
            }}
          >
            <Typography variant="subtitle2" sx={{ color: "text.secondary", mb: 1 }}>
              Preview
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {formData.vendor_name || "Vendor Name"}
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary", mt: 1 }}>
              {formData.category || "Category"}
            </Typography>
            <Box sx={{ display: "flex", gap: 1, mt: 2, alignItems: "center" }}>
              <Box sx={{ bgcolor: "#eef6ff", px: 1.25, py: 0.5, borderRadius: 2, fontWeight: 600 }}>
                {formData.classification}
              </Box>
              {formData.is_preferred && (
                <Box sx={{ bgcolor: "#fff7e6", px: 1.25, py: 0.5, borderRadius: 2 }}>Preferred</Box>
              )}
            </Box>
          </Box>
        </Box>
      </Paper>

      <ManageVendorLookupsDialog
        open={openManageDialog}
        onClose={() => setOpenManageDialog(false)}
        onUpdated={loadLookups}
      />
    </Box>
  );
};

export default NewVendorPage;
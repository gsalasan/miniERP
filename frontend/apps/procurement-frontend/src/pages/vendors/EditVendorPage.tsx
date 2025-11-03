import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  Breadcrumbs,
  Link,
  FormControlLabel,
  Switch,
  MenuItem,
} from "@mui/material";
import { ArrowBack as ArrowBackIcon, Save as SaveIcon } from "@mui/icons-material";
import { vendorsApi } from "../../api/vendors";
import { Vendor } from "../../types/vendor";
import { LoadingSpinner } from "../../components";
import { useNotification } from "../../hooks/useNotification";

// Category: Jenis produk/layanan yang disediakan vendor
const categoryOptions = [
  { value: "Material", label: "Material - Bahan fisik (kabel, pipa, sensor, besi)" },
  { value: "Service", label: "Service - Jasa (instalasi, maintenance, konsultasi)" },
  { value: "Equipment", label: "Equipment - Alat, mesin, perangkat" },
  { value: "Logistics", label: "Logistics - Transportasi & pengiriman" },
  { value: "Subcontractor", label: "Subcontractor - Pelaksana pekerjaan proyek" },
];

// Classification: Tipe hubungan kerja atau asal vendor
const classificationOptions = [
  { value: "Local", label: "Local - Vendor dalam negeri" },
  { value: "International", label: "International - Vendor luar negeri (impor)" },
  { value: "Principal", label: "Principal - Produsen utama/merek asli" },
  { value: "Distributor", label: "Distributor - Penyalur resmi dari principal" },
  { value: "Freelance", label: "Freelance - Penyedia jasa individu" },
];

const EditVendorPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const notification = useNotification();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState<Partial<Vendor>>({
    vendor_name: "",
    category: "",
    classification: "",
    is_preferred: false,
  });

  const loadVendor = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const data = await vendorsApi.getVendor(id);
      setVendor(data);
      setFormData({
        vendor_name: data.vendor_name,
        category: data.category || "",
        classification: data.classification,
        is_preferred: data.is_preferred || false,
      });
    } catch (err) {
      notification.error(
        err instanceof Error ? err.message : "Terjadi kesalahan saat memuat data vendor",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVendor();
  }, [id]);

  const handleSave = async () => {
    if (!id || !vendor) return;

    try {
      setSaving(true);

      if (!formData.vendor_name?.trim()) {
        notification.warning("Nama vendor harus diisi");
        setSaving(false);
        return;
      }

      if (!formData.category?.trim()) {
        notification.warning("Category harus dipilih");
        setSaving(false);
        return;
      }

      if (!formData.classification?.trim()) {
        notification.warning("Classification harus dipilih");
        setSaving(false);
        return;
      }

      // Prepare clean payload
      const payload = {
        vendor_name: formData.vendor_name.trim(),
        category: formData.category.trim(),
        classification: formData.classification.trim(),
        is_preferred: formData.is_preferred || false,
      };

      await vendorsApi.updateVendor(id, payload);
      notification.success("Vendor berhasil diupdate!");
      setTimeout(() => {
        navigate(`/vendors/${id}`);
      }, 1500);
    } catch (err) {
      notification.error(err instanceof Error ? err.message : "Gagal mengupdate vendor");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate(`/vendors/${id}`);
  };

  if (loading) {
    return <LoadingSpinner message="Memuat data vendor..." />;
  }

  if (!vendor) {
    return (
      <Box sx={{ maxWidth: 1200, mx: "auto", p: 3 }}>
        <Typography color="error">Vendor tidak ditemukan</Typography>
        <Button onClick={() => navigate("/vendors")} sx={{ mt: 2 }}>
          Kembali ke Daftar Vendor
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: "auto", p: 3 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 3 }}>
        <Link
          component="button"
          variant="body1"
          onClick={() => navigate("/vendors")}
          sx={{ textDecoration: "none" }}
        >
          Vendors
        </Link>
        <Link
          component="button"
          variant="body1"
          onClick={() => navigate(`/vendors/${id}`)}
          sx={{ textDecoration: "none" }}
        >
          {vendor.vendor_name}
        </Link>
        <Typography color="text.primary">Edit</Typography>
      </Breadcrumbs>

      {/* Header */}
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
            Edit Vendor - {vendor.vendor_name}
          </Typography>
        </Box>

        <Box sx={{ display: "flex", gap: 2 }}>
          <Button type="button" onClick={handleCancel} variant="outlined" disabled={saving}>
            Batal
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            startIcon={<SaveIcon />}
            disabled={saving}
          >
            {saving ? "Menyimpan..." : "Simpan"}
          </Button>
        </Box>
      </Box>

      {/* Form */}
      <Paper
        elevation={2}
        sx={{
          p: 4,
          borderRadius: 3,
          background: "linear-gradient(145deg, #ffffff 0%, #f8faff 100%)",
        }}
      >
        <Typography variant="h6" fontWeight={600} mb={3}>
          Informasi Vendor
        </Typography>

        <Box sx={{ display: "grid", gap: 3 }}>
          <TextField
            fullWidth
            label="Nama Vendor"
            value={formData.vendor_name || ""}
            onChange={(e) => setFormData({ ...formData, vendor_name: e.target.value })}
            required
            disabled={saving}
            variant="outlined"
          />

          <TextField
            fullWidth
            select
            label="Category"
            value={formData.category || ""}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            disabled={saving}
            variant="outlined"
            helperText="Jenis produk atau layanan yang disediakan"
          >
            <MenuItem value="">
              <em>Pilih kategori</em>
            </MenuItem>
            {categoryOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            fullWidth
            select
            label="Classification"
            value={formData.classification || ""}
            onChange={(e) => setFormData({ ...formData, classification: e.target.value })}
            disabled={saving}
            variant="outlined"
            helperText="Tipe hubungan kerja atau asal vendor"
          >
            <MenuItem value="">
              <em>Pilih klasifikasi</em>
            </MenuItem>
            {classificationOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>

          <FormControlLabel
            control={
              <Switch
                checked={formData.is_preferred || false}
                onChange={(e) => setFormData({ ...formData, is_preferred: e.target.checked })}
                disabled={saving}
              />
            }
            label="Preferred Vendor (Vendor Unggulan)"
          />
        </Box>
      </Paper>
    </Box>
  );
};

export default EditVendorPage;
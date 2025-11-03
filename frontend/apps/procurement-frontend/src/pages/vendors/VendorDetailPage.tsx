import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Breadcrumbs,
  Link,
  Grid,
  Chip,
  TextField,
} from "@mui/material";
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  ArrowBack as ArrowBackIcon,
  Store as StoreIcon,
} from "@mui/icons-material";
import StatusBadge from "../../components/StatusBadge";
import { DataGrid, GridColDef, GridActionsCellItem } from "@mui/x-data-grid";
import { vendorsApi } from "../../api/vendors";
import { vendorPricelistApi } from "../../api/vendorPricelist";
import { Vendor } from "../../types/vendor";
import { LoadingSpinner } from "../../components";
import { useNotification } from "../../hooks/useNotification";

const VendorDetailPage: React.FC = () => {
  const params = useParams();
  const id = params.id || params["*"]?.split("/")?.[0];
  const navigate = useNavigate();
  const notification = useNotification();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [loading, setLoading] = useState(true);
  const [prices, setPrices] = useState<any[]>([]);

  const [editPriceDialogOpen, setEditPriceDialogOpen] = useState(false);
  const [editingPrice, setEditingPrice] = useState<any | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

  const load = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const v = await vendorsApi.getVendor(id as string);
      setVendor(v);
      const all = await vendorPricelistApi.getAll();
      const filtered = all.filter((p: any) => String(p.vendor_id) === String(id));
      setPrices(filtered);
    } catch (err) {
      notification.error(err instanceof Error ? err.message : "Terjadi kesalahan saat memuat data");
      // eslint-disable-next-line no-console
      console.error("Error loading vendor detail", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const handleEdit = () => {
    navigate(`/vendors/${id}/edit`);
  };

  const handleDelete = async () => {
    if (!id || !vendor) return;

    if (window.confirm(`Apakah Anda yakin ingin menghapus vendor "${vendor.vendor_name}"?`)) {
      try {
        await vendorsApi.deleteVendor(id);
        notification.success("Vendor berhasil dihapus");
        navigate("/vendors");
      } catch (err) {
        notification.error(err instanceof Error ? err.message : "Gagal menghapus vendor");
      }
    }
  };

  const handleBack = () => {
    navigate("/vendors");
  };

  const handleDeletePrice = async (priceId: string) => {
    if (!window.confirm("Hapus entry harga ini?")) return;
    try {
      setDeleteLoading(priceId);
      await vendorPricelistApi.delete(priceId);
      notification.success("Harga berhasil dihapus");
      await load();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
      notification.error("Gagal menghapus harga");
    } finally {
      setDeleteLoading(null);
    }
  };

  const openEditPrice = (row: any) => {
    setEditingPrice(row);
    setEditPriceDialogOpen(true);
  };

  const columns: GridColDef[] = [
    {
      field: "material_name",
      headerName: "Material",
      width: 260,
      renderCell: (params: any) => {
        const row = params?.row;
        if (!row) return "-";
        return row.Material?.item_name || row.material_id || "-";
      },
    },
    {
      field: "price",
      headerName: "Price",
      width: 140,
      renderCell: (params: any) => {
        const row = params?.row;
        if (!row) return "-";
        const price = Number(row.price ?? 0);
        return `${row.currency || "IDR"} ${price.toLocaleString("id-ID")}`;
      },
    },
    {
      field: "currency",
      headerName: "Currency",
      width: 110,
      renderCell: (params: any) => params?.row?.currency || "IDR",
    },
    {
      field: "updated",
      headerName: "Updated",
      width: 200,
      renderCell: (params: any) => {
        const row = params?.row;
        if (!row || !row.price_updated_at) return "-";
        return new Date(row.price_updated_at).toLocaleString("id-ID");
      },
    },
    {
      field: "actions",
      type: "actions",
      headerName: "Aksi",
      width: 120,
      getActions: (params: any) => [
        <GridActionsCellItem
          icon={<EditIcon />}
          label="Edit"
          onClick={() => openEditPrice(params?.row)}
          key="edit"
        />,
        <GridActionsCellItem
          icon={<DeleteIcon />}
          label="Delete"
          onClick={() => handleDeletePrice(params?.row?.id)}
          key="delete"
          disabled={deleteLoading === params?.row?.id}
        />,
      ],
    },
  ];

  const handleSavePrice = async () => {
    if (!editingPrice) return;
    try {
      await vendorPricelistApi.update(editingPrice.id, editingPrice);
      setEditPriceDialogOpen(false);
      setSnack("Harga diperbarui");
      await load();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
      setSnack("Gagal memperbarui harga");
    }
  };

  if (loading) {
    return <LoadingSpinner message="Memuat data vendor..." />;
  }

  if (!vendor) {
    return (
      <Box sx={{ maxWidth: 1200, mx: "auto", p: 3 }}>
        <Typography color="warning.main">Vendor tidak ditemukan</Typography>
        <Button onClick={handleBack} sx={{ mt: 2 }}>
          Kembali ke Daftar Vendor
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: "auto", p: { xs: 1, md: 2, lg: 3 } }}>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link
          component="button"
          onClick={handleBack}
          underline="none"
          sx={{ textDecoration: "none" }}
        >
          Vendors
        </Link>
        <Typography color="text.primary">{vendor?.vendor_name || "Vendor"}</Typography>
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
            onClick={handleBack}
            startIcon={<ArrowBackIcon />}
            variant="outlined"
            size="small"
          >
            Kembali
          </Button>
          <StoreIcon sx={{ fontSize: 40, color: "primary.main" }} />
          <Box>
            <Typography variant="h4" component="h1" fontWeight={600}>
              {vendor.vendor_name}
            </Typography>
            <StatusBadge preferred={vendor.is_preferred} />
          </Box>
        </Box>

        <Box sx={{ display: "flex", gap: 2 }}>
          <Button
            onClick={handleDelete}
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
          >
            Hapus
          </Button>
          <Button onClick={handleEdit} variant="contained" startIcon={<EditIcon />}>
            Edit
          </Button>
        </Box>
      </Box>

      {/* Vendor Information */}
      <Paper
        elevation={2}
        sx={{
          p: 4,
          borderRadius: 3,
          mb: 3,
          background: "linear-gradient(145deg, #ffffff 0%, #f8faff 100%)",
        }}
      >
        <Typography variant="h6" fontWeight={600} mb={3}>
          Informasi Vendor
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary" mb={0.5}>
              Nama Vendor
            </Typography>
            <Typography variant="body1" fontWeight={500}>
              {vendor.vendor_name}
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary" mb={0.5}>
              Category
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Chip
                label={vendor.category || "Tidak ada"}
                color={vendor.category ? "primary" : "default"}
                size="small"
                variant="outlined"
              />
              <Typography variant="caption" color="text.secondary">
                {vendor.category === "Material" && "Bahan fisik"}
                {vendor.category === "Service" && "Jasa"}
                {vendor.category === "Equipment" && "Alat/Mesin"}
                {vendor.category === "Logistics" && "Transportasi"}
                {vendor.category === "Subcontractor" && "Pelaksana proyek"}
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary" mb={0.5}>
              Classification
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Chip
                label={vendor.classification || "Tidak ada"}
                color={vendor.classification ? "secondary" : "default"}
                size="small"
              />
              <Typography variant="caption" color="text.secondary">
                {vendor.classification === "Local" && "Dalam negeri"}
                {vendor.classification === "International" && "Luar negeri"}
                {vendor.classification === "Principal" && "Produsen utama"}
                {vendor.classification === "Distributor" && "Penyalur resmi"}
                {vendor.classification === "Freelance" && "Individu"}
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary" mb={0.5}>
              Status
            </Typography>
            <StatusBadge preferred={vendor.is_preferred} />
          </Grid>

          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary" mb={0.5}>
              Created At
            </Typography>
            <Typography variant="body1" fontWeight={500}>
              {new Date(vendor.created_at).toLocaleString("id-ID")}
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary" mb={0.5}>
              Updated At
            </Typography>
            <Typography variant="body1" fontWeight={500}>
              {new Date(vendor.updated_at).toLocaleString("id-ID")}
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Vendor Pricelist */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          Vendor Pricelist ({prices.length})
        </Typography>
        <Button
          startIcon={<AddIcon />}
          variant="outlined"
          onClick={() => navigate(`/vendor-pricelist/new?vendor_id=${id}`)}
        >
          Tambah Harga
        </Button>
      </Box>

      <Paper sx={{ p: 2 }} elevation={2}>
        {prices.length === 0 ? (
          <Alert severity="info" sx={{ borderRadius: 2 }}>
            Belum ada harga untuk vendor ini.
          </Alert>
        ) : (
          <Box sx={{ height: 420 }}>
            <DataGrid
              rows={prices}
              columns={columns}
              getRowId={(r: any) => r.id}
              pageSizeOptions={[5, 10, 25]}
              initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
            />
          </Box>
        )}
      </Paper>

      {/* Edit Price Dialog */}
      <Dialog
        open={editPriceDialogOpen}
        onClose={() => setEditPriceDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Edit Price</DialogTitle>
        <DialogContent>
          {editingPrice && (
            <Box sx={{ display: "grid", gap: 2, mt: 1 }}>
              <TextField
                label="Material"
                value={editingPrice.Material?.item_name || editingPrice.material_id}
                fullWidth
                disabled
              />
              <TextField
                label="Price"
                value={editingPrice.price}
                onChange={(e) => setEditingPrice({ ...editingPrice, price: e.target.value })}
                fullWidth
              />
              <TextField
                label="Currency"
                value={editingPrice.currency}
                onChange={(e) => setEditingPrice({ ...editingPrice, currency: e.target.value })}
                fullWidth
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditPriceDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSavePrice}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default VendorDetailPage;

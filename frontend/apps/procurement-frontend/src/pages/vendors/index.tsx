import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Typography,
  Button,
  Alert,
  Tabs,
  Tab,
  TextField,
  InputAdornment,
  useTheme,
  MenuItem,
  Paper,
  Stack,
  Chip,
  Tooltip,
} from "@mui/material";
import { DataGrid, GridColDef, GridActionsCellItem, GridRenderCellParams } from "@mui/x-data-grid";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
} from "@mui/icons-material";
import { vendorsApi } from "../../api/vendors";
import { vendorPricelistApi } from "../../api/vendorPricelist";
import { materialsApi } from "../../api/materials";
import { Vendor } from "../../types/vendor";
import { VendorPrice } from "../../types/vendorPricelist";
import type { Material } from "../../types/material";
import { StatusBadge, LoadingSpinner, EmptyState } from "../../components";
import { useNavigate, useLocation } from "react-router-dom";

const VendorsPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [prices, setPrices] = useState<VendorPrice[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loadingPrices, setLoadingPrices] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState(0);
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [classificationFilter, setClassificationFilter] = useState<string>("");
  const [vendorFilter, setVendorFilter] = useState("");
  const [materialFilter, setMaterialFilter] = useState("");
  const theme = useTheme();

  // Read tab from URL query parameter
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get("tab");
    if (tabParam === "1") {
      setTab(1);
    }
  }, [location.search]);

  const loadVendors = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await vendorsApi.getAllVendors();
      setVendors(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan saat memuat data");
      // eslint-disable-next-line no-console
      console.error("Error loading vendors:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVendors();
  }, []);

  useEffect(() => {
    // load pricelist when pricelist tab is shown
    if (tab !== 1) return;
    const loadPrices = async () => {
      try {
        setLoadingPrices(true);
        // Load pricelist first
        const priceData = await vendorPricelistApi.getAll();
        setPrices(priceData);

        // Try to load materials, but don't fail if it errors
        try {
          const materialData = await materialsApi.getAll();
          setMaterials(materialData);
        } catch (materialErr) {
          // eslint-disable-next-line no-console
          console.warn("Could not load materials:", materialErr);
          setMaterials([]);
        }

        // eslint-disable-next-line no-console
        console.log("Vendor Pricelist data:", priceData);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("Error loading vendor pricelist:", err);
        setError("Gagal memuat data vendor pricelist");
      } finally {
        setLoadingPrices(false);
      }
    };
    loadPrices();
  }, [tab]);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus vendor ini?")) return;
    try {
      await vendorsApi.deleteVendor(id);
      await loadVendors();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan saat menghapus vendor");
      // eslint-disable-next-line no-console
      console.error("Error deleting vendor:", err);
    }
  };

  const handleDeletePrice = async (id: string) => {
    if (!window.confirm("Hapus entry ini?")) return;
    try {
      await vendorPricelistApi.delete(id);
      // Reload prices
      const priceData = await vendorPricelistApi.getAll();
      setPrices(priceData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menghapus");
    }
  };

  const filteredVendors = useMemo(() => {
    let filtered = vendors;
    if (query.trim()) {
      const q = query.toLowerCase();
      filtered = filtered.filter((v) =>
        [v.vendor_name, v.category, v.classification].some((s) =>
          (s || "").toLowerCase().includes(q),
        ),
      );
    }
    if (categoryFilter) {
      filtered = filtered.filter((v) => v.category === categoryFilter);
    }
    if (classificationFilter) {
      filtered = filtered.filter((v) => v.classification === classificationFilter);
    }
    return filtered;
  }, [vendors, query, categoryFilter, classificationFilter]);

  const filteredPrices = useMemo(() => {
    let filtered = prices;
    if (vendorFilter) {
      filtered = filtered.filter((item) => item.vendor_id === vendorFilter);
    }
    if (materialFilter) {
      filtered = filtered.filter((item) => item.material_id === materialFilter);
    }
    return filtered;
  }, [prices, vendorFilter, materialFilter]);

  const columns: GridColDef[] = [
    {
      field: "vendor_name",
      headerName: "Vendor",
      width: 250,
      renderCell: (params: GridRenderCellParams<Vendor, string>) => (
        <Button
          variant="text"
          sx={{ p: 0, textTransform: "none" }}
          onClick={() => navigate(`/vendors/${params.row.id}`)}
        >
          {params.value}
        </Button>
      ),
    },
    {
      field: "category",
      headerName: "Category",
      width: 160,
      renderCell: (params: GridRenderCellParams<Vendor, string>) => (
        <Chip
          label={params.value || "N/A"}
          size="small"
          color={params.value ? "primary" : "default"}
          variant="outlined"
        />
      ),
    },
    {
      field: "classification",
      headerName: "Classification",
      width: 160,
      renderCell: (params: GridRenderCellParams<Vendor, string>) => (
        <Chip
          label={params.value || "N/A"}
          size="small"
          color={params.value ? "secondary" : "default"}
        />
      ),
    },
    {
      field: "is_preferred",
      headerName: "Preferred",
      width: 120,
      renderCell: (params: GridRenderCellParams<Vendor, boolean>) => (
        <StatusBadge preferred={!!params.value} />
      ),
    },
    {
      field: "created_at",
      headerName: "Created",
      width: 180,
      valueFormatter: (value) => (value ? new Date(String(value)).toLocaleString() : "-"),
    },
    {
      field: "actions",
      type: "actions",
      headerName: "Aksi",
      width: 180,
      getActions: (params) => [
        <GridActionsCellItem
          key="view"
          icon={<VisibilityIcon />}
          label="Detail"
          onClick={() => navigate(`/vendors/${params.row.id}`)}
        />,
        <GridActionsCellItem
          key="add-price"
          icon={<AddIcon />}
          label="Tambah Harga"
          onClick={() => {
            console.log("Navigating to:", `/vendor-pricelist/new?vendor_id=${params.row.id}`);
            navigate(`/vendor-pricelist/new?vendor_id=${params.row.id}`);
          }}
        />,
        <GridActionsCellItem
          key="delete"
          icon={<DeleteIcon />}
          label="Delete"
          onClick={() => handleDelete(params.row.id)}
        />,
      ],
    },
  ];

  const priceColumns: GridColDef[] = [
    {
      field: "vendor_name",
      headerName: "Vendor",
      flex: 1,
      minWidth: 180,
      renderCell: (params) => {
        const row = params?.row;
        if (!row) return "-";
        const vendor = vendors.find((v) => v.id === row.vendor_id);
        const vendorName =
          row.Vendor?.vendor_name ||
          row.vendor?.vendor_name ||
          vendor?.vendor_name ||
          row.vendor_id ||
          "-";
        const isPreferred = vendor?.is_preferred || row.Vendor?.is_preferred;
        return (
          <Box>
            <Typography variant="body2" fontWeight={500}>
              {vendorName}
            </Typography>
            {isPreferred && (
              <Chip
                label="Preferred"
                size="small"
                color="success"
                sx={{ height: 18, fontSize: 10, mt: 0.5 }}
              />
            )}
          </Box>
        );
      },
    },
    {
      field: "material_name",
      headerName: "Material",
      flex: 1,
      minWidth: 200,
      renderCell: (params) => {
        const row = params?.row;
        if (!row) return "-";
        const material = materials.find((m) => m.id === row.material_id);
        const materialName =
          row.Material?.item_name ||
          row.material?.item_name ||
          material?.item_name ||
          row.material_id ||
          "-";
        const brand = row.Material?.brand || material?.brand;
        return (
          <Box>
            <Typography variant="body2" fontWeight={500}>
              {materialName}
            </Typography>
            {brand && (
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: 11 }}>
                Brand: {brand}
              </Typography>
            )}
          </Box>
        );
      },
    },
    {
      field: "price",
      headerName: "Price",
      width: 160,
      renderCell: (params) => {
        const row = params?.row;
        if (!row) return null;
        const price = Number(row.price ?? 0);
        return (
          <Box>
            <Typography variant="body2" fontWeight={700} color="primary.main">
              {row.currency || "IDR"} {price.toLocaleString("id-ID")}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10 }}>
              {row.price_updated_at
                ? new Date(row.price_updated_at).toLocaleDateString("id-ID")
                : "-"}
            </Typography>
          </Box>
        );
      },
    },
    {
      field: "currency",
      headerName: "Currency",
      width: 100,
      renderCell: (params) => (
        <Chip
          label={params.row?.currency || "IDR"}
          size="small"
          variant="outlined"
          sx={{ fontWeight: 600 }}
        />
      ),
    },
    {
      field: "actions",
      type: "actions",
      headerName: "Actions",
      width: 100,
      getActions: (params) => [
        <GridActionsCellItem
          icon={
            <Tooltip title="Delete Price">
              <DeleteIcon />
            </Tooltip>
          }
          label="Hapus"
          onClick={() => handleDeletePrice(params.id as string)}
          sx={{ color: "error.main" }}
        />,
      ],
    },
  ];

  // top-level loading only shown when vendors tab is active and loading
  if (loading && tab === 0) return <LoadingSpinner message="Memuat data vendor..." />;

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        {/* Hero banner */}
        <Box
          sx={{
            background: "linear-gradient(45deg, #06103A 0%, #1976d2 100%)",
            p: 3,
            borderRadius: 3,
            mb: 3,
            color: "white",
          }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexDirection: { xs: "column", sm: "row" },
              gap: 2,
            }}
          >
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: "white" }}>
                Vendors Dashboard
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.95, color: "rgba(255,255,255,0.9)" }}>
                Ringkasan vendor dan ringkasan pemasok utama
              </Typography>
            </Box>
            <Box sx={{ display: "flex", gap: 2 }}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => navigate("/vendors/new")}
                sx={{
                  minWidth: 160,
                  borderRadius: 3,
                  textTransform: "none",
                  fontWeight: 600,
                  background: "linear-gradient(45deg,#1976d2,#42a5f5)",
                  color: "white",
                  boxShadow: "0 6px 18px rgba(25,118,210,0.24)",
                  "&:hover": { boxShadow: "0 8px 22px rgba(25,118,210,0.28)" },
                }}
              >
                Add Vendor
              </Button>
            </Box>
          </Box>
        </Box>
      </Box>

      {error && (
        <Alert
          severity="error"
          sx={{ mb: 3, borderRadius: 2, "& .MuiAlert-message": { fontSize: "0.9rem" } }}
          onClose={() => setError(null)}
        >
          {error}
        </Alert>
      )}
      {/* Tabs: Vendors | Vendor Pricelist */}
      <Box sx={{ bgcolor: "transparent", mb: 2 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
          <Tabs value={tab} onChange={(_, v) => setTab(v)}>
            <Tab label="Vendors" />
            <Tab label="Vendor Pricelist" />
          </Tabs>
          {tab === 1 && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate("/vendor-pricelist/new")}
              sx={{ minHeight: 36 }}
            >
              Tambah Harga
            </Button>
          )}
        </Box>

        {/* Tab panel: Vendors */}
        {tab === 0 && (
          <>
            <Box sx={{ display: "flex", gap: 2, mb: 2, alignItems: "center" }}>
              <TextField
                size="small"
                placeholder="Cari vendor, kategori, atau klasifikasi..."
                value={query}
                onChange={(e) => setQuery((e.target as HTMLInputElement).value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
                sx={{ width: 260 }}
              />
              <TextField
                select
                size="small"
                label="Category"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter((e.target as HTMLInputElement).value)}
                sx={{ width: 180 }}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="Material">Material (Bahan fisik)</MenuItem>
                <MenuItem value="Service">Service (Jasa/layanan)</MenuItem>
                <MenuItem value="Equipment">Equipment (Alat/peralatan)</MenuItem>
                <MenuItem value="Logistics">Logistics (Pengiriman/transportasi)</MenuItem>
                <MenuItem value="Subcontractor">Subcontractor (Subkontraktor)</MenuItem>
              </TextField>
              <TextField
                select
                size="small"
                label="Classification"
                value={classificationFilter}
                onChange={(e) => setClassificationFilter((e.target as HTMLInputElement).value)}
                sx={{ width: 180 }}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="Local">Local (Lokal)</MenuItem>
                <MenuItem value="International">International (Internasional)</MenuItem>
                <MenuItem value="Principal">Principal (Prinsipal/utama)</MenuItem>
                <MenuItem value="Distributor">Distributor (Distributor)</MenuItem>
                <MenuItem value="Freelance">Freelance (Perorangan/freelance)</MenuItem>
              </TextField>
            </Box>

            {filteredVendors.length === 0 ? (
              <EmptyState
                title="Belum ada vendor"
                description="Tambahkan vendor pertama Anda untuk mulai mengelola pemasok."
                actionText="Tambah Vendor"
                onAction={() => navigate("/vendors/new")}
              />
            ) : (
              <Box
                sx={{
                  bgcolor: "white",
                  borderRadius: 3,
                  boxShadow: "0 8px 30px rgba(2,6,23,0.08)",
                  overflow: "hidden",
                }}
              >
                <DataGrid
                  rows={filteredVendors}
                  columns={columns}
                  initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
                  pageSizeOptions={[5, 10, 25]}
                  autoHeight
                  sx={{
                    minHeight: 520,
                    border: "none",
                    "& .MuiDataGrid-cell": {
                      fontSize: "0.9rem",
                      borderBottom: "1px solid #f0f0f0",
                      py: 1.25,
                    },
                    "& .MuiDataGrid-columnHeaders": {
                      backgroundColor: "#f8f9fa",
                      fontSize: "0.9rem",
                      fontWeight: 700,
                      color: "#495057",
                      borderBottom: "2px solid #e9ecef",
                    },
                    "& .MuiDataGrid-row": { "&:hover": { backgroundColor: "#fbfdff" } },
                    "& .MuiDataGrid-footerContainer": {
                      borderTop: "1px solid #e9ecef",
                      backgroundColor: "#fafafa",
                    },
                  }}
                />
              </Box>
            )}
          </>
        )}

        {/* Tab panel: Vendor Pricelist */}
        {tab === 1 && (
          <>
            {loadingPrices ? (
              <LoadingSpinner message="Memuat vendor pricelist..." />
            ) : (
              <Box>
                {/* Filter Section */}
                <Paper
                  elevation={0}
                  sx={{ p: 2, mb: 3, borderRadius: 2, border: "1px solid #e0e0e0" }}
                >
                  <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
                    <FilterListIcon color="action" />
                    <TextField
                      select
                      size="small"
                      label="Filter Vendor"
                      value={vendorFilter}
                      onChange={(e) => setVendorFilter((e.target as HTMLInputElement).value)}
                      sx={{ minWidth: 200, flex: 1 }}
                    >
                      <MenuItem value="">Semua Vendor</MenuItem>
                      {vendors.map((v) => (
                        <MenuItem key={v.id} value={v.id}>
                          {v.vendor_name} {v.is_preferred ? "⭐" : ""}
                        </MenuItem>
                      ))}
                    </TextField>
                    <TextField
                      select
                      size="small"
                      label="Filter Material"
                      value={materialFilter}
                      onChange={(e) => setMaterialFilter((e.target as HTMLInputElement).value)}
                      sx={{ minWidth: 200, flex: 1 }}
                    >
                      <MenuItem value="">Semua Material</MenuItem>
                      {materials.map((m) => (
                        <MenuItem key={m.id} value={m.id}>
                          {m.item_name}
                        </MenuItem>
                      ))}
                    </TextField>
                    {(vendorFilter || materialFilter) && (
                      <Button
                        size="small"
                        onClick={() => {
                          setVendorFilter("");
                          setMaterialFilter("");
                        }}
                      >
                        Clear Filters
                      </Button>
                    )}
                  </Stack>
                </Paper>

                {/* Data Grid */}
                {!prices || filteredPrices.length === 0 ? (
                  <EmptyState
                    title="Belum ada harga"
                    description="Tambahkan harga vendor untuk material"
                    actionText="Tambah Harga"
                    onAction={() => navigate("/vendor-pricelist/new")}
                  />
                ) : (
                  <Paper
                    elevation={0}
                    sx={{ borderRadius: 2, overflow: "hidden", border: "1px solid #e0e0e0" }}
                  >
                    <DataGrid
                      rows={filteredPrices}
                      columns={priceColumns}
                      getRowId={(r) => r.id}
                      autoHeight
                      pageSizeOptions={[5, 10, 25, 50]}
                      initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
                      disableRowSelectionOnClick
                      sx={{
                        border: "none",
                        "& .MuiDataGrid-columnHeaders": {
                          background: "#f5f5f5",
                          fontWeight: 600,
                        },
                        "& .MuiDataGrid-cell": {
                          py: 1.5,
                          borderBottom: "1px solid #f0f0f0",
                        },
                        "& .MuiDataGrid-row:hover": {
                          background: "#f8f9fa",
                        },
                      }}
                    />
                  </Paper>
                )}
              </Box>
            )}
          </>
        )}
      </Box>
    </Box>
  );
};

export default VendorsPage;

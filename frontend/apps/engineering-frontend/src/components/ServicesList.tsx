import React, { useState, useEffect } from "react";
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
  TextField,
  Typography,
  Card,
  CardContent,
  Alert,
  Chip,
  Grid,
  IconButton,
  Tooltip,
  Button,
  Collapse,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Clear as ClearIcon,
  GetApp as ExportIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
} from "@mui/icons-material";
import { servicesService } from "../api/servicesApi";
import { Service, ServicesQueryParams, ServiceFilterOptions } from "../types/service";
import ServicesTableSkeleton from "./ServicesTableSkeleton";
import ServiceFormModal from "./ServiceFormModal";
import ServiceDetailModal from "./ServiceDetailModal";
import DeleteConfirmationModal from "./DeleteConfirmationModal";
import { useNotification } from "../contexts/NotificationContext";

interface ServicesListProps {
  globalSearch?: string;
}

const ServicesList: React.FC<ServicesListProps> = ({ globalSearch }) => {

  // Notification hook
  const { showSuccess, showError } = useNotification();

  // State untuk data services dan UI
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  // Filters & search
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<Partial<ServicesQueryParams>>({});
  const [filterOptions, setFilterOptions] = useState<ServiceFilterOptions | null>(null);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [searchDebounce, setSearchDebounce] = useState<NodeJS.Timeout | null>(null);

  // Modal / dialog state
  const [openFormModal, setOpenFormModal] = useState(false);
  const [openDetailModal, setOpenDetailModal] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");

  // Delete state (using existing DeleteConfirmationModal)
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<Service | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Fetch filter options
  const fetchFilterOptions = async () => {
    try {
      const opts = await servicesService.getFilterOptions();
      setFilterOptions(opts);
    } catch (err) {
      showError("Gagal memuat opsi filter");
    }
  };

  // Fetch services data
  const fetchServices = async () => {
    setLoading(true);
    setError(null);

    try {
      const queryParams: ServicesQueryParams = {
        page: page + 1,
        limit: rowsPerPage,
        search: globalSearch || searchTerm || undefined,
        ...filters,
      };

      const response = await servicesService.getServices(queryParams);

      if (response.success) {
        setServices(response.data);
        setTotalCount(response.pagination?.total || 0);
      } else {
        setError("Gagal memuat data layanan");
      }
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Terjadi kesalahan saat memuat layanan";
      setError(errorMsg);
      showError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Effects
  useEffect(() => {
    fetchFilterOptions();
  }, []);

  useEffect(() => {
    fetchServices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, rowsPerPage, JSON.stringify(filters)]);

  // React to external globalSearch changes
  useEffect(() => {
    if (globalSearch !== undefined) {
      setPage(0);
      fetchServices();
    }
  }, [globalSearch]);

  // Debounced search
  useEffect(() => {
    if (searchDebounce) clearTimeout(searchDebounce);
    const t = setTimeout(() => {
      setPage(0);
      fetchServices();
    }, 500);
    setSearchDebounce(t);
    return () => clearTimeout(t);
  }, [searchTerm]);

  // Handlers
  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleFilterChange = (field: string, value: string) => {
    const newFilters = {
      ...filters,
      [field]: value || undefined,
    };
    // Remove undefined values
    Object.keys(newFilters).forEach((key) => {
      if (
        newFilters[key as keyof ServicesQueryParams] === undefined ||
        newFilters[key as keyof ServicesQueryParams] === ""
      ) {
        delete newFilters[key as keyof ServicesQueryParams];
      }
    });
    console.log("Filter changed:", field, value, "New filters:", newFilters);
    setFilters(newFilters);
    setPage(0);
  };

  const clearAllFilters = () => {
    setFilters({});
    setSearchTerm("");
    setPage(0);
  };

  const activeFiltersCount =
    Object.values(filters).filter((v) => v && v !== "").length + (searchTerm ? 1 : 0);

  const handleRefresh = () => {
    fetchServices();
    fetchFilterOptions();
  };

  const handleExport = async () => {
    try {
      const params: ServicesQueryParams = {
        search: globalSearch || searchTerm || undefined,
        ...filters,
      };
      // Prefer backend export endpoint which returns a blob
      const blob = await servicesService.exportServices(params);
      const url = window.URL.createObjectURL(blob as Blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `services_${new Date().toISOString().split("T")[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      showError("Gagal mengekspor data layanan");
    }
  };

  // Format currency
  const formatCurrency = (amount?: number | string | null) => {
    if (amount === null || amount === undefined || amount === "") return "-";
    const num = typeof amount === "string" ? parseFloat(amount) : amount;
    if (isNaN(num)) return "-";
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(num);
  };

  // Get status chip
  const getStatusChip = (isActive?: boolean) => {
    return (
      <Chip
        label={isActive ? "Active" : "Inactive"}
        color={isActive ? "success" : "default"}
        size="small"
      />
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      <Card sx={{ mb: 3, overflow: "visible" }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: "flex", gap: 3, alignItems: "center", flexWrap: "wrap", justifyContent: "space-between" }}>
            <TextField
              placeholder="Cari layanan berdasarkan kode, nama, kategori..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{ startAdornment: <SearchIcon sx={{ color: "action.active", mr: 1.5 }} /> }}
              sx={{ flexGrow: 1, minWidth: 300, "& .MuiOutlinedInput-root": { backgroundColor: "background.paper", "& input": { py: 1.5, fontSize: "1rem" } } }}
            />

            <Box sx={{ display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap" }}>
              <Button
                variant={showAdvancedFilters ? "contained" : "outlined"}
                startIcon={<FilterIcon />}
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                size="medium"
                sx={{ minWidth: 120, position: "relative", "&::after": activeFiltersCount > 0 ? { content: `"${activeFiltersCount}"`, position: "absolute", top: -8, right: -8, backgroundColor: "error.main", color: "white", borderRadius: "50%", minWidth: 20, height: 20, fontSize: "0.75rem", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600 } : {} }}
              >
                Filters
                {showAdvancedFilters ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </Button>

              {activeFiltersCount > 0 && (
                <Button variant="text" startIcon={<ClearIcon />} onClick={clearAllFilters} color="error" size="small">Clear All ({activeFiltersCount})</Button>
              )}

              <Button variant="text" startIcon={<RefreshIcon />} onClick={handleRefresh} size="small">Refresh</Button>
            </Box>

            <Box sx={{ display: "flex", gap: 2 }}>
              <Button variant="outlined" startIcon={<ExportIcon />} onClick={handleExport} disabled={services.length === 0} size="medium" sx={{ minWidth: 100 }}>Export</Button>
              <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setFormMode("create"); setSelectedService(null); setOpenFormModal(true); }} size="medium" sx={{ minWidth: 100 }}>Add</Button>
            </Box>
          </Box>

          <Collapse in={showAdvancedFilters}>
            <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: "divider" }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Kategori</InputLabel>
                    <Select value={(filters.category as string) || ""} onChange={(e) => handleFilterChange("category", e.target.value as string)} label="Kategori">
                      <MenuItem value="">All Categories</MenuItem>
                      {filterOptions?.categories?.map((c) => (<MenuItem key={c} value={c}>{c}</MenuItem>))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={4}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Unit</InputLabel>
                    <Select value={(filters.unit as string) || ""} onChange={(e) => handleFilterChange("unit", e.target.value as string)} label="Unit">
                      <MenuItem value="">All Units</MenuItem>
                      {filterOptions?.units?.map((u) => (<MenuItem key={u} value={u}>{u}</MenuItem>))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={4}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Item Type</InputLabel>
                    <Select value={(filters.item_type as string) || ""} onChange={(e) => handleFilterChange("item_type", e.target.value as string)} label="Item Type">
                      <MenuItem value="">All</MenuItem>
                      {filterOptions?.item_types?.map((it) => (<MenuItem key={it} value={it}>{it}</MenuItem>))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Box>
          </Collapse>
        </CardContent>
      </Card>

      {(Object.keys(filters).length > 0 || searchTerm) && (
        <Card sx={{ mb: 2 }}>
          <CardContent sx={{ py: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 1 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                <Typography variant="body2" color="textSecondary">Active filters:</Typography>
                {searchTerm && (<Chip label={`Search: "${searchTerm}"`} size="small" onDelete={() => setSearchTerm("")} variant="outlined" />)}
                {Object.entries(filters).map(([k, v]) => v ? (<Chip key={k} label={`${k}: ${v}`} size="small" onDelete={() => handleFilterChange(k, "")} variant="outlined" />) : null)}
              </Box>
              <Typography variant="body2" color="textSecondary">{totalCount} results found</Typography>
            </Box>
          </CardContent>
        </Card>
      )}

      {error && (<Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>)}

      <Card>
        <CardContent sx={{ p: 0 }}>
          <TableContainer component={Paper} elevation={0}>
            {loading ? (
              <ServicesTableSkeleton rows={rowsPerPage} />
            ) : (
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Kode Layanan</TableCell>
                    <TableCell>Nama Layanan</TableCell>
                    <TableCell>Kategori</TableCell>
                    <TableCell>Unit</TableCell>
                    <TableCell align="right">Biaya Internal</TableCell>
                    <TableCell align="right">Biaya Freelance</TableCell>
                    <TableCell align="center">Status</TableCell>
                    <TableCell align="center">Aksi</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {services.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                        <Typography variant="body2" color="textSecondary">{searchTerm ? "Tidak ada layanan yang sesuai dengan pencarian" : "Belum ada data layanan"}</Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    services.map((service) => (
                      <TableRow key={service.id} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">{service.service_code}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{service.service_name}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{service.category || "-"}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{service.unit}</Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2">{formatCurrency(service.internal_cost_per_hour)}</Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2">{formatCurrency(service.freelance_cost_per_hour)}</Typography>
                        </TableCell>
                        <TableCell align="center">{getStatusChip(service.is_active)}</TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: "flex", justifyContent: "center", gap: 0.5 }}>
                            <Tooltip title="Lihat Detail">
                              <IconButton size="small" onClick={() => { setSelectedService(service); setOpenDetailModal(true); }} color="info">
                                <VisibilityIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>

                            <Tooltip title="Edit">
                              <IconButton size="small" onClick={() => { setFormMode("edit"); setSelectedService(service); setOpenFormModal(true); }} color="primary">
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>

                            <Tooltip title="Hapus">
                              <IconButton size="small" color="error" onClick={() => { setServiceToDelete(service); setOpenDeleteDialog(true); }}>
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </TableContainer>

          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={totalCount}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="Rows per page:"
            labelDisplayedRows={({ from, to, count }) => `${from}–${to} of ${count !== -1 ? count : `more than ${to}`}`}
          />
        </CardContent>
      </Card>

      {/* Modals and confirmation */}
      <ServiceFormModal
        open={openFormModal}
        onClose={(refresh) => {
          setOpenFormModal(false);
          setSelectedService(null);
          if (refresh) fetchServices();
        }}
        service={selectedService}
        mode={formMode}
      />

      <ServiceDetailModal
        open={openDetailModal}
        onClose={() => {
          setOpenDetailModal(false);
          setSelectedService(null);
        }}
        service={selectedService}
      />

      <DeleteConfirmationModal
        open={openDeleteDialog}
        onClose={() => {
          setOpenDeleteDialog(false);
          setServiceToDelete(null);
          setDeleteError(null);
        }}
        onConfirm={async () => {
          if (!serviceToDelete) return;
          setDeleteLoading(true);
          setDeleteError(null);
          try {
            await servicesService.deleteService(serviceToDelete.id);
            showSuccess(`Layanan "${serviceToDelete.service_name}" berhasil dihapus.`);
            setOpenDeleteDialog(false);
            setServiceToDelete(null);
            fetchServices();
          } catch (err) {
            setDeleteError("Gagal menghapus layanan");
            showError("Gagal menghapus layanan");
          } finally {
            setDeleteLoading(false);
          }
        }}
        title="Konfirmasi Hapus Layanan"
        message={serviceToDelete ? `Apakah Anda yakin ingin menghapus layanan "${serviceToDelete.service_name}"? Tindakan ini tidak dapat dibatalkan.` : ""}
        loading={deleteLoading}
        error={deleteError}
      />
    </Box>
  );
};

export default ServicesList;
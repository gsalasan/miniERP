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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  IconButton,
  Tooltip,
  Button,
  Collapse,
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
import { materialsService } from "../api/materialsApi";
import { Material, MaterialsQueryParams, MaterialStatus, FilterOptions } from "../types/material";
import MaterialFormModal from "./MaterialFormModal";
import MaterialDetailModal from "./MaterialDetailModal";
import DeleteConfirmationModal from "./DeleteConfirmationModal";
import MaterialsTableSkeleton from "./MaterialsTableSkeleton";
import { useNotification } from "../contexts/NotificationContext";

interface MaterialsListProps {
  globalSearch?: string;
}

const MaterialsList: React.FC<MaterialsListProps> = ({ globalSearch }) => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<Partial<MaterialsQueryParams>>({});
  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [searchDebounce, setSearchDebounce] = useState<NodeJS.Timeout | null>(null);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [viewingMaterial, setViewingMaterial] = useState<Material | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingMaterial, setDeletingMaterial] = useState<Material | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Notification hook
  const { showSuccess, showError } = useNotification();

  // Calculate active filters count
  const activeFiltersCount =
    Object.values(filters).filter((value) => value && value !== "").length + (searchTerm ? 1 : 0);

  // Fetch filter options
  const fetchFilterOptions = async () => {
    try {
      const options = await materialsService.getFilterOptions();
      setFilterOptions(options);
    } catch {
      showError("Gagal memuat opsi filter");
    }
  };

  // Fetch materials data
  const fetchMaterials = async () => {
    setLoading(true);
    setError(null);

    try {
      // Prioritize globalSearch over local searchTerm
      const searchQuery = globalSearch || searchTerm;
      
      const queryParams: MaterialsQueryParams = {
        page: page + 1, // API uses 1-based pagination
        limit: rowsPerPage,
        search: searchQuery || undefined,
        ...filters,
      };

      const response = await materialsService.getMaterials(queryParams);

      if (response.success) {
        setMaterials(response.data);
        // Backend returns pagination object, not meta
        setTotalCount(response.pagination?.total || 0);
      } else {
        setError("Failed to fetch materials data");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred while fetching materials");
    } finally {
      setLoading(false);
    }
  };

  // Initial load and refresh on dependency changes
  useEffect(() => {
    fetchFilterOptions();
  }, []);

  useEffect(() => {
    fetchMaterials();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, rowsPerPage, JSON.stringify(filters)]);

  // Handle global search from parent component
  useEffect(() => {
    if (globalSearch !== undefined) {
      setPage(0);
      fetchMaterials();
    }
  }, [globalSearch]);

  // Debounced search
  useEffect(() => {
    if (searchDebounce) {
      clearTimeout(searchDebounce);
    }

    const timeout = setTimeout(() => {
      setPage(0);
      fetchMaterials();
    }, 500);

    setSearchDebounce(timeout);

    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [searchTerm]);

  // Handle search input
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  // Handle pagination
  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Handle filter changes
  const handleFilterChange = (field: string, value: string) => {
    const newFilters = {
      ...filters,
      [field]: value || undefined,
    };
    // Remove undefined values
    Object.keys(newFilters).forEach(key => {
      if (newFilters[key as keyof MaterialsQueryParams] === undefined || newFilters[key as keyof MaterialsQueryParams] === '') {
        delete newFilters[key as keyof MaterialsQueryParams];
      }
    });
    console.log('Filter changed:', field, value, 'New filters:', newFilters);
    setFilters(newFilters);
    setPage(0); // Reset to first page when filtering
  };

  // Clear all filters
  const clearAllFilters = () => {
    setFilters({});
    setSearchTerm("");
    setPage(0);
  };

  // Format currency
  const formatCurrency = (amount: number | null | undefined, currency?: string) => {
    if (!amount) return "-";
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: currency || "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Get status color
  const getStatusColor = (status?: MaterialStatus) => {
    switch (status) {
      case MaterialStatus.Active:
        return "success";
      case MaterialStatus.EndOfLife:
        return "warning";
      case MaterialStatus.Discontinue:
        return "error";
      default:
        return "default";
    }
  };

  // Refresh data
  const handleRefresh = () => {
    fetchMaterials();
    fetchFilterOptions();
  };

  // Modal handlers
  const handleAddMaterial = () => {
    setEditingMaterial(null);
    setIsModalOpen(true);
  };

  const handleEditMaterial = (material: Material) => {
    setEditingMaterial(material);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingMaterial(null);
  };

  const handleModalSuccess = () => {
    fetchMaterials(); // Refresh data after successful add/edit
  };

  // Detail modal handlers
  const handleViewMaterial = (material: Material) => {
    setViewingMaterial(material);
    setIsDetailModalOpen(true);
  };

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false);
    setViewingMaterial(null);
  };

  // Delete modal handlers
  const handleDeleteMaterial = (material: Material) => {
    setDeletingMaterial(material);
    setDeleteError(null);
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    if (!deleteLoading) {
      setIsDeleteModalOpen(false);
      setDeletingMaterial(null);
      setDeleteError(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingMaterial) return;

    setDeleteLoading(true);
    setDeleteError(null);

    try {
      await materialsService.deleteMaterial(deletingMaterial.id);
      showSuccess(`Material "${deletingMaterial.item_name}" berhasil dihapus!`);
      fetchMaterials(); // Refresh data after successful delete
      setIsDeleteModalOpen(false);
      setDeletingMaterial(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Gagal menghapus material";
      setDeleteError(errorMessage);
      showError(errorMessage);
    } finally {
      setDeleteLoading(false);
    }
  };

  // Export data to CSV
  const handleExport = () => {
    const headers = [
      "Item Name",
      "SBU",
      "System",
      "Subsystem",
      "Brand",
      "Vendor",
      "Status",
      "Location",
      "Cost (RP)",
      "Owner PN",
    ];
    const csvData = materials.map((material) => [
      material.item_name,
      material.sbu || "",
      material.system || "",
      material.subsystem || "",
      material.brand || "",
      material.vendor || "",
      material.status || "",
      material.location || "",
      material.cost_rp || "",
      material.owner_pn || "",
    ]);

    const csv = [headers, ...csvData]
      .map((row) => row.map((field) => `"${field}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `materials_${new Date().toISOString().split("T")[0]}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Filters and Search */}
      <Card
        sx={{
          mb: 3,
          overflow: "visible",
          "& .MuiCardContent-root": {
            background: "linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)",
          },
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ 
            display: "flex", 
            gap: 3, 
            alignItems: "center", 
            flexWrap: "wrap",
            justifyContent: "space-between"
          }}>
            {/* Search Box */}
            <TextField
              placeholder="Cari materials berdasarkan nama, brand, vendor..."
              value={searchTerm}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: <SearchIcon sx={{ color: "action.active", mr: 1.5 }} />,
              }}
              sx={{
                flexGrow: 1,
                minWidth: 300,
                "& .MuiOutlinedInput-root": {
                  backgroundColor: "background.paper",
                  "& input": {
                    py: 1.5,
                    fontSize: "1rem",
                  },
                },
              }}
            />

            {/* Filter Controls */}
            <Box sx={{ display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap" }}>
              <Button
                variant={showAdvancedFilters ? "contained" : "outlined"}
                startIcon={<FilterIcon />}
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                size="medium"
                sx={{
                  minWidth: 120,
                  position: "relative",
                  "&::after":
                    activeFiltersCount > 0
                      ? {
                          content: `"${activeFiltersCount}"`,
                          position: "absolute",
                          top: -8,
                          right: -8,
                          backgroundColor: "error.main",
                          color: "white",
                          borderRadius: "50%",
                          minWidth: 20,
                          height: 20,
                          fontSize: "0.75rem",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 600,
                        }
                      : {},
                }}
              >
                Filters
                {showAdvancedFilters ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </Button>

              {activeFiltersCount > 0 && (
                <Button
                  variant="text"
                  startIcon={<ClearIcon />}
                  onClick={clearAllFilters}
                  color="error"
                  size="small"
                >
                  Clear All ({activeFiltersCount})
                </Button>
              )}

              <Button
                variant="text"
                startIcon={<RefreshIcon />}
                onClick={handleRefresh}
                size="small"
              >
                Refresh
              </Button>
            </Box>

            {/* Action Buttons */}
            <Box sx={{ display: "flex", gap: 2 }}>
              <Button
                variant="outlined"
                startIcon={<ExportIcon />}
                onClick={handleExport}
                disabled={materials.length === 0}
                size="medium"
                sx={{
                  minWidth: 100,
                  borderColor: "primary.main",
                  color: "primary.main",
                  "&:hover": {
                    borderColor: "primary.dark",
                    backgroundColor: "primary.50",
                  },
                }}
              >
                Export
              </Button>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleAddMaterial}
                size="medium"
                sx={{ minWidth: 100 }}
              >
                Add
              </Button>
            </Box>
          </Box>

          {/* Advanced Filters */}
          <Collapse in={showAdvancedFilters}>
            <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: "divider" }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>System</InputLabel>
                    <Select
                      value={filters.system || ""}
                      onChange={(e) => handleFilterChange("system", e.target.value)}
                      label="System"
                    >
                      <MenuItem value="">All Systems</MenuItem>
                      {filterOptions?.systems?.map((system: string) => (
                        <MenuItem key={system} value={system}>
                          {system}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Subsystem</InputLabel>
                    <Select
                      value={filters.subsystem || ""}
                      onChange={(e) => handleFilterChange("subsystem", e.target.value)}
                      label="Subsystem"
                    >
                      <MenuItem value="">All Subsystems</MenuItem>
                      {filterOptions?.subsystems?.map((subsystem: string) => (
                        <MenuItem key={subsystem} value={subsystem}>
                          {subsystem}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Vendor</InputLabel>
                    <Select
                      value={filters.vendor || ""}
                      onChange={(e) => handleFilterChange("vendor", e.target.value)}
                      label="Vendor"
                    >
                      <MenuItem value="">All Vendors</MenuItem>
                      {filterOptions?.vendors?.map((vendor: string) => (
                        <MenuItem key={vendor} value={vendor}>
                          {vendor}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Brand</InputLabel>
                    <Select
                      value={filters.brand || ""}
                      onChange={(e) => handleFilterChange("brand", e.target.value)}
                      label="Brand"
                    >
                      <MenuItem value="">All Brands</MenuItem>
                      {filterOptions?.brands?.map((brand: string) => (
                        <MenuItem key={brand} value={brand}>
                          {brand}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Box>
          </Collapse>
        </CardContent>
      </Card>

      {/* Active Filters and Results Info */}
      {(Object.keys(filters).length > 0 || searchTerm) && (
        <Card sx={{ mb: 2 }}>
          <CardContent sx={{ py: 2 }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 1,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                <Typography variant="body2" color="textSecondary">
                  Active filters:
                </Typography>
                {searchTerm && (
                  <Chip
                    label={`Search: "${searchTerm}"`}
                    size="small"
                    onDelete={() => setSearchTerm("")}
                    variant="outlined"
                  />
                )}
                {Object.entries(filters).map(([key, value]) =>
                  value ? (
                    <Chip
                      key={key}
                      label={`${key}: ${value}`}
                      size="small"
                      onDelete={() => handleFilterChange(key, "")}
                      variant="outlined"
                    />
                  ) : null,
                )}
              </Box>
              <Typography variant="body2" color="textSecondary">
                {totalCount} results found
              </Typography>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Materials Table */}
      <Card>
        <CardContent sx={{ p: 0 }}>
          <TableContainer component={Paper} elevation={0}>
            {loading ? (
              <MaterialsTableSkeleton rows={rowsPerPage} />
            ) : (
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Item Details</TableCell>
                    <TableCell>SBU / System</TableCell>
                    <TableCell>Brand / Vendor</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Location</TableCell>
                    <TableCell align="right">Cost (RP)</TableCell>
                    <TableCell>Components</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {materials.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                        <Typography variant="body2" color="textSecondary">
                          No materials found
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : materials.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                        <Typography variant="body2" color="textSecondary">
                          No materials found
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    materials.map((material) => (
                      <TableRow key={material.id} hover>
                        <TableCell>
                          <Box>
                            <Tooltip title={material.item_name}>
                              <Typography
                                variant="body2"
                                fontWeight="medium"
                                noWrap
                                sx={{ maxWidth: 200 }}
                              >
                                {material.item_name}
                              </Typography>
                            </Tooltip>
                            {material.owner_pn && (
                              <Typography
                                variant="caption"
                                color="textSecondary"
                                sx={{ display: "block" }}
                              >
                                PN: {material.owner_pn}
                              </Typography>
                            )}
                            {material.satuan && (
                              <Typography
                                variant="caption"
                                color="textSecondary"
                                sx={{ display: "block" }}
                              >
                                Unit: {material.satuan}
                              </Typography>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" fontWeight="medium">
                              {material.sbu || "-"}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="textSecondary"
                              sx={{ display: "block" }}
                            >
                              {material.system || "-"}
                            </Typography>
                            {material.subsystem && (
                              <Typography
                                variant="caption"
                                color="textSecondary"
                                sx={{ display: "block" }}
                              >
                                Sub: {material.subsystem}
                              </Typography>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Typography variant="body2">{material.brand || "-"}</Typography>
                            <Typography
                              variant="caption"
                              color="textSecondary"
                              sx={{ display: "block" }}
                            >
                              {material.vendor || "-"}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={material.status || "Unknown"}
                            color={getStatusColor(material.status)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={material.location || "Unknown"}
                            variant="outlined"
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Box sx={{ textAlign: "right" }}>
                            <Typography variant="body2" fontWeight="medium">
                              {formatCurrency(material.cost_rp, "IDR")}
                            </Typography>
                            {material.cost_ori && material.curr && (
                              <Typography
                                variant="caption"
                                color="textSecondary"
                                sx={{ display: "block" }}
                              >
                                {formatCurrency(material.cost_ori, material.curr)}
                              </Typography>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Tooltip title={material.components || "No components specified"}>
                            <Typography
                              variant="caption"
                              color="textSecondary"
                              noWrap
                              sx={{ maxWidth: 150, display: "block" }}
                            >
                              {material.components || "-"}
                            </Typography>
                          </Tooltip>
                        </TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: "flex", justifyContent: "center", gap: 0.5 }}>
                            <Tooltip title="View Details">
                              <IconButton
                                size="small"
                                onClick={() => handleViewMaterial(material)}
                                color="info"
                              >
                                <VisibilityIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Edit Material">
                              <IconButton
                                size="small"
                                onClick={() => handleEditMaterial(material)}
                                color="primary"
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete Material">
                              <IconButton
                                size="small"
                                onClick={() => handleDeleteMaterial(material)}
                                color="error"
                              >
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

          {/* Pagination */}
          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={totalCount}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="Rows per page:"
            labelDisplayedRows={({ from, to, count }) =>
              `${from}–${to} of ${count !== -1 ? count : `more than ${to}`}`
            }
          />
        </CardContent>
      </Card>

      {/* Material Form Modal */}
      <MaterialFormModal
        open={isModalOpen}
        onClose={handleCloseModal}
        onSuccess={handleModalSuccess}
        material={editingMaterial}
        filterOptions={filterOptions}
      />

      {/* Material Detail Modal */}
      <MaterialDetailModal
        open={isDetailModalOpen}
        onClose={handleCloseDetailModal}
        material={viewingMaterial}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        open={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDelete}
        material={deletingMaterial}
        loading={deleteLoading}
        error={deleteError}
      />
    </Box>
  );
};

export default MaterialsList;

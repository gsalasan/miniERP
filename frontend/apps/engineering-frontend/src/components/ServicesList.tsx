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
} from "@mui/material";
import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
} from "@mui/icons-material";
import { servicesService } from "../api/servicesApi";
import { Service, ServicesQueryParams } from "../types/service";
import ServicesTableSkeleton from "./ServicesTableSkeleton";
import { useNotification } from "../contexts/NotificationContext";

interface ServicesListProps {
  globalSearch?: string;
}

const ServicesList: React.FC<ServicesListProps> = ({ globalSearch }) => {
  const { showSuccess, showError } = useNotification();

  // State untuk data services
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // State pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  // State filter dan search
  const [searchTerm, setSearchTerm] = useState("");
  const [filters] = useState<Partial<ServicesQueryParams>>({});
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

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
    fetchServices();
  }, [page, rowsPerPage, globalSearch, filters]);

  // Handlers
  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Format currency
  const formatCurrency = (amount?: number) => {
    if (typeof amount !== "number") return "-";
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Get status chip
  const getStatusChip = (isActive?: boolean) => {
    return (
      <Chip
        label={isActive ? "Aktif" : "Tidak Aktif"}
        color={isActive ? "success" : "default"}
        size="small"
      />
    );
  };

  return (
    <Box>
      {/* Header */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                size="small"
                placeholder="Cari layanan..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ color: "text.secondary", mr: 1 }} />,
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
                <Tooltip title="Filter">
                  <IconButton
                    onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                    color={showAdvancedFilters ? "primary" : "default"}
                  >
                    <FilterIcon />
                  </IconButton>
                </Tooltip>

                <Tooltip title="Refresh">
                  <IconButton onClick={fetchServices} disabled={loading}>
                    <RefreshIcon />
                  </IconButton>
                </Tooltip>

                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => showSuccess("Fitur tambah layanan akan segera tersedia")}
                >
                  Tambah Layanan
                </Button>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardContent sx={{ p: 0 }}>
          {error && (
            <Alert severity="error" sx={{ m: 2 }}>
              {error}
            </Alert>
          )}

          <TableContainer component={Paper} elevation={0}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: "grey.50" }}>
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
                {loading ? (
                  <ServicesTableSkeleton rows={rowsPerPage} />
                ) : services.length > 0 ? (
                  services.map((service) => (
                    <TableRow
                      key={service.id}
                      hover
                      sx={{ "&:hover": { bgcolor: "action.hover" } }}
                    >
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {service.service_code}
                        </Typography>
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
                        <Typography variant="body2">
                          {formatCurrency(service.internal_cost_per_hour)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2">
                          {formatCurrency(service.freelance_cost_per_hour)}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">{getStatusChip(service.is_active)}</TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: "flex", justifyContent: "center", gap: 0.5 }}>
                          <Tooltip title="Lihat Detail">
                            <IconButton size="small">
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="Edit">
                            <IconButton size="small">
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="Hapus">
                            <IconButton size="small" color="error">
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                      <Typography variant="body2" color="text.secondary">
                        {searchTerm
                          ? "Tidak ada layanan yang sesuai dengan pencarian"
                          : "Belum ada data layanan"}
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          {!loading && services.length > 0 && (
            <TablePagination
              component="div"
              count={totalCount}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              rowsPerPageOptions={[5, 10, 25, 50]}
              labelRowsPerPage="Baris per halaman:"
              labelDisplayedRows={({ from, to, count }) =>
                `${from}–${to} dari ${count !== -1 ? count : `lebih dari ${to}`}`
              }
            />
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default ServicesList;

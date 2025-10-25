import React, { useState, useEffect } from 'react';
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
  CircularProgress,
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
} from '@mui/material';
import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Clear as ClearIcon,
  GetApp as ExportIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { materialsService } from '../api/materialsApi';
import { Material, MaterialsQueryParams, MaterialStatus, MaterialLocation, FilterOptions } from '../types/material';
import MaterialsStatsWidget from './MaterialsStatsWidget';

const MaterialsList: React.FC = () => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<Partial<MaterialsQueryParams>>({});
  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [searchDebounce, setSearchDebounce] = useState<NodeJS.Timeout | null>(null);

  // Fetch filter options
  const fetchFilterOptions = async () => {
    try {
      const options = await materialsService.getFilterOptions();
      setFilterOptions(options);
    } catch (err) {
      console.error('Error fetching filter options:', err);
    }
  };

  // Fetch materials data
  const fetchMaterials = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const queryParams: MaterialsQueryParams = {
        page: page + 1, // API uses 1-based pagination
        limit: rowsPerPage,
        search: searchTerm || undefined,
        ...filters,
      };

      const response = await materialsService.getMaterials(queryParams);
      
      if (response.success) {
        setMaterials(response.data);
        // Backend returns pagination object, not meta
        setTotalCount(response.pagination?.total || 0);
      } else {
        setError('Failed to fetch materials data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while fetching materials');
      console.error('Error fetching materials:', err);
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
  }, [page, rowsPerPage, filters]);

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
    setFilters((prev: MaterialsQueryParams) => ({
      ...prev,
      [field]: value || undefined,
    }));
    setPage(0); // Reset to first page when filtering
  };

  // Clear all filters
  const clearAllFilters = () => {
    setFilters({});
    setSearchTerm('');
    setPage(0);
  };

  // Format currency
  const formatCurrency = (amount: number | null | undefined, currency?: string) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: currency || 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Get status color
  const getStatusColor = (status?: MaterialStatus) => {
    switch (status) {
      case MaterialStatus.Active:
        return 'success';
      case MaterialStatus.EndOfLife:
        return 'warning';
      case MaterialStatus.Discontinue:
        return 'error';
      default:
        return 'default';
    }
  };

  // Refresh data
  const handleRefresh = () => {
    fetchMaterials();
    fetchFilterOptions();
  };

  // Export data to CSV
  const handleExport = () => {
    const headers = ['Item Name', 'SBU', 'System', 'Subsystem', 'Brand', 'Vendor', 'Status', 'Location', 'Cost (RP)', 'Owner PN'];
    const csvData = materials.map(material => [
      material.item_name,
      material.sbu || '',
      material.system || '',
      material.subsystem || '',
      material.brand || '',
      material.vendor || '',
      material.status || '',
      material.location || '',
      material.cost_rp || '',
      material.owner_pn || '',
    ]);

    const csv = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `materials_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Materials Management
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Kelola data materials engineering
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<ExportIcon />}
            onClick={handleExport}
            disabled={materials.length === 0}
          >
            Export CSV
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              // TODO: Implement add material functionality
              console.log('Add material clicked');
            }}
          >
            Add Material
          </Button>
        </Box>
      </Box>

      {/* Statistics */}
      <MaterialsStatsWidget />

      {/* Filters and Search */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                size="small"
                placeholder="Cari materials..."
                value={searchTerm}
                onChange={handleSearchChange}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ color: 'action.active', mr: 1 }} />,
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={filters.status || ''}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  label="Status"
                >
                  <MenuItem value="">All Status</MenuItem>
                  {filterOptions?.statuses?.map((status: MaterialStatus) => (
                    <MenuItem key={status} value={status}>
                      {status}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Location</InputLabel>
                <Select
                  value={filters.location || ''}
                  onChange={(e) => handleFilterChange('location', e.target.value)}
                  label="Location"
                >
                  <MenuItem value="">All Locations</MenuItem>
                  {filterOptions?.locations?.map((location: MaterialLocation) => (
                    <MenuItem key={location} value={location}>
                      {location}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>SBU</InputLabel>
                <Select
                  value={filters.sbu || ''}
                  onChange={(e) => handleFilterChange('sbu', e.target.value)}
                  label="SBU"
                >
                  <MenuItem value="">All SBU</MenuItem>
                  {filterOptions?.sbus?.map((sbu: string) => (
                    <MenuItem key={sbu} value={sbu}>
                      {sbu}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={2}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Tooltip title="More Filters">
                  <IconButton 
                    onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                    color={showAdvancedFilters ? 'primary' : 'default'}
                  >
                    <FilterIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Clear Filters">
                  <IconButton onClick={clearAllFilters}>
                    <ClearIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Refresh Data">
                  <IconButton onClick={handleRefresh} disabled={loading}>
                    <RefreshIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            </Grid>
          </Grid>

          {/* Advanced Filters */}
          <Collapse in={showAdvancedFilters}>
            <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>System</InputLabel>
                    <Select
                      value={filters.system || ''}
                      onChange={(e) => handleFilterChange('system', e.target.value)}
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
                      value={filters.subsystem || ''}
                      onChange={(e) => handleFilterChange('subsystem', e.target.value)}
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
                      value={filters.vendor || ''}
                      onChange={(e) => handleFilterChange('vendor', e.target.value)}
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
                      value={filters.brand || ''}
                      onChange={(e) => handleFilterChange('brand', e.target.value)}
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
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Typography variant="body2" color="textSecondary">
                  Active filters:
                </Typography>
                {searchTerm && (
                  <Chip
                    label={`Search: "${searchTerm}"`}
                    size="small"
                    onDelete={() => setSearchTerm('')}
                    variant="outlined"
                  />
                )}
                {Object.entries(filters).map(([key, value]) => 
                  value ? (
                    <Chip
                      key={key}
                      label={`${key}: ${value}`}
                      size="small"
                      onDelete={() => handleFilterChange(key, '')}
                      variant="outlined"
                    />
                  ) : null
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
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                      <CircularProgress size={40} />
                      <Typography variant="body2" sx={{ mt: 2 }}>
                        Loading materials...
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : materials.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
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
                            <Typography variant="body2" fontWeight="medium" noWrap sx={{ maxWidth: 200 }}>
                              {material.item_name}
                            </Typography>
                          </Tooltip>
                          {material.owner_pn && (
                            <Typography variant="caption" color="textSecondary" sx={{ display: 'block' }}>
                              PN: {material.owner_pn}
                            </Typography>
                          )}
                          {material.satuan && (
                            <Typography variant="caption" color="textSecondary" sx={{ display: 'block' }}>
                              Unit: {material.satuan}
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {material.sbu || '-'}
                          </Typography>
                          <Typography variant="caption" color="textSecondary" sx={{ display: 'block' }}>
                            {material.system || '-'}
                          </Typography>
                          {material.subsystem && (
                            <Typography variant="caption" color="textSecondary" sx={{ display: 'block' }}>
                              Sub: {material.subsystem}
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2">
                            {material.brand || '-'}
                          </Typography>
                          <Typography variant="caption" color="textSecondary" sx={{ display: 'block' }}>
                            {material.vendor || '-'}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={material.status || 'Unknown'}
                          color={getStatusColor(material.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={material.location || 'Unknown'}
                          variant="outlined"
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Box sx={{ textAlign: 'right' }}>
                          <Typography variant="body2" fontWeight="medium">
                            {formatCurrency(material.cost_rp, 'IDR')}
                          </Typography>
                          {material.cost_ori && material.curr && (
                            <Typography variant="caption" color="textSecondary" sx={{ display: 'block' }}>
                              {formatCurrency(material.cost_ori, material.curr)}
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Tooltip title={material.components || 'No components specified'}>
                          <Typography variant="caption" color="textSecondary" noWrap sx={{ maxWidth: 150, display: 'block' }}>
                            {material.components || '-'}
                          </Typography>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
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
    </Box>
  );
};

export default MaterialsList;
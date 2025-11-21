/**
 * SalesOrdersPage - Halaman untuk melihat daftar Sales Orders
 */

import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  CircularProgress,
  Alert,
  Button,
  TextField,
  InputAdornment,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Search as SearchIcon,
  Visibility as ViewIcon,
  Description as DocIcon,
  CheckCircle as CheckIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useLocation } from 'react-router-dom';
import SalesOrderDetailModal from '../components/SalesOrderDetailModal';

interface SalesOrder {
  id: string;
  so_number: string;
  customer_po_number: string;
  order_date: string;
  top_days_agreed: number | null;
  contract_value: number;
  po_document_url: string | null;
  created_at: string;
  project: {
    id: string;
    project_name: string;
    customer: {
      name: string;
    };
  };
}

const SalesOrdersPage: React.FC = () => {
  const { token } = useAuth();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSO, setSelectedSO] = useState<SalesOrder | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  const handleViewDetail = (so: SalesOrder) => {
    setSelectedSO(so);
    setDetailModalOpen(true);
  };

  const handleCloseDetail = () => {
    setDetailModalOpen(false);
    setSelectedSO(null);
  };

  useEffect(() => {
    loadSalesOrders();
  }, []);

  // Open detail modal automatically when ?soId= is present
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const soId = params.get('soId');
    if (!soId || salesOrders.length === 0) return;
    const found = salesOrders.find((s) => s.id === soId);
    if (found) {
      handleViewDetail(found);
    }
  }, [location.search, salesOrders]);

  const loadSalesOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:4002/api/v1/sales-orders', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Sales Orders Response:', result.data);
        setSalesOrders(result.data || []);
      } else {
        throw new Error('Failed to load sales orders');
      }
    } catch (err) {
      console.error('Error loading sales orders:', err);
      setError('Gagal memuat data Sales Orders');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const filteredOrders = salesOrders.filter((so) => {
    const query = searchQuery.toLowerCase();
    return (
      so.so_number.toLowerCase().includes(query) ||
      so.customer_po_number.toLowerCase().includes(query) ||
      so.project.project_name.toLowerCase().includes(query) ||
      (so.project.customer?.name || '').toLowerCase().includes(query)
    );
  });

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
          Sales Orders
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Daftar semua Sales Order yang telah dibuat dari proyek WON
        </Typography>
      </Box>

      {/* Stats Card */}
      <Card sx={{ mb: 3, bgcolor: 'primary.main', color: 'white' }}>
        <CardContent>
          <Box display="flex" alignItems="center" gap={2}>
            <CheckIcon sx={{ fontSize: 48 }} />
            <Box>
              <Typography variant="h3" sx={{ fontWeight: 700 }}>
                {salesOrders.length}
              </Typography>
              <Typography variant="body1">Total Sales Orders</Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Search */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <TextField
            fullWidth
            placeholder="Cari berdasarkan nomor SO, nomor PO, nama proyek, atau customer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent>
          {loading ? (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Alert severity="error">{error}</Alert>
          ) : filteredOrders.length === 0 ? (
            <Box textAlign="center" py={4}>
              <Typography variant="body1" color="text.secondary">
                {searchQuery
                  ? 'Tidak ada Sales Order yang cocok dengan pencarian'
                  : 'Belum ada Sales Order'}
              </Typography>
            </Box>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.100' }}>
                    <TableCell><strong>Nomor SO</strong></TableCell>
                    <TableCell><strong>Nomor PO</strong></TableCell>
                    <TableCell><strong>Proyek</strong></TableCell>
                    <TableCell><strong>Customer</strong></TableCell>
                    <TableCell align="right"><strong>Nilai Kontrak</strong></TableCell>
                    <TableCell><strong>TOP</strong></TableCell>
                    <TableCell><strong>Tanggal Order</strong></TableCell>
                    <TableCell align="center"><strong>Aksi</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredOrders.map((so) => (
                    <TableRow key={so.id} hover>
                      <TableCell>
                        <Chip
                          label={so.so_number}
                          color="primary"
                          size="small"
                          sx={{ fontWeight: 600 }}
                        />
                      </TableCell>
                      <TableCell>{so.customer_po_number}</TableCell>
                      <TableCell>{so.project.project_name}</TableCell>
                                    <TableCell>{so.project?.customer?.customer_name || so.project?.customer?.name || '-'}</TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {formatCurrency(so.contract_value)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {so.top_days_agreed ? `${so.top_days_agreed} Hari` : 'Custom'}
                      </TableCell>
                      <TableCell>{formatDate(so.order_date)}</TableCell>
                      <TableCell align="center">
                        <Box display="flex" gap={1} justifyContent="center">
                          <Tooltip title="Lihat Detail">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleViewDetail(so)}
                            >
                              <ViewIcon />
                            </IconButton>
                          </Tooltip>
                          {so.po_document_url && (
                            <Tooltip title="Lihat Dokumen PO">
                              <IconButton
                                size="small"
                                color="secondary"
                                href={so.po_document_url}
                                target="_blank"
                              >
                                <DocIcon />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Detail Modal */}
      {selectedSO && (
        <SalesOrderDetailModal
          open={detailModalOpen}
          onClose={handleCloseDetail}
          salesOrder={selectedSO}
        />
      )}
    </Box>
  );
};

export default SalesOrdersPage;

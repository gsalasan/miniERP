/* eslint-disable prettier/prettier */
/**
 * SalesOrderDetails - Compact card notification shown after project is WON
 * Left: check + text. Right: yellow 'Lihat detail' button that links to Sales Orders page
 */

import React, { useEffect, useState } from 'react';
import {
  Box,
  CircularProgress,
  Card,
  CardContent,
  Button,
  Typography,
  Alert,
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { Link as RouterLink } from 'react-router-dom';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

interface SalesOrderDetailsProps {
  projectId: string;
}

interface SalesOrder {
  id: string;
  so_number: string;
  customer_po_number: string;
  order_date: string;
  top_days_agreed: number | null;
  contract_value: number;
  po_document_url: string | null;
  created_at: string;
}

const SalesOrderDetails: React.FC<SalesOrderDetailsProps> = ({ projectId }) => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [salesOrder, setSalesOrder] = useState<SalesOrder | null>(null);

  useEffect(() => {
    loadSalesOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const loadSalesOrder = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(
        `http://localhost:4002/api/v1/sales-orders/project/${projectId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (response.ok) {
        const result = await response.json();
        setSalesOrder(result.data || null);
      } else if (response.status === 404) {
        setSalesOrder(null);
      } else {
        setError('Gagal memuat Sales Order');
      }
    } catch {
      setError('Gagal memuat Sales Order');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display='flex' justifyContent='center' p={2}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  if (error) {
    return (
      <Card variant='outlined' sx={{ mb: 2 }}>
        <CardContent>
          <Alert severity='error'>{error}</Alert>
        </CardContent>
      </Card>
    );
  }

  if (!salesOrder) return null;

  return (
    <Card variant='outlined' sx={{ mb: 2 }}>
      <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
        <Box display='flex' alignItems='center' columnGap={1.25} sx={{ minWidth: 0 }}>
          <CheckCircleIcon color='success' fontSize='small' />
          <Box>
            <Typography variant='subtitle2' sx={{ fontWeight: 600, lineHeight: 1 }}>
              Sales Order
            </Typography>
            <Typography variant='caption' color='text.secondary'>
              Berhasil dibuat
            </Typography>
          </Box>
        </Box>

        <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center' }}>
          <Box sx={{
            bgcolor: 'warning.50',
            border: '1px solid',
            borderColor: 'warning.main',
            px: 1.25,
            py: 0.5,
            borderRadius: 1,
            display: 'flex',
            alignItems: 'center'
          }}>
            <Button
              component={RouterLink}
              to={`/sales-orders?soId=${salesOrder.id}`}
              variant='text'
              size='small'
              sx={{
                color: 'warning.dark',
                textTransform: 'none',
                p: 0.5,
              }}
            >
              Lihat detail
            </Button>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default SalesOrderDetails;

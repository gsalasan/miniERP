import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  CircularProgress,
  Alert,
} from "@mui/material";
import { Add as AddIcon, Visibility as ViewIcon, Delete as DeleteIcon } from "@mui/icons-material";
import { estimationsService } from "../../api/estimationsApi";
import { Estimation } from "../../types/estimation";
import { useAuth } from "../../context/AuthContext";

export const EstimationsListPage: React.FC = () => {
  const navigate = useNavigate();
  const { canCreateEstimation, canDeleteEstimation } = useAuth();
  const [estimations, setEstimations] = useState<Estimation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchEstimations();
  }, []);

  const fetchEstimations = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await estimationsService.getEstimations();
      setEstimations(response.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load estimations");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this estimation?")) {
      return;
    }

    try {
      await estimationsService.deleteEstimation(id);
      fetchEstimations();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete estimation");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "success";
      case "DRAFT":
        return "default";
      case "REJECTED":
        return "error";
      case "REVISED":
        return "warning";
      default:
        return "default";
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">
          Cost Estimations
        </Typography>
        {canCreateEstimation() && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate("/estimations/new")}
          >
            New Estimation
          </Button>
        )}
      </Box>

      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Card>
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Project ID</TableCell>
                  <TableCell>Version</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Total HPP</TableCell>
                  <TableCell align="right">Total Sell Price</TableCell>
                  <TableCell align="right">Profit</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {estimations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography color="text.secondary" py={4}>
                        No estimations found. Create your first estimation!
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  estimations.map((estimation) => {
                    const profit =
                      Number(estimation.total_sell_price) - Number(estimation.total_hpp);
                    return (
                      <TableRow key={estimation.id} hover>
                        <TableCell>{estimation.project_id}</TableCell>
                        <TableCell>v{estimation.version}</TableCell>
                        <TableCell>
                          <Chip
                            label={estimation.status}
                            color={getStatusColor(estimation.status) as any}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="right">
                          {formatCurrency(Number(estimation.total_hpp))}
                        </TableCell>
                        <TableCell align="right">
                          {formatCurrency(Number(estimation.total_sell_price))}
                        </TableCell>
                        <TableCell align="right">
                          <Typography color="success.main" fontWeight="600">
                            {formatCurrency(profit)}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <IconButton
                            size="small"
                            onClick={() => navigate(`/estimations/${estimation.id}`)}
                          >
                            <ViewIcon />
                          </IconButton>
                          {canDeleteEstimation() && (
                            <IconButton size="small" onClick={() => handleDelete(estimation.id)}>
                              <DeleteIcon />
                            </IconButton>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
};

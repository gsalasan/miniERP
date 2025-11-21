import React, { useState, useEffect } from "react";
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  CircularProgress,
  Alert,
  Paper,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  Visibility as VisibilityIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { estimationsService } from "../../api";
import { useAuth } from "../../context/AuthContext";
import { useNotification } from "../../contexts/NotificationContext";

interface ApprovalEstimation {
  id: string;
  ce_number: string;
  project: {
    project_name: string;
    project_number: string;
    customer: {
      customer_name: string;
    };
  };
  assigned_to: {
    employee: {
      full_name: string;
    };
  };
  requested_by: {
    employee: {
      full_name: string;
    };
  };
  status: string;
  total_sell_price: number;
  gross_margin_percentage: number;
  submitted_at: string;
  date_requested: string;
  // Enhanced fields from backend
  total_direct_hpp?: number;
  total_overhead_allocation?: number;
  overhead_percentage?: number;
  total_hpp?: number;
  average_markup_percentage?: number;
}

export const ApprovalQueuePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isProjectManager, hasAnyRole } = useAuth();
  const { showError } = useNotification();
  
  const [estimations, setEstimations] = useState<ApprovalEstimation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check authorization
  const canApprove = hasAnyRole(["CEO", "PROJECT_MANAGER", "OPERATIONAL_MANAGER"]);

  useEffect(() => {
    if (!canApprove) {
      showError("Anda tidak memiliki akses ke halaman ini");
      navigate("/dashboard");
      return;
    }
    fetchApprovalQueue();
  }, [canApprove]);

  const fetchApprovalQueue = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await estimationsService.getApprovalQueue();
      setEstimations(response.data || []);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Gagal memuat antrian approval";
      setError(errorMsg);
      showError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (
    status: string
  ): "default" | "primary" | "secondary" | "error" | "warning" | "info" | "success" => {
    switch (status) {
      case "PENDING_APPROVAL":
        return "warning";
      case "APPROVED":
        return "success";
      case "PENDING_DISCOUNT_APPROVAL":
        return "info";
      case "DISCOUNT_APPROVED":
        return "primary";
      case "REJECTED":
        return "error";
      case "REVISION_REQUIRED":
        return "info";
      default:
        return "default";
    }
  };

  const getStatusLabel = (status: string): string => {
    const labels: Record<string, string> = {
      PENDING_APPROVAL: "Menunggu Approval",
      APPROVED: "Disetujui",
      PENDING_DISCOUNT_APPROVAL: "Menunggu Approval Diskon",
      DISCOUNT_APPROVED: "Diskon Disetujui",
      REJECTED: "Ditolak",
      REVISION_REQUIRED: "Perlu Revisi",
      DRAFT: "Draft",
      PENDING: "Baru",
      IN_PROGRESS: "Dikerjakan",
    };
    return labels[status] || status;
  };

  const handleReview = (id: string) => {
    navigate(`/estimations/${id}/review`);
  };

  if (!canApprove) {
    return null;
  }

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Antrian Approval Estimasi
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Estimasi yang menunggu persetujuan dari Project Manager atau CEO
          </Typography>
        </Box>
        <Tooltip title="Refresh">
          <IconButton onClick={fetchApprovalQueue} disabled={loading}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Main Content */}
      <Card>
        <CardContent>
          {loading ? (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress />
            </Box>
          ) : estimations.length === 0 ? (
            <Box textAlign="center" py={6}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Tidak ada estimasi yang menunggu approval
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Semua estimasi telah diproses atau belum ada yang disubmit
              </Typography>
            </Box>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>CE Number</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Project</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Customer</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>PE</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Sales</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">
                      Harga Jual
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">
                      OH %
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">
                      Markup %
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">
                      GM %
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Submitted</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="center">
                      Aksi
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {estimations.map((est) => (
                    <TableRow key={est.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>
                          {est.ce_number || "-"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{est.project.project_name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {est.project.project_number}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {est.project.customer.customer_name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {est.assigned_to?.employee?.full_name || "-"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {est.requested_by?.employee?.full_name || "-"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={getStatusLabel(est.status)}
                          color={getStatusColor(est.status)}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight={600}>
                          {formatCurrency(est.total_sell_price || 0)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Chip
                          label={`${(est.overhead_percentage || 0).toFixed(1)}%`}
                          color="info"
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Chip
                          label={`${(est.average_markup_percentage || 0).toFixed(1)}%`}
                          color={
                            (est.average_markup_percentage || 0) >= 30
                              ? "success"
                              : (est.average_markup_percentage || 0) >= 20
                              ? "primary"
                              : "warning"
                          }
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Chip
                          label={`${(est.gross_margin_percentage || 0).toFixed(1)}%`}
                          color={
                            (est.gross_margin_percentage || 0) >= 20
                              ? "success"
                              : (est.gross_margin_percentage || 0) >= 10
                              ? "warning"
                              : "error"
                          }
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {est.submitted_at ? formatDate(est.submitted_at) : "-"}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Button
                          variant="contained"
                          size="small"
                          startIcon={<VisibilityIcon />}
                          onClick={() => handleReview(est.id)}
                        >
                          Review
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Summary Stats */}
      {!loading && estimations.length > 0 && (
        <Box sx={{ mt: 3, display: "flex", gap: 2 }}>
          <Card sx={{ flex: 1 }}>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Total Menunggu Approval
              </Typography>
              <Typography variant="h4">{estimations.length}</Typography>
            </CardContent>
          </Card>
          <Card sx={{ flex: 1 }}>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Total Nilai
              </Typography>
              <Typography variant="h4">
                {formatCurrency(
                  estimations.reduce((sum, est) => sum + (est.total_sell_price || 0), 0)
                )}
              </Typography>
            </CardContent>
          </Card>
        </Box>
      )}
    </Container>
  );
};

export default ApprovalQueuePage;

import React, { useState, useEffect } from "react";
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  CircularProgress,
  Alert,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";
import {
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Edit as RevisionIcon,
  ArrowBack as BackIcon,
} from "@mui/icons-material";
import { useNavigate, useParams } from "react-router-dom";
import { estimationsService } from "../../api";
import { useAuth } from "../../context/AuthContext";
import { useNotification } from "../../contexts/NotificationContext";
import { OverheadBreakdownTable } from "../../components/calculator/OverheadBreakdownTable";

interface EstimationReview {
  id: string;
  ce_number: string;
  status: string;
  so_number?: string | null;
  so_date?: string | null;
  sales_order_id?: string | null;
  sales_order?: {
    id: string;
    so_number: string;
    order_date: string;
  } | null;
  project: {
    project_name: string;
    project_number: string;
    customer: {
      customer_name: string;
      city: string;
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
  technical_brief: string;
  items: Array<{
    id: string;
    item_id: string;
    item_type: 'MATERIAL' | 'SERVICE';
    item_name?: string;
    quantity: number | string;
    unit?: string;
    hpp_at_estimation: number | string;
    sell_price_at_estimation: number | string;
  }>;
  total_direct_hpp: number | string;
  total_overhead_allocation: number | string;
  overhead_percentage?: number;
  total_hpp: number | string;
  total_sell_price: number | string;
  gross_margin_percentage: number | string;
  submitted_at: string;
  submitted_by_user_id: string;
  // Enhanced fields from PricingEngine & OverheadEngine
  overhead_breakdown?: Array<{
    category: string;
    target_percentage: number;
    allocation_percentage_to_hpp: number;
    allocated_amount: number;
    description: string;
  }>;
  pricing_summary?: {
    total_items: number;
    total_hpp: number;
    total_markup: number;
    total_sell_price: number;
    average_markup_percentage: number;
  };
  average_markup_percentage?: number;
  policy_applied?: string;
}

export const EstimationReviewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasAnyRole } = useAuth();
  const { showSuccess, showError } = useNotification();

  const [estimation, setEstimation] = useState<EstimationReview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [decisionMade, setDecisionMade] = useState(false);
  // item names are provided by backend via item.item_name

  // Dialog states
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogType, setDialogType] = useState<"approve" | "reject" | "revision">("approve");
  const [reviewerComments, setReviewerComments] = useState("");

  const canApprove = hasAnyRole(["CEO", "PROJECT_MANAGER", "OPERATIONAL_MANAGER"]);

  useEffect(() => {
    if (!canApprove) {
      showError("Anda tidak memiliki akses ke halaman ini");
      navigate("/estimations/approval-queue");
      return;
    }
    if (id) {
      fetchEstimation();
    }
  }, [id, canApprove]);

  const fetchEstimation = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const response = await estimationsService.getEstimationById(id);
      setEstimation(response.data);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Gagal memuat estimasi";
      setError(errorMsg);
      showError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (type: "approve" | "reject" | "revision") => {
    setDialogType(type);
    setReviewerComments("");
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setReviewerComments("");
  };

  const handleSubmitDecision = async () => {
    if (!id) return;

    const decisionMap = {
      approve: "APPROVED" as const,
      reject: "REJECTED" as const,
      revision: "REVISION_REQUIRED" as const,
    };

    setSubmitting(true);
    try {
      await estimationsService.decideOnEstimation(id, {
        decision: decisionMap[dialogType],
        reviewerComments: reviewerComments || undefined,
      });

      const actionText =
        dialogType === "approve"
          ? "disetujui"
          : dialogType === "reject"
          ? "ditolak"
          : "diminta revisi";

      showSuccess(`Estimasi berhasil ${actionText}!`);
      // Update status locally agar tidak pindah halaman namun status berubah
      setEstimation((prev) =>
        prev
          ? {
              ...prev,
              status:
                dialogType === "approve"
                  ? "APPROVED"
                  : dialogType === "reject"
                  ? "REJECTED"
                  : "REVISION_REQUIRED",
            }
          : prev
      );
      setDecisionMade(true);
      handleCloseDialog();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Gagal memproses keputusan";
      showError(errorMsg);
    } finally {
      setSubmitting(false);
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
      month: "long",
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
      REJECTED: "Ditolak",
      REVISION_REQUIRED: "Perlu Revisi",
      DRAFT: "Draft",
      PENDING: "Baru",
      IN_PROGRESS: "Dikerjakan",
    };
    return labels[status] || status;
  };

  if (!canApprove) {
    return null;
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error || !estimation) {
    return (
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error || "Estimasi tidak ditemukan"}
        </Alert>
        <Button startIcon={<BackIcon />} onClick={() => navigate("/estimations/approval-queue")}>
          Kembali ke Antrian
        </Button>
      </Container>
    );
  }

  const totalSellPrice = Number(estimation.total_sell_price) || 0;
  const totalHpp = Number(estimation.total_hpp) || 0;
  
  const netMarginPercentage =
    totalSellPrice > 0
      ? ((totalSellPrice - totalHpp) / totalSellPrice) * 100
      : 0;

  return (
      <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Button
          startIcon={<BackIcon />}
          onClick={() => navigate("/estimations/approval-queue")}
          sx={{ mb: 2 }}
        >
          Kembali ke Antrian Approval
        </Button>
        <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
          Review & Approval Estimasi: {estimation.project.project_name}
        </Typography>
        <Box sx={{ display: "flex", gap: 2, alignItems: "center", mt: 1 }}>
          <Chip
            label={`CE: ${estimation.ce_number}`}
            color="primary"
            variant="outlined"
          />
          {(estimation.so_number || estimation.sales_order?.so_number) && (
            <Chip
              label={`SO: ${estimation.so_number || estimation.sales_order?.so_number}`}
              color="secondary"
              variant="outlined"
            />
          )}
          <Chip
            label={getStatusLabel(estimation.status)}
            color={getStatusColor(estimation.status)}
          />
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Left Column - Details */}
        <Grid item xs={12} lg={8}>
          {/* BAGIAN 1: Ringkasan Utama (Read-only) */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight="bold" color="primary">
                Informasi Proyek
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Nomor Proyek
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {estimation.project.project_number}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Nama Proyek
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {estimation.project.project_name}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Customer
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {estimation.project.customer.customer_name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {estimation.project.customer.city}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Sales PIC (Pengaju)
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {estimation.requested_by?.employee?.full_name || "-"}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Project Engineer (Pengerjaan)
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {estimation.assigned_to?.employee?.full_name || "Belum ditugaskan"}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Tanggal Submit
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {estimation.submitted_at ? formatDate(estimation.submitted_at) : "-"}
                  </Typography>
                </Grid>
                {(estimation.so_number || estimation.sales_order?.so_number) && (
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      SO Number
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {estimation.so_number || estimation.sales_order?.so_number}
                    </Typography>
                  </Grid>
                )}
                {(estimation.so_date || estimation.sales_order?.order_date) && (
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      SO Date
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {formatDate((estimation.so_date || estimation.sales_order?.order_date) as string)}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>

          {/* BAGIAN 2: Brief Teknis */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight="bold" color="primary">
                Brief Teknis
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", lineHeight: 1.8 }}>
                {estimation.technical_brief || "Tidak ada brief teknis"}
              </Typography>
            </CardContent>
          </Card>

          {/* BAGIAN 3: Rincian BoQ (Read-only) */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight="bold" color="primary">
                Bill of Quantities (BoQ) - Rincian Lengkap
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 500 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: "bold", bgcolor: "grey.100" }}>
                        Item
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: "bold", bgcolor: "grey.100" }}>
                        Qty
                      </TableCell>
                      <TableCell sx={{ fontWeight: "bold", bgcolor: "grey.100" }}>
                        Unit
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: "bold", bgcolor: "grey.100" }}>
                        HPP/Unit
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: "bold", bgcolor: "grey.100" }}>
                        Total HPP
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {estimation.items && estimation.items.length > 0 ? (
                      estimation.items.map((item, idx) => {
                        const itemName = item.item_name || "-";
                        const itemType = item.item_type === 'MATERIAL' ? 'Material' : 'Service';
                        const quantity = Number(item.quantity) || 0;
                        const hppPerUnit = Number(item.hpp_at_estimation) || 0;
                        const totalHpp = quantity * hppPerUnit;
                        return (
                          <TableRow key={idx}>
                            <TableCell>
                              <Typography variant="body2" fontWeight="medium">
                                {itemName}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {itemType}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">{quantity}</TableCell>
                            <TableCell>{item.unit || "-"}</TableCell>
                            <TableCell align="right">
                              {formatCurrency(hppPerUnit)}
                            </TableCell>
                            <TableCell align="right">
                              {formatCurrency(totalHpp)}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} align="center">
                          <Typography variant="body2" color="text.secondary">
                            Tidak ada item BoQ
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>

          {/* BAGIAN 4: Overhead Breakdown (if available) */}
          {estimation.overhead_breakdown && estimation.overhead_breakdown.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <OverheadBreakdownTable
                overheadBreakdown={estimation.overhead_breakdown}
                totalOverhead={Number(estimation.total_overhead_allocation) || 0}
                policyApplied={estimation.policy_applied}
              />
            </Box>
          )}
        </Grid>

        {/* Right Column - Financial Summary & Actions */}
        <Grid item xs={12} lg={4}>
          {/* Financial Summary */}
          <Card sx={{ mb: 3, position: "sticky", top: 16 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Ringkasan Finansial
              </Typography>
              <Divider sx={{ my: 2 }} />

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Total HPP Direct
                </Typography>
                <Typography variant="h6">
                  {formatCurrency(Number(estimation.total_direct_hpp) || 0)}
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Overhead Allocation
                </Typography>
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography variant="h6">
                    {formatCurrency(Number(estimation.total_overhead_allocation) || 0)}
                  </Typography>
                  {estimation.overhead_percentage && (
                    <Chip
                      label={`${estimation.overhead_percentage.toFixed(1)}%`}
                      size="small"
                      color="info"
                      variant="outlined"
                    />
                  )}
                </Box>
                {estimation.policy_applied && (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
                    {estimation.policy_applied}
                  </Typography>
                )}
              </Box>

              {estimation.average_markup_percentage !== undefined && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Average Markup
                  </Typography>
                  <Chip
                    label={`${estimation.average_markup_percentage.toFixed(1)}%`}
                    color={
                      estimation.average_markup_percentage >= 30
                        ? "success"
                        : estimation.average_markup_percentage >= 20
                        ? "primary"
                        : "warning"
                    }
                    size="medium"
                  />
                  {estimation.pricing_summary && (
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
                      {estimation.pricing_summary.total_items} items dengan total markup {formatCurrency(estimation.pricing_summary.total_markup)}
                    </Typography>
                  )}
                </Box>
              )}

              <Divider sx={{ my: 2 }} />

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Total HPP
                </Typography>
                <Typography variant="h6" fontWeight={700}>
                  {formatCurrency(Number(estimation.total_hpp) || 0)}
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Gross Margin
                </Typography>
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography variant="h6">
                    {formatCurrency(
                      (Number(estimation.total_sell_price) || 0) - (Number(estimation.total_direct_hpp) || 0)
                    )}
                  </Typography>
                  <Chip
                    label={`${(Number(estimation.gross_margin_percentage) || 0).toFixed(1)}%`}
                    color={
                      (Number(estimation.gross_margin_percentage) || 0) >= 20
                        ? "success"
                        : (Number(estimation.gross_margin_percentage) || 0) >= 10
                        ? "warning"
                        : "error"
                    }
                    size="small"
                  />
                </Box>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Net Margin
                </Typography>
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography variant="h6">
                    {formatCurrency(
                      (Number(estimation.total_sell_price) || 0) - (Number(estimation.total_hpp) || 0)
                    )}
                  </Typography>
                  <Chip
                    label={`${netMarginPercentage.toFixed(1)}%`}
                    color={
                      netMarginPercentage >= 15
                        ? "success"
                        : netMarginPercentage >= 8
                        ? "warning"
                        : "error"
                    }
                    size="small"
                  />
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Harga Jual
                </Typography>
                <Typography variant="h5" fontWeight={700} color="primary">
                  {formatCurrency(Number(estimation.total_sell_price) || 0)}
                </Typography>
              </Box>
            </CardContent>
          </Card>

          {/* Approval Actions */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Keputusan Approval
              </Typography>
              <Box display="flex" flexDirection="column" gap={2}>
                <Button
                  variant="contained"
                  color="success"
                  fullWidth
                  size="large"
                  startIcon={<ApproveIcon />}
                  onClick={() => handleOpenDialog("approve")}
                  disabled={decisionMade}
                >
                  Setujui
                </Button>
                <Button
                  variant="contained"
                  color="warning"
                  fullWidth
                  size="large"
                  startIcon={<RevisionIcon />}
                  onClick={() => handleOpenDialog("revision")}
                  disabled={decisionMade}
                >
                  Minta Revisi
                </Button>
                <Button
                  variant="contained"
                  color="error"
                  fullWidth
                  size="large"
                  startIcon={<RejectIcon />}
                  onClick={() => handleOpenDialog("reject")}
                  disabled={decisionMade}
                >
                  Tolak
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Decision Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {dialogType === "approve"
            ? "Konfirmasi Persetujuan"
            : dialogType === "reject"
            ? "Konfirmasi Penolakan"
            : "Minta Revisi"}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {dialogType === "approve"
              ? "Apakah Anda yakin ingin menyetujui estimasi ini? Estimasi akan diteruskan ke Sales."
              : dialogType === "reject"
              ? "Apakah Anda yakin ingin menolak estimasi ini? Project Engineer akan diberitahu."
              : "Silakan berikan catatan revisi untuk Project Engineer."}
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={4}
            label={
              dialogType === "approve" ? "Catatan (opsional)" : "Catatan / Alasan (wajib diisi)"
            }
            value={reviewerComments}
            onChange={(e) => setReviewerComments(e.target.value)}
            placeholder={
              dialogType === "approve"
                ? "Tambahkan catatan jika diperlukan..."
                : dialogType === "reject"
                ? "Jelaskan alasan penolakan..."
                : "Jelaskan apa yang perlu direvisi..."
            }
            required={dialogType !== "approve"}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={submitting}>
            Batal
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmitDecision}
            disabled={submitting || (dialogType !== "approve" && !reviewerComments.trim())}
            color={
              dialogType === "approve" ? "success" : dialogType === "reject" ? "error" : "warning"
            }
          >
            {submitting ? <CircularProgress size={24} /> : "Konfirmasi"}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default EstimationReviewPage;

import React, { useState } from "react";
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  TextField,
  Alert,
  Chip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import {
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Schedule as ScheduleIcon,
} from "@mui/icons-material";
import { topApi } from "../api/top";

interface TOPApprovalCardProps {
  historyItem: {
    id: string;
    old_top_days: number;
    new_top_days: number;
    changed_by_user?: {
      employee?: {
        full_name: string;
      };
    };
    changed_at: string;
    effective_date?: string | null;
    reason: string;
    status: string;
  };
  onApprovalComplete?: () => void;
}

const TOPApprovalCard: React.FC<TOPApprovalCardProps> = ({
  historyItem,
  onApprovalComplete,
}) => {
  const [openRejectDialog, setOpenRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleApprove = async () => {
    try {
      setLoading(true);
      setError(null);

      await topApi.approveTOPChange(historyItem.id, {
        approved: true,
      });

      setSuccess("Perubahan TOP berhasil disetujui");

      setTimeout(() => {
        if (onApprovalComplete) onApprovalComplete();
      }, 1500);
    } catch (err: unknown) {
      if (err && typeof err === "object" && "response" in err) {
        const axiosError = err as {
          response?: { data?: { message?: string } };
        };
        setError(axiosError.response?.data?.message || "Gagal menyetujui perubahan TOP");
      } else {
        setError("Gagal menyetujui perubahan TOP");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason || rejectionReason.trim().length < 5) {
      setError("Alasan penolakan harus diisi minimal 5 karakter");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await topApi.approveTOPChange(historyItem.id, {
        approved: false,
        rejection_reason: rejectionReason,
      });

      setSuccess("Perubahan TOP berhasil ditolak");
      setOpenRejectDialog(false);

      setTimeout(() => {
        if (onApprovalComplete) onApprovalComplete();
      }, 1500);
    } catch (err: unknown) {
      if (err && typeof err === "object" && "response" in err) {
        const axiosError = err as {
          response?: { data?: { message?: string } };
        };
        setError(axiosError.response?.data?.message || "Gagal menolak perubahan TOP");
      } else {
        setError("Gagal menolak perubahan TOP");
      }
    } finally {
      setLoading(false);
    }
  };

  if (historyItem.status !== "PENDING") {
    return null; // Only show for pending requests
  }

  return (
    <>
      <Card
        variant="outlined"
        sx={{
          mb: 3,
          borderColor: "warning.main",
          borderWidth: 2,
          bgcolor: "warning.50",
        }}
      >
        <CardContent>
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <ScheduleIcon color="warning" />
              <Typography variant="h6" fontWeight={600}>
                Permintaan Perubahan TOP
              </Typography>
              <Chip label="Menunggu Persetujuan" color="warning" size="small" />
            </Box>
          </Box>

          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Diajukan oleh: <strong>{historyItem.changed_by_user?.employee?.full_name || "-"}</strong>
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Tanggal: {formatDate(historyItem.changed_at)}
            </Typography>
            {historyItem.effective_date && (
              <Typography variant="body2" color="text.secondary">
                Berlaku mulai: {formatDate(historyItem.effective_date)}
              </Typography>
            )}
          </Box>

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 2,
              mb: 2,
              p: 2,
              bgcolor: "background.paper",
              borderRadius: 1,
            }}
          >
            <Box>
              <Typography variant="caption" color="text.secondary">
                TOP Lama
              </Typography>
              <Typography variant="h5" fontWeight={600}>
                {historyItem.old_top_days} hari
              </Typography>
            </Box>
            <Typography variant="h4" color="text.secondary">
              →
            </Typography>
            <Box>
              <Typography variant="caption" color="text.secondary">
                TOP Baru
              </Typography>
              <Typography variant="h5" fontWeight={600} color="primary">
                {historyItem.new_top_days} hari
              </Typography>
            </Box>
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Alasan:
            </Typography>
            <Typography variant="body1">{historyItem.reason}</Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {success}
            </Alert>
          )}

          <Box sx={{ display: "flex", gap: 2 }}>
            <Button
              variant="contained"
              color="success"
              startIcon={loading ? <CircularProgress size={16} /> : <ApproveIcon />}
              onClick={handleApprove}
              disabled={loading || !!success}
              fullWidth
            >
              Setujui
            </Button>
            <Button
              variant="outlined"
              color="error"
              startIcon={<RejectIcon />}
              onClick={() => setOpenRejectDialog(true)}
              disabled={loading || !!success}
              fullWidth
            >
              Tolak
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Reject Dialog */}
      <Dialog open={openRejectDialog} onClose={() => setOpenRejectDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Tolak Perubahan TOP</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Alasan Penolakan"
            multiline
            rows={4}
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            required
            helperText="Minimal 5 karakter"
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenRejectDialog(false)} disabled={loading}>
            Batal
          </Button>
          <Button
            onClick={handleReject}
            variant="contained"
            color="error"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={16} /> : null}
          >
            {loading ? "Menolak..." : "Tolak Permintaan"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default TOPApprovalCard;

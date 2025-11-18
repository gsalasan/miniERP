import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Chip,
  Divider,
  Stack,
  Avatar,
  IconButton,
  Paper,
  Grid,
} from "@mui/material";
import {
  Close as CloseIcon,
  CalendarToday as CalendarIcon,
  Person as PersonIcon,
  Assignment as AssignmentIcon,
  AttachFile as AttachFileIcon,
  Business as BusinessIcon,
} from "@mui/icons-material";
import { Estimation } from "../../types/estimation";

interface EstimationDetailModalProps {
  open: boolean;
  onClose: () => void;
  estimation: Estimation | null;
}

/**
 * Modal untuk menampilkan detail permintaan estimasi
 * Digunakan di halaman Antrian Kerja Estimasi
 */
export const EstimationDetailModal: React.FC<EstimationDetailModalProps> = ({
  open,
  onClose,
  estimation,
}) => {
  if (!estimation) return null;

  // Keep raw date strings available for display (helpful for diagnosing timezone issues)
  const rawDateRequested = estimation.date_requested;
  const rawDateAssigned = estimation.date_assigned;
  const rawDateStarted = estimation.date_started;
  const rawDateCompleted = estimation.date_completed;

  const getStatusColor = (
    status: string,
  ): "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning" => {
    const colors: Record<
      string,
      "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning"
    > = {
      PENDING: "info",
      ASSIGNED: "primary",
      IN_PROGRESS: "warning",
      PENDING_INFO: "secondary",
      COMPLETED: "success",
      APPROVED: "success",
      REJECTED: "error",
      ARCHIVED: "default",
    };
    return colors[status] || "default";
  };

  const getStatusLabel = (status: string): string => {
    const labels: Record<string, string> = {
      PENDING: "Menunggu Ditugaskan",
      ASSIGNED: "Sudah Ditugaskan",
      IN_PROGRESS: "Sedang Dikerjakan",
      PENDING_INFO: "Menunggu Informasi",
      COMPLETED: "Selesai",
      APPROVED: "Disetujui",
      REJECTED: "Ditolak",
      ARCHIVED: "Diarsipkan",
    };
    return labels[status] || status;
  };

  const formatDate = (date?: Date | string | null): string => {
    if (!date) return "-";
    // Selalu konversi ke WIB (Asia/Jakarta)
    const dateObj = typeof date === "string" ? new Date(date) : date;
    try {
      const formatter = new Intl.DateTimeFormat("id-ID", {
        timeZone: "Asia/Jakarta",
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
      return formatter.format(dateObj as Date) + " WIB";
    } catch (err) {
      // Fallback ke format lokal jika Intl gagal
      return (
        dateObj.toLocaleString("id-ID", {
          day: "numeric",
          month: "long",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }) + " WIB"
      );
    }
  };

  const attachments = estimation.attachments as Array<{ name: string; url: string }> | null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 },
      }}
    >
      {/* Header */}
      <DialogTitle sx={{ pb: 1 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6" fontWeight="bold">
            Detail Permintaan Estimasi
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <Divider />

      {/* Content */}
      <DialogContent sx={{ pt: 3 }}>
        <Stack spacing={3}>
          {/* Status Badge */}
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Chip
              label={getStatusLabel(estimation.status)}
              color={getStatusColor(estimation.status)}
              size="medium"
              sx={{ fontWeight: 600 }}
            />
            <Typography variant="body2" color="text.secondary">
              Version {estimation.version}
            </Typography>
          </Box>

          {/* Project Info */}
          <Paper elevation={0} sx={{ p: 2, bgcolor: "grey.50" }}>
            <Stack spacing={2}>
              <Box display="flex" alignItems="center" gap={1}>
                <BusinessIcon color="primary" />
                <Typography variant="subtitle1" fontWeight="bold">
                  Informasi Proyek
                </Typography>
              </Box>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    ID Proyek
                  </Typography>
                  <Typography variant="body1" fontWeight="600">
                    {estimation.project?.project_number || "-"}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Nama Proyek
                  </Typography>
                  <Typography variant="body1" fontWeight="600">
                    {estimation.project?.project_name || "Proyek Baru"}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Client
                  </Typography>
                  <Typography variant="body1">
                    {estimation.client?.customer_name ||
                      estimation.client_name ||
                      estimation.project?.customer?.customer_name ||
                      estimation.project?.client_name ||
                      "-"}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Kota
                  </Typography>
                  <Typography variant="body1">
                    {estimation.project?.customer?.city || "-"}
                  </Typography>
                </Grid>
                {/* CE Info */}
                <Paper elevation={0} sx={{ p: 2, bgcolor: "grey.50" }}>
                  <Stack spacing={2}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <AssignmentIcon color="secondary" />
                      <Typography variant="subtitle1" fontWeight="bold">
                        CE (Cost Estimation)
                      </Typography>
                    </Box>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          CE Number
                        </Typography>
                        <Typography variant="body1" fontWeight="600">
                          {estimation.ce_number || "-"}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          CE Date
                        </Typography>
                        <Typography variant="body1" fontWeight="600">
                          {formatDate(estimation.ce_date)}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          CE Period Start
                        </Typography>
                        <Typography variant="body1">
                          {formatDate(estimation.ce_period_start)}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          CE Period End
                        </Typography>
                        <Typography variant="body1">
                          {formatDate(estimation.ce_period_end)}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Stack>
                </Paper>
              </Grid>
            </Stack>
          </Paper>

          {/* Technical Brief */}
          <Box>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <AssignmentIcon color="primary" />
              <Typography variant="subtitle1" fontWeight="bold">
                Brief Teknis
              </Typography>
            </Box>
            <Paper variant="outlined" sx={{ p: 2, bgcolor: "background.paper" }}>
              <Typography variant="body1" sx={{ whiteSpace: "pre-wrap" }}>
                {estimation.technical_brief || "Tidak ada brief teknis"}
              </Typography>
            </Paper>
          </Box>

          {/* Attachments */}
          {attachments && attachments.length > 0 && (
            <Box>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <AttachFileIcon color="primary" />
                <Typography variant="subtitle1" fontWeight="bold">
                  Lampiran ({attachments.length})
                </Typography>
              </Box>
              <Stack spacing={1}>
                {attachments.map((file, index) => (
                  <Paper
                    key={index}
                    variant="outlined"
                    sx={{
                      p: 1.5,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      "&:hover": {
                        bgcolor: "action.hover",
                        cursor: file.url ? "pointer" : "not-allowed",
                      },
                    }}
                    onClick={() => {
                      if (file.url && /^https?:\/\//.test(file.url)) {
                        window.open(file.url, "_blank");
                      } else {
                        alert("URL lampiran tidak valid atau kosong!");
                      }
                    }}
                  >
                    <Box display="flex" alignItems="center" gap={1}>
                      <AttachFileIcon fontSize="small" color="action" />
                      <Typography variant="body2">{file.name}</Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      Buka →
                    </Typography>
                  </Paper>
                ))}
              </Stack>
            </Box>
          )}

          {/* People Involved */}
          <Paper elevation={0} sx={{ p: 2, bgcolor: "grey.50" }}>
            <Stack spacing={2}>
              <Box display="flex" alignItems="center" gap={1}>
                <PersonIcon color="primary" />
                <Typography variant="subtitle1" fontWeight="bold">
                  Orang Terlibat
                </Typography>
              </Box>
              <Grid container spacing={2}>
                {/* Requested By */}
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary" mb={1}>
                    Diajukan oleh
                  </Typography>
                  {estimation.requested_by ? (
                    <Box display="flex" alignItems="center" gap={1}>
                      <Avatar sx={{ width: 32, height: 32, bgcolor: "secondary.main" }}>
                        {estimation.requested_by.employee?.full_name?.charAt(0) || "?"}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight="600">
                          {estimation.requested_by.employee?.full_name ||
                            estimation.requested_by.email}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {estimation.requested_by.email}
                        </Typography>
                      </Box>
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      {estimation.sales_pic || "-"}
                    </Typography>
                  )}
                </Grid>

                {/* Assigned To */}
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary" mb={1}>
                    Ditugaskan ke
                  </Typography>
                  {estimation.assigned_to ? (
                    <Box display="flex" alignItems="center" gap={1}>
                      <Avatar sx={{ width: 32, height: 32, bgcolor: "primary.main" }}>
                        {estimation.assigned_to.employee?.full_name?.charAt(0) || "?"}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight="600">
                          {estimation.assigned_to.employee?.full_name ||
                            estimation.assigned_to.email}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {estimation.assigned_to.email}
                        </Typography>
                      </Box>
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Belum ditugaskan
                    </Typography>
                  )}
                </Grid>
              </Grid>
            </Stack>
          </Paper>

          {/* Timeline */}
          <Box>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <CalendarIcon color="primary" />
              <Typography variant="subtitle1" fontWeight="bold">
                Timeline
              </Typography>
            </Box>
            <Stack spacing={1.5}>
              <Box display="flex" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">
                  Tanggal Permintaan
                </Typography>
                <Box textAlign="right">
                  <Typography variant="body2" fontWeight="600">
                    {formatDate(estimation.date_requested)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {rawDateRequested ? String(rawDateRequested) : "-"}
                  </Typography>
                </Box>
              </Box>
              {estimation.date_assigned && (
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    Tanggal Ditugaskan
                  </Typography>
                  <Typography variant="body2" fontWeight="600">
                    {formatDate(estimation.date_assigned)}
                  </Typography>
                </Box>
              )}
              {estimation.date_started && (
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    Tanggal Mulai Dikerjakan
                  </Typography>
                  <Typography variant="body2" fontWeight="600">
                    {formatDate(estimation.date_started)}
                  </Typography>
                </Box>
              )}
              {estimation.date_completed && (
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    Tanggal Selesai
                  </Typography>
                  <Typography variant="body2" fontWeight="600">
                    {formatDate(estimation.date_completed)}
                  </Typography>
                </Box>
              )}
            </Stack>
          </Box>
        </Stack>
      </DialogContent>

      <Divider />

      {/* Actions */}
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} variant="outlined">
          Tutup
        </Button>
        <Button
          variant="contained"
          onClick={() => {
            window.location.href = `/estimations/${estimation.id}/view`;
          }}
        >
          Lihat Detail Kalkulasi
        </Button>
      </DialogActions>
    </Dialog>
  );
};

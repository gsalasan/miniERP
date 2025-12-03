import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Typography,
  Box,
  CircularProgress,
  Pagination,
  Alert,
} from "@mui/material";
import { topApi, TOPHistoryItem } from "../api/top";

interface TOPHistoryDialogProps {
  open: boolean;
  onClose: () => void;
  customerId: string;
  customerName: string;
}

const TOPHistoryDialog: React.FC<TOPHistoryDialogProps> = ({
  open,
  onClose,
  customerId,
  customerName,
}) => {
  const [history, setHistory] = useState<TOPHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;

  useEffect(() => {
    if (open) {
      loadHistory();
    }
  }, [open, page]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await topApi.getTOPHistory(customerId, page, limit);
      setHistory(result.data);
      setTotalPages(result.pagination.total_pages);
    } catch (err: unknown) {
      if (err && typeof err === "object" && "response" in err) {
        const axiosError = err as {
          response?: { data?: { message?: string } };
        };
        setError(axiosError.response?.data?.message || "Gagal memuat riwayat TOP");
      } else {
        setError("Gagal memuat riwayat TOP");
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getStatusChip = (status: string) => {
    const statusConfig: Record<
      string,
      { label: string; color: "warning" | "success" | "error" | "info" }
    > = {
      PENDING: { label: "Menunggu Persetujuan", color: "warning" },
      APPROVED: { label: "Disetujui", color: "success" },
      REJECTED: { label: "Ditolak", color: "error" },
      SCHEDULED: { label: "Terjadwal", color: "info" },
    };

    const config = statusConfig[status] || {
      label: status,
      color: "info" as const,
    };
    return <Chip label={config.label} color={config.color} size="small" />;
  };

  const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        Riwayat Perubahan TOP
        <Typography variant="body2" color="text.secondary">
          Customer: {customerName}
        </Typography>
      </DialogTitle>
      <DialogContent>
        {loading && (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: 200,
            }}
          >
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {!loading && !error && history.length === 0 && (
          <Alert severity="info">Belum ada riwayat perubahan TOP</Alert>
        )}

        {!loading && !error && history.length > 0 && (
          <>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Tanggal</TableCell>
                    <TableCell>TOP Lama</TableCell>
                    <TableCell>TOP Baru</TableCell>
                    <TableCell>Tgl Berlaku</TableCell>
                    <TableCell>Diubah Oleh</TableCell>
                    <TableCell>Alasan</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Disetujui Oleh</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {history.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{formatDate(item.changed_at)}</TableCell>
                      <TableCell>{item.old_top_days} hari</TableCell>
                      <TableCell>{item.new_top_days} hari</TableCell>
                      <TableCell>
                        {item.effective_date
                          ? formatDate(item.effective_date)
                          : 'Segera'}
                      </TableCell>
                      <TableCell>
                        {item.changed_by_user?.employee?.full_name || '-'}
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          sx={{
                            maxWidth: 200,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                          title={item.reason}
                        >
                          {item.reason}
                        </Typography>
                      </TableCell>
                      <TableCell>{getStatusChip(item.status)}</TableCell>
                      <TableCell>
                        {item.approved_by_user?.employee?.full_name || '-'}
                        {item.approved_at && (
                          <Typography variant="caption" display="block">
                            {formatDate(item.approved_at)}
                          </Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {totalPages > 1 && (
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  mt: 3,
                }}
              >
                <Pagination
                  count={totalPages}
                  page={page}
                  onChange={handlePageChange}
                  color="primary"
                />
              </Box>
            )}
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Tutup</Button>
      </DialogActions>
    </Dialog>
  );
};

export default TOPHistoryDialog;

import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
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
  CircularProgress,
  Alert,
  Modal,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Avatar,
  TextField,
  InputAdornment,
} from "@mui/material";
import { Search as SearchIcon, FilterList as FilterIcon } from "@mui/icons-material";
import { estimationsService } from "../../api/estimationsApi";
// identityApi tidak lagi dipakai untuk list PE karena endpoint role-based 404
import { API_BASE_URL } from "../../config";
import { Estimation, EstimationStatus } from "../../types/estimation";
import { EstimationDetailModal } from "../../components/modals";

interface User {
  id: string;
  email: string;
  employee?: {
    id: string;
    full_name: string;
  };
}

const modalStyle = {
  position: "absolute" as const,
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 500,
  bgcolor: "background.paper",
  boxShadow: 24,
  borderRadius: 2,
  p: 4,
};

export const EstimationQueuePage: React.FC = () => {
  const { user, isProjectEngineer, isProjectManager, canAssignEstimation } = useAuth();
  const navigate = useNavigate();
  const [estimations, setEstimations] = useState<Estimation[]>([]);
  const [filteredEstimations, setFilteredEstimations] = useState<Estimation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Modal state
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedEstimation, setSelectedEstimation] = useState<Estimation | null>(null);
  const [selectedAssignee, setSelectedAssignee] = useState("");
  const [assignLoading, setAssignLoading] = useState(false);

  // Project Engineers - fetch from backend
  const [projectEngineers, setProjectEngineers] = useState<User[]>([]);
  // List PE dari Identity Service

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<EstimationStatus | "ALL">("ALL");

  // Filter logika (search + status)
  const applyFilters = () => {
    let filtered = [...estimations];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((est) => {
        const matchesMargin =
          est.gross_margin_percentage !== undefined &&
          est.gross_margin_percentage !== null &&
          est.gross_margin_percentage.toString().includes(q);
        return (
          est.project_id?.toLowerCase().includes(q) ||
          est.customer_name?.toLowerCase().includes(q) ||
          est.sales_pic?.toLowerCase().includes(q) ||
          est.requested_by?.employee?.full_name?.toLowerCase().includes(q) ||
          est.requested_by?.email?.toLowerCase().includes(q) ||
          est.project?.customer?.customer_name?.toLowerCase().includes(q) ||
          est.ce_number?.toLowerCase().includes(q) ||
          matchesMargin
        );
      });
    }

    if (statusFilter !== "ALL") {
      filtered = filtered.filter((est) => est.status === statusFilter);
    }

    // Jika user adalah Project Engineer, tampilkan hanya estimasi yang ditugaskan padanya
    if (isProjectEngineer() && user) {
      const myId = user.userId;
      const myEmail = (user.email || "").toLowerCase();
      filtered = filtered.filter((est) => {
        const assignedIdMatch = est.assigned_to_user_id === myId;
        const assignedEmailMatch = (est.assigned_to?.email || "").toLowerCase() === myEmail;
        return assignedIdMatch || assignedEmailMatch;
      });
    }

    setFilteredEstimations(filtered);
  };

  useEffect(() => {
    fetchQueue();
    fetchEngineers();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchQuery, statusFilter, estimations]);

  // Move handleViewDetail to top-level scope
  const handleViewDetail = (estimation: Estimation) => {
    setSelectedEstimation(estimation);
    setDetailModalOpen(true);
  };

  const fetchQueue = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await estimationsService.getEstimationQueue();
      setEstimations(response.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load estimation queue");
    } finally {
      setLoading(false);
    }
  };

  const fetchEngineers = async () => {
    // Single source: engineering-service /api/v1/users/engineers
    // Fallback sekunder: HR service employees list (filter by position berisi "Engineer")
    const token = localStorage.getItem("token") || localStorage.getItem("authToken");
    let users: User[] = [];
    try {
      const resp = await fetch(`${API_BASE_URL}/api/v1/users/engineers`, {
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });
      if (resp.ok) {
        const raw = await resp.json();
        users = (raw || []).map(
          (u: { id?: string; email?: string; employee?: { id?: string; full_name?: string } }) => ({
            id: u.id || "",
            email: u.email || "",
            employee: u.employee?.full_name
              ? { id: u.employee?.id || "", full_name: u.employee.full_name }
              : undefined,
          }),
        );
      }
    } catch {
      users = [];
    }
    if (!users.length) {
      // HR fallback
      try {
        const HR_BASE = "http://localhost:4004";
        const hrResp = await fetch(`${HR_BASE}/api/v1/employees/list/all`, {
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        });
        if (hrResp.ok) {
          const hrJson = await hrResp.json();
          const list: Array<{
            id?: string;
            user_id?: string;
            email?: string;
            work_email?: string;
            full_name?: string;
            position?: string;
          }> = Array.isArray(hrJson) ? hrJson : hrJson?.data || [];
          users = list
            .filter((e) => (e.position || "").toLowerCase().includes("engineer"))
            .map((e) => ({
              id: e.user_id || e.id || "",
              email: e.email || e.work_email || "",
              employee: e.full_name ? { id: e.id || "", full_name: e.full_name } : undefined,
            }));
        }
      } catch {
        // ignore
      }
    }
    setProjectEngineers(users);
  };

  const handleAssignClick = (estimation: Estimation) => {
    setSelectedEstimation(estimation);
    setSelectedAssignee("");
    setAssignModalOpen(true);
  };

  const handleAssignConfirm = async () => {
    if (!selectedEstimation || !selectedAssignee) return;
    setAssignLoading(true);
    setError(null);
    try {
      await estimationsService.assignEstimation(selectedEstimation.id, selectedAssignee);
      setSuccess("Estimation assigned successfully!");
      setAssignModalOpen(false);
      await fetchQueue();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to assign estimation");
    } finally {
      setAssignLoading(false);
    }
  };

  const handleStartWork = async (estimationId: string) => {
    setError(null);
    try {
      await estimationsService.startEstimationWork(estimationId);
      setSuccess("Started working on estimation!");
      navigate(`/estimations/${estimationId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start work");
    }
  };

  const getStatusColor = (
    status: EstimationStatus,
  ): "default" | "primary" | "secondary" | "error" | "warning" | "info" | "success" => {
    switch (status) {
      case "PENDING":
        return "info";
      case "ASSIGNED":
        return "primary";
      case "IN_PROGRESS":
        return "warning";
      case "PENDING_INFO":
        return "secondary";
      case "COMPLETED":
        return "success";
      case "APPROVED":
        return "success";
      case "REJECTED":
        return "error";
      default:
        return "default";
    }
  };

  const getStatusLabel = (status: EstimationStatus): string => {
    const labels: Record<EstimationStatus, string> = {
      PENDING: "Baru",
      ASSIGNED: "Ditugaskan",
      IN_PROGRESS: "Dikerjakan",
      PENDING_INFO: "Menunggu Info",
      COMPLETED: "Selesai",
      APPROVED: "Disetujui",
      REJECTED: "Ditolak",
      ARCHIVED: "Diarsipkan",
      DRAFT: "Draft",
      REVISED: "Direvisi",
    };
    return labels[status] || status;
  };

  const formatDate = (date?: Date | string | null): string => {
    if (!date) return "-";

    // Convert string ISO dari database ke Date object
    const dateObj = typeof date === "string" ? new Date(date) : date;

    // Format langsung tanpa specify timezone = otomatis pake timezone lokal komputer
    return dateObj.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
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
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">
          Antrian Kerja Estimasi
        </Typography>
        <Button variant="outlined" startIcon={<FilterIcon />} onClick={fetchQueue}>
          Refresh
        </Button>
      </Box>

      {/* Alerts */}
      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" onClose={() => setSuccess(null)} sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      {/* Filters */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box display="flex" gap={2}>
            <TextField
              size="small"
              placeholder="Cari proyek, pelanggan, sales, atau requester..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{ flex: 1 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as EstimationStatus | "ALL")}
                label="Status"
              >
                <MenuItem value="ALL">Semua Status</MenuItem>
                <MenuItem value="PENDING">Baru</MenuItem>
                <MenuItem value="ASSIGNED">Ditugaskan</MenuItem>
                <MenuItem value="IN_PROGRESS">Dikerjakan</MenuItem>
                <MenuItem value="PENDING_INFO">Menunggu Info</MenuItem>
                <MenuItem value="COMPLETED">Selesai</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ID Proyek</TableCell>
                  <TableCell>Nama Proyek</TableCell>
                  <TableCell>Client Name</TableCell>
                  <TableCell>CE Number</TableCell>
                  <TableCell>Gross Margin (%)</TableCell>
                  <TableCell>Diajukan oleh</TableCell>
                  <TableCell>Tanggal Masuk</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Ditugaskan ke</TableCell>
                  <TableCell align="center">Aksi</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredEstimations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <Typography color="text.secondary" py={4}>
                        {searchQuery || statusFilter !== "ALL"
                          ? "Tidak ada data yang sesuai filter"
                          : "Tidak ada antrian estimasi"}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEstimations.map((estimation) => (
                    <TableRow key={estimation.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight="600">
                          {estimation.project?.project_number ||
                            estimation.project_id?.slice(0, 8) ||
                            "-"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          sx={{
                            cursor: "pointer",
                            color: "primary.main",
                            "&:hover": { textDecoration: "underline" },
                          }}
                          onClick={() => navigate(`/estimations/${estimation.id}/view`)}
                        >
                          {estimation.project?.project_name || "Proyek Baru"}
                        </Typography>
                      </TableCell>
                      <TableCell>{estimation.project?.customer?.customer_name || "-"}</TableCell>
                      <TableCell>{estimation.ce_number || "-"}</TableCell>
                      <TableCell>
                        {estimation.gross_margin_percentage !== undefined &&
                        estimation.gross_margin_percentage !== null
                          ? estimation.gross_margin_percentage.toFixed(2)
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {estimation.requested_by ? (
                          <Box display="flex" alignItems="center" gap={1}>
                            <Avatar
                              sx={{
                                width: 24,
                                height: 24,
                                bgcolor: "secondary.main",
                                fontSize: "0.75rem",
                              }}
                            >
                              {estimation.requested_by.employee?.full_name?.charAt(0) || "?"}
                            </Avatar>
                            <Typography variant="body2">
                              {estimation.requested_by.employee?.full_name ||
                                estimation.requested_by.email}
                            </Typography>
                          </Box>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            {estimation.sales_pic || "-"}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>{formatDate(estimation.date_requested)}</TableCell>
                      <TableCell>
                        <Chip
                          label={getStatusLabel(estimation.status)}
                          color={getStatusColor(estimation.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {estimation.assigned_to ? (
                          <Box display="flex" alignItems="center" gap={1}>
                            <Avatar
                              sx={{
                                width: 32,
                                height: 32,
                                bgcolor: "primary.main",
                                fontSize: "0.875rem",
                              }}
                            >
                              {estimation.assigned_to.employee?.full_name?.charAt(0) || "?"}
                            </Avatar>
                            <Typography variant="body2">
                              {estimation.assigned_to.employee?.full_name ||
                                estimation.assigned_to.email}
                            </Typography>
                          </Box>
                        ) : canAssignEstimation() ? (
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => handleAssignClick(estimation)}
                          >
                            Tugaskan
                          </Button>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            Belum ditugaskan
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="center">
                        <Box display="flex" gap={1} justifyContent="center">
                          <Button
                            size="small"
                            variant="text"
                            color="info"
                            onClick={() => handleViewDetail(estimation)}
                          >
                            Lihat Detail
                          </Button>
                          {(isProjectEngineer() || isProjectManager()) && (
                            <Button
                              size="small"
                              variant="contained"
                              color="primary"
                              onClick={() => handleStartWork(estimation.id)}
                              disabled={
                                isProjectEngineer()
                                  ? estimation.assigned_to_user_id !== user?.userId
                                  : false
                              }
                            >
                              Kerjakan
                            </Button>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Assign Modal */}
      <Modal open={assignModalOpen} onClose={() => setAssignModalOpen(false)}>
        <Box sx={modalStyle}>
          {selectedEstimation && (
            <Typography variant="h6" fontWeight="bold" mb={3}>
              {`Tugaskan Proyek: ${
                selectedEstimation.project?.project_name ||
                selectedEstimation.project_id ||
                "Proyek Baru"
              }`}
            </Typography>
          )}

          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel>Pilih Project Engineer</InputLabel>
            <Select
              value={selectedAssignee}
              onChange={(e) => setSelectedAssignee(e.target.value)}
              label="Pilih Project Engineer"
            >
              {projectEngineers.map((pe) => (
                <MenuItem key={pe.id} value={pe.id}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Avatar sx={{ width: 24, height: 24, fontSize: "0.75rem" }}>
                      {pe.employee?.full_name?.charAt(0) || "?"}
                    </Avatar>
                    <Typography>{pe.employee?.full_name || pe.email}</Typography>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box display="flex" gap={2} justifyContent="flex-end">
            <Button
              variant="outlined"
              onClick={() => setAssignModalOpen(false)}
              disabled={assignLoading}
            >
              Batal
            </Button>
            <Button
              variant="contained"
              onClick={handleAssignConfirm}
              disabled={assignLoading || projectEngineers.length === 0 || !selectedAssignee}
            >
              {assignLoading ? <CircularProgress size={24} /> : "Konfirmasi Penugasan"}
            </Button>
          </Box>
        </Box>
      </Modal>

      {/* Detail Modal */}
      <EstimationDetailModal
        open={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        estimation={selectedEstimation}
      />
    </Box>
  );
};

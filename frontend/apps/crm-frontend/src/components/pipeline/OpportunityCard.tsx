import React from "react";
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Avatar,
  Tooltip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from "@mui/material";
import {
  Person as PersonIcon,
  Business as BusinessIcon,
  AttachMoney as MoneyIcon,
  Star as StarIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import { pipelineApi } from "../../api/pipeline";
import { ProjectStatus } from "../../types/pipeline";
import { Draggable } from "@hello-pangea/dnd";
import { Project } from "../../types/pipeline";
import { useAuth } from "../../contexts/AuthContext";

interface OpportunityCardProps {
  project: Project;
  index: number;
  onCardClick: (project: Project) => void;
  onDeleteCard?: () => void;
}

const OpportunityCard: React.FC<OpportunityCardProps> = ({
  project,
  index,
  onCardClick,
  onDeleteCard,
}) => {
  const { user } = useAuth();
  // menuAnchor removed: three-dot menu eliminated per design
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  // Format currency to Indonesian Rupiah
  const formatCurrency = (amount: number | undefined | null): string => {
    if (!amount) return "Belum ditentukan";
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Get sales person initials
  const getSalesInitials = (name: string | undefined): string => {
    if (!name) return "??";
    return name
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Resolve sales display name with sensible fallback
  const salesDisplayName =
    project.sales_user?.name ||
    (project.sales_user_id && project.sales_user_id === user?.id
      ? user?.email || "Anda"
      : undefined) ||
    "Belum ditentukan";

  // Get color for lead score
  const getScoreColor = (score: number | undefined | null): string => {
    if (!score) return "#grey";
    if (score >= 80) return "#4CAF50"; // Green
    if (score >= 60) return "#FF9800"; // Orange
    if (score >= 40) return "#2196F3"; // Blue
    return "#F44336"; // Red
  };

  return (
    <Draggable draggableId={project.id} index={index}>
      {(provided, snapshot) => (
        <Card
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          sx={{
            mb: 2,
            cursor: "pointer",
            transition: "all 0.2s ease-in-out",
            transform: snapshot.isDragging ? "rotate(5deg)" : "none",
            boxShadow: snapshot.isDragging
              ? "0 8px 16px rgba(0,0,0,0.3)"
              : "0 2px 4px rgba(0,0,0,0.1)",
            "&:hover": {
              boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
              transform: "translateY(-2px)",
            },
            border: "1px solid #e0e0e0",
            borderRadius: 2,
          }}
          onClick={() => onCardClick(project)}
        >
          <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
            {/* Header dengan nama proyek dan menu */}
            <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
              <Typography
                variant="subtitle2"
                fontWeight="bold"
                sx={{
                  flexGrow: 1,
                  lineHeight: 1.3,
                  fontSize: "0.875rem",
                }}
              >
                {project.project_name}
              </Typography>
              <Box display="flex" alignItems="center">
                {/* Delete button visible on card header (stops propagation so it doesn't open the detail modal) */}
                <IconButton
                  size="small"
                  sx={{ p: 0.5, ml: 1 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setConfirmOpen(true);
                  }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>

              </Box>
            </Box>

            {/* Customer name */}
            <Box display="flex" alignItems="center" mb={1.5}>
              <BusinessIcon fontSize="small" sx={{ color: "#666", mr: 0.5, fontSize: "16px" }} />
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.75rem" }}>
                {project.customer?.name || "—"}
              </Typography>
            </Box>

            {/* Value dan Lead Score */}
            <Box mb={1.5}>
              {/* Estimated Value (Contract value intentionally hidden until engineering approval) */}
              <Box display="flex" alignItems="center" mb={0.5}>
                <MoneyIcon fontSize="small" sx={{ color: "#4CAF50", mr: 0.5, fontSize: "16px" }} />
                <Typography variant="body2" sx={{ fontSize: "0.75rem", fontWeight: "medium" }}>
                  {formatCurrency(project.estimated_value)}
                </Typography>
              </Box>

              {/* Skor Lead */}
              {project.lead_score !== undefined && project.lead_score !== null && (
                <Box display="flex" alignItems="center">
                  <StarIcon
                    fontSize="small"
                    sx={{
                      color: getScoreColor(project.lead_score),
                      mr: 0.5,
                      fontSize: "16px",
                    }}
                  />
                  <Typography
                    variant="body2"
                    sx={{
                      fontSize: "0.75rem",
                      color: getScoreColor(project.lead_score),
                      fontWeight: "medium",
                    }}
                  >
                    Skor Lead: {project.lead_score}
                  </Typography>
                </Box>
              )}
            </Box>

            {/* Footer dengan Sales Person */}
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Box display="flex" alignItems="center">
                <PersonIcon fontSize="small" sx={{ color: "#666", mr: 0.5, fontSize: "14px" }} />
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.7rem" }}>
                  {salesDisplayName}
                </Typography>
              </Box>

              {/* Avatar Sales Person */}
              <Tooltip title={salesDisplayName || "Sales Person"}>
                <Avatar
                  sx={{
                    width: 24,
                    height: 24,
                    fontSize: "0.7rem",
                    bgcolor: "#2196F3",
                  }}
                >
                  {getSalesInitials(
                    project.sales_user?.name ||
                      (project.sales_user_id === user?.id ? user?.email : undefined),
                  )}
                </Avatar>
              </Tooltip>
            </Box>

            {/* Tags/Chips (jika diperlukan) */}
            {project.expected_close_date && (
              <Box mt={1}>
                <Chip
                  label={`Target: ${new Date(project.expected_close_date).toLocaleDateString("id-ID")}`}
                  size="small"
                  variant="outlined"
                  sx={{ fontSize: "0.6rem", height: 20 }}
                />
              </Box>
            )}
            {/* Delete confirmation dialog */}
            <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
              <DialogTitle>Hapus Opportunity</DialogTitle>
              <DialogContent>
                <DialogContentText>
                  Anda yakin ingin menghapus opportunity "{project.project_name}"? Tindakan ini
                  tidak dapat dikembalikan.
                </DialogContentText>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setConfirmOpen(false)}>Batal</Button>
                <Button
                  color="error"
                  variant="contained"
                  onClick={async () => {
                    setDeleting(true);
                    try {
                      // Call deleteProject which attempts DELETE on backend.
                      // pipelineApi.deleteProject already implements a safe
                      // fallback (marking as LOST) if the backend doesn't
                      // support DELETE, so we use it to ensure DB record
                      // removal when supported.
                      await pipelineApi.deleteProject(project.id);
                      setConfirmOpen(false);
                      onDeleteCard?.();
                    } catch (err) {
                      alert((err as Error)?.message || "Gagal menghapus opportunity");
                    } finally {
                      setDeleting(false);
                    }
                  }}
                >
                  {deleting ? "Menghapus..." : "Hapus"}
                </Button>
              </DialogActions>
            </Dialog>
          </CardContent>
        </Card>
      )}
    </Draggable>
  );
};

export default OpportunityCard;

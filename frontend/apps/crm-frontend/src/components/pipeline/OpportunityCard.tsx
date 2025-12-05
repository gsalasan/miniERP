import React, { useState } from "react";
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
import { Draggable } from "@hello-pangea/dnd";
import { Opportunity, deleteOpportunity } from "../../api/opportunity";

interface OpportunityCardProps {
  opportunity: Opportunity;
  index: number;
  onCardClick: (opportunity: Opportunity) => void;
  onDeleteCard?: () => void;
}

const OpportunityCard: React.FC<OpportunityCardProps> = ({
  opportunity,
  index,
  onCardClick,
  onDeleteCard,
}) => {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

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

  // Resolve sales display name
  const salesDisplayName =
    opportunity.sales_pic_user?.employee?.full_name || 
    opportunity.sales_pic_user?.email ||
    "Belum ditentukan";

  // Get color for lead score
  const getScoreColor = (score: number | undefined | null): string => {
    if (!score) return "#grey";
    if (score >= 80) return "#4CAF50"; // Green
    if (score >= 60) return "#FF9800"; // Orange
    if (score >= 40) return "#2196F3"; // Blue
    return "#F44336"; // Red
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteOpportunity(opportunity.id);
      setConfirmOpen(false);
      onDeleteCard?.();
    } catch (err) {
      alert((err as Error)?.message || "Gagal menghapus opportunity");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <Draggable draggableId={opportunity.id} index={index}>
        {(provided, snapshot) => {
          const handleCardClick = (e: React.MouseEvent) => {
            // Prevent click during drag
            if (snapshot.isDragging) return;
            onCardClick(opportunity);
          };

          return (
            <Card
              ref={provided.innerRef}
              {...provided.draggableProps}
              {...provided.dragHandleProps}
              sx={{
                mb: 2,
                cursor: snapshot.isDragging ? "grabbing" : "pointer",
                transition: "all 0.2s ease-in-out",
                transform: snapshot.isDragging ? "rotate(5deg)" : "none",
                boxShadow: snapshot.isDragging
                  ? "0 8px 16px rgba(0,0,0,0.3)"
                  : "0 2px 4px rgba(0,0,0,0.1)",
                "&:hover": {
                  boxShadow: snapshot.isDragging ? undefined : "0 4px 8px rgba(0,0,0,0.2)",
                  transform: snapshot.isDragging ? undefined : "translateY(-2px)",
                },
                border: "1px solid #e0e0e0",
                borderRadius: 2,
              }}
              onClick={handleCardClick}
            >
            <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
              {/* Header dengan nama opportunity dan delete button */}
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
                  {opportunity.title}
                </Typography>
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

              {/* Customer name */}
              <Box display="flex" alignItems="center" mb={1.5}>
                <BusinessIcon fontSize="small" sx={{ color: "#666", mr: 0.5, fontSize: "16px" }} />
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.75rem" }}>
                  {opportunity.customer?.customer_name || "—"}
                </Typography>
              </Box>

              {/* Value dan Lead Score */}
              <Box mb={1.5}>
                {/* Estimated Value */}
                <Box display="flex" alignItems="center" mb={0.5}>
                  <MoneyIcon fontSize="small" sx={{ color: "#4CAF50", mr: 0.5, fontSize: "16px" }} />
                  <Typography variant="body2" sx={{ fontSize: "0.75rem", fontWeight: "medium" }}>
                    {formatCurrency(opportunity.estimated_value)}
                  </Typography>
                </Box>

                {/* Lead Score */}
                {opportunity.lead_score !== undefined && opportunity.lead_score !== null && (
                  <Box display="flex" alignItems="center">
                    <StarIcon
                      fontSize="small"
                      sx={{
                        color: getScoreColor(opportunity.lead_score),
                        mr: 0.5,
                        fontSize: "16px",
                      }}
                    />
                    <Typography
                      variant="body2"
                      sx={{
                        fontSize: "0.75rem",
                        color: getScoreColor(opportunity.probability || opportunity.lead_score || 0),
                        fontWeight: "medium",
                      }}
                    >
                      Probabilitas: {opportunity.probability || opportunity.lead_score || 0}%
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
                    {getSalesInitials(opportunity.sales_pic_user?.employee?.full_name)}
                  </Avatar>
                </Tooltip>
              </Box>

              {/* Tags/Chips untuk expected close date */}
              {opportunity.expected_close_date && (
                <Box mt={1}>
                  <Chip
                    label={`Target: ${new Date(opportunity.expected_close_date).toLocaleDateString("id-ID")}`}
                    size="small"
                    variant="outlined"
                    sx={{ fontSize: "0.6rem", height: 20 }}
                  />
                </Box>
              )}
            </CardContent>
          </Card>
          );
        }}
      </Draggable>

      {/* Delete confirmation dialog */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>Hapus Opportunity</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Anda yakin ingin menghapus opportunity "{opportunity.title}"? Tindakan ini tidak dapat
            dikembalikan.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Batal</Button>
          <Button color="error" variant="contained" onClick={handleDelete} disabled={deleting}>
            {deleting ? "Menghapus..." : "Hapus"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default OpportunityCard;

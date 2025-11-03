import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Typography,
  Chip,
  Box,
  Divider,
  IconButton,
} from "@mui/material";
import { Close as CloseIcon, Info as InfoIcon } from "@mui/icons-material";
import { Service } from "../types/service";

interface ServiceDetailModalProps {
  open: boolean;
  onClose: () => void;
  service: Service | null;
}

const ServiceDetailModal: React.FC<ServiceDetailModalProps> = ({ open, onClose, service }) => {
  if (!service) return null;

  // Get active status color
  const getActiveStatusColor = (isActive?: boolean) => {
    return isActive ? "success" : "error";
  };

  // Get unit color
  const getUnitColor = (unit?: string) => {
    switch (unit) {
      case "Jam":
        return "primary";
      case "Hari":
        return "info";
      default:
        return "default";
    }
  };

  // Format currency
  const formatCurrency = (amount?: number) => {
    if (!amount) return "-";
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const DetailRow: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
    <Grid container spacing={2} sx={{ mb: 2 }}>
      <Grid item xs={4}>
        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
          {label}
        </Typography>
      </Grid>
      <Grid item xs={8}>
        <Typography variant="body2">{value}</Typography>
      </Grid>
    </Grid>
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ pb: 1, px: 2, pt: 2, background: "transparent" }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box display="flex" alignItems="center" sx={{ gap: 1 }}>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: 2,
                bgcolor: (theme) => `${theme.palette.primary.main}22`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <InfoIcon sx={{ fontSize: 24, color: (theme) => theme.palette.primary.main }} />
            </Box>

            <Box>
              <Typography variant="h6" component="div" sx={{ fontWeight: 700 }}>
                Service Details
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.85 }}>
                {service?.service_name}
              </Typography>
            </Box>
          </Box>

          <IconButton onClick={onClose} sx={{ color: (theme) => theme.palette.text.primary }}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        <Grid container spacing={3}>
          {/* Basic Information */}
          <Grid item xs={12}>
            <Typography variant="h6" sx={{ mb: 2, color: "primary.main" }}>
              Basic Information
            </Typography>
            <DetailRow label="Service ID" value={service.id} />
            <DetailRow label="Service Name" value={service.service_name} />
            <DetailRow label="Service Code" value={service.service_code} />
            <DetailRow label="Item Type" value={service.item_type || "-"} />
            <DetailRow label="Category" value={service.category || "-"} />
            <DetailRow
              label="Unit"
              value={<Chip label={service.unit} color={getUnitColor(service.unit)} size="small" />}
            />
            <DetailRow
              label="Status"
              value={
                <Chip
                  label={service.is_active ? "Active" : "Inactive"}
                  color={getActiveStatusColor(service.is_active)}
                  size="small"
                />
              }
            />
          </Grid>

          <Grid item xs={12}>
            <Divider />
          </Grid>

          {/* Cost Information */}
          <Grid item xs={12}>
            <Typography variant="h6" sx={{ mb: 2, color: "primary.main" }}>
              Cost Information
            </Typography>
            <DetailRow
              label="Internal Cost per Hour"
              value={formatCurrency(service.internal_cost_per_hour)}
            />
            <DetailRow
              label="Freelance Cost per Hour"
              value={formatCurrency(service.freelance_cost_per_hour)}
            />
            <DetailRow
              label="Default Duration"
              value={service.default_duration ? `${service.default_duration} ${service.unit}` : "-"}
            />
          </Grid>

          <Grid item xs={12}>
            <Divider />
          </Grid>

          {/* Timestamps */}
          <Grid item xs={12}>
            <Typography variant="h6" sx={{ mb: 2, color: "primary.main" }}>
              Timestamps
            </Typography>
            <DetailRow label="Created At" value={formatDate(service.created_at)} />
            <DetailRow label="Updated At" value={formatDate(service.updated_at)} />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} variant="contained">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ServiceDetailModal;

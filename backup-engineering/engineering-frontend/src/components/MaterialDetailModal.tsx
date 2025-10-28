import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Typography,
  Box,
  Chip,
  Divider,
  IconButton,
  Card,
  CardContent,
} from "@mui/material";
import {
  Close as CloseIcon,
  Info as InfoIcon,
  CalendarToday as CalendarIcon,
  LocalOffer as PriceIcon,
  Business as BusinessIcon,
  Category as CategoryIcon,
} from "@mui/icons-material";
import { Material, MaterialStatus, MaterialLocation } from "../types/material";

interface MaterialDetailModalProps {
  open: boolean;
  onClose: () => void;
  material: Material | null;
}

const MaterialDetailModal: React.FC<MaterialDetailModalProps> = ({ open, onClose, material }) => {
  if (!material) return null;

  const formatCurrency = (amount: number | null | undefined, currency?: string) => {
    if (!amount) return "-";
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: currency || "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getStatusColor = (status?: MaterialStatus) => {
    switch (status) {
      case MaterialStatus.Active:
        return "success";
      case MaterialStatus.EndOfLife:
        return "warning";
      case MaterialStatus.Discontinue:
        return "error";
      default:
        return "default";
    }
  };

  const getLocationColor = (location?: MaterialLocation) => {
    switch (location) {
      case MaterialLocation.Local:
        return "primary";
      case MaterialLocation.Import:
        return "secondary";
      default:
        return "default";
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          minHeight: "70vh",
          borderRadius: 3,
          boxShadow: "0 12px 40px rgba(0, 0, 0, 0.15)",
        },
      }}
    >
      <DialogTitle
        sx={{
          pb: 2,
          background: "linear-gradient(135deg, #1976d2 0%, #1565c0 100%)",
          color: "white",
          position: "relative",
          overflow: "hidden",
          "&::before": {
            content: '""',
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background:
              'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.05"%3E%3Ccircle cx="60" cy="60" r="60"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
          },
        }}
      >
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          sx={{ position: "relative", zIndex: 1 }}
        >
          <Box display="flex" alignItems="center">
            <InfoIcon sx={{ mr: 2, fontSize: 32 }} />
            <Box>
              <Typography variant="h5" component="div" sx={{ fontWeight: 600, mb: 0.5 }}>
                Material Details
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                {material?.item_name}
              </Typography>
            </Box>
          </Box>
          <IconButton
            onClick={onClose}
            sx={{
              color: "white",
              backgroundColor: "rgba(255, 255, 255, 0.1)",
              "&:hover": {
                backgroundColor: "rgba(255, 255, 255, 0.2)",
                transform: "scale(1.05)",
              },
              transition: "all 0.2s",
            }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        <Grid container spacing={3}>
          {/* Basic Information Card */}
          <Grid item xs={12}>
            <Card elevation={2}>
              <CardContent>
                <Typography
                  variant="h6"
                  gutterBottom
                  color="primary"
                  sx={{ display: "flex", alignItems: "center" }}
                >
                  <CategoryIcon sx={{ mr: 1 }} />
                  Basic Information
                </Typography>
                <Divider sx={{ mb: 2 }} />

                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Typography variant="h5" fontWeight="bold" color="text.primary" gutterBottom>
                      {material.item_name}
                    </Typography>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">
                      Brand
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {material.brand || "-"}
                    </Typography>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">
                      Owner Part Number
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {material.owner_pn || "-"}
                    </Typography>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">
                      Vendor
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {material.vendor || "-"}
                    </Typography>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">
                      Unit (Satuan)
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {material.satuan || "-"}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* System Information Card */}
          <Grid item xs={12}>
            <Card elevation={2}>
              <CardContent>
                <Typography
                  variant="h6"
                  gutterBottom
                  color="primary"
                  sx={{ display: "flex", alignItems: "center" }}
                >
                  <BusinessIcon sx={{ mr: 1 }} />
                  System Information
                </Typography>
                <Divider sx={{ mb: 2 }} />

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="caption" color="text.secondary">
                      SBU
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {material.sbu || "-"}
                    </Typography>
                  </Grid>

                  <Grid item xs={12} sm={4}>
                    <Typography variant="caption" color="text.secondary">
                      System
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {material.system || "-"}
                    </Typography>
                  </Grid>

                  <Grid item xs={12} sm={4}>
                    <Typography variant="caption" color="text.secondary">
                      Subsystem
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {material.subsystem || "-"}
                    </Typography>
                  </Grid>

                  <Grid item xs={12}>
                    <Typography variant="caption" color="text.secondary">
                      Components
                    </Typography>
                    <Typography variant="body1">{material.components || "-"}</Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Status & Location Card */}
          <Grid item xs={12} sm={6}>
            <Card elevation={2}>
              <CardContent>
                <Typography variant="h6" gutterBottom color="primary">
                  Status & Location
                </Typography>
                <Divider sx={{ mb: 2 }} />

                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Status
                    </Typography>
                    <Box sx={{ mt: 0.5 }}>
                      <Chip
                        label={material.status || "Unknown"}
                        color={getStatusColor(material.status)}
                        size="small"
                      />
                    </Box>
                  </Box>

                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Location
                    </Typography>
                    <Box sx={{ mt: 0.5 }}>
                      <Chip
                        label={material.location || "Unknown"}
                        color={getLocationColor(material.location)}
                        variant="outlined"
                        size="small"
                      />
                    </Box>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Cost Information Card */}
          <Grid item xs={12} sm={6}>
            <Card elevation={2}>
              <CardContent>
                <Typography
                  variant="h6"
                  gutterBottom
                  color="primary"
                  sx={{ display: "flex", alignItems: "center" }}
                >
                  <PriceIcon sx={{ mr: 1 }} />
                  Cost Information
                </Typography>
                <Divider sx={{ mb: 2 }} />

                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Cost (RP)
                    </Typography>
                    <Typography variant="h6" color="primary.main" fontWeight="bold">
                      {formatCurrency(material.cost_rp, "IDR")}
                    </Typography>
                  </Box>

                  {material.cost_ori && material.curr && (
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Original Cost
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {formatCurrency(material.cost_ori, material.curr)}
                      </Typography>
                    </Box>
                  )}

                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Cost Validity
                    </Typography>
                    <Typography variant="body2" sx={{ display: "flex", alignItems: "center" }}>
                      <CalendarIcon sx={{ mr: 0.5, fontSize: "small" }} />
                      {formatDate(material.cost_validity)}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Metadata Card */}
          <Grid item xs={12}>
            <Card elevation={1} sx={{ bgcolor: "grey.50" }}>
              <CardContent>
                <Typography variant="subtitle2" gutterBottom color="text.secondary">
                  Metadata
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">
                      Created At
                    </Typography>
                    <Typography variant="body2">{formatDate(material.created_at)}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">
                      Last Updated
                    </Typography>
                    <Typography variant="body2">{formatDate(material.updated_at)}</Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="caption" color="text.secondary">
                      Material ID
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ fontFamily: "monospace", fontSize: "0.75rem" }}
                    >
                      {material.id}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose} variant="contained">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MaterialDetailModal;

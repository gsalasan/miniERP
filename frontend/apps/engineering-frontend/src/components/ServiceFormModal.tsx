import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Box,
  Typography,
} from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";
import { servicesService } from "../api/servicesApi";
import { Service, ServiceUnit, ServiceFilterOptions } from "../types/service";
import { useNotification } from "../contexts/NotificationContext";

interface ServiceFormModalProps {
  open: boolean;
  onClose: (refreshData?: boolean) => void;
  service: Service | null;
  mode: "create" | "edit";
}

const ServiceFormModal: React.FC<ServiceFormModalProps> = ({ open, onClose, service, mode }) => {
  const [formData, setFormData] = useState({
    service_name: "",
    service_code: "",
    item_type: "Service",
    category: "",
    unit: "Jam",
    description: "",
    internal_cost_per_hour: "",
    freelance_cost_per_hour: "",
    default_duration: "",
    is_active: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterOptions, setFilterOptions] = useState<ServiceFilterOptions | null>(null);
  const { showSuccess, showError } = useNotification();

  // Reset form when modal opens/closes or service changes
  useEffect(() => {
    if (open) {
      if (mode === "edit" && service) {
        setFormData({
          service_name: service.service_name || "",
          service_code: service.service_code || "",
          item_type: service.item_type || "Service",
          category: service.category || "",
          unit: service.unit || "Jam",
          description: service.description || "",
          internal_cost_per_hour: service.internal_cost_per_hour?.toString() || "",
          freelance_cost_per_hour: service.freelance_cost_per_hour?.toString() || "",
          default_duration: service.default_duration?.toString() || "",
          is_active: service.is_active ?? true,
        });
      } else {
        // Reset form for create mode
        setFormData({
          service_name: "",
          service_code: "",
          item_type: "Service",
          category: "",
          unit: "Jam",
          description: "",
          internal_cost_per_hour: "",
          freelance_cost_per_hour: "",
          default_duration: "",
          is_active: true,
        });
      }
      setError(null);
      fetchFilterOptions();
    }
  }, [open, mode, service]);

  const fetchFilterOptions = async () => {
    try {
      const options = await servicesService.getFilterOptions();
      setFilterOptions(options);
    } catch (error) {
      showError("Gagal memuat opsi filter");
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError(null);
  };

  const validateForm = () => {
    if (!formData.service_name.trim()) {
      setError("Service name is required");
      return false;
    }
    if (!formData.service_code.trim()) {
      setError("Service code is required");
      return false;
    }
    if (!formData.unit) {
      setError("Unit is required");
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setError(null);

    try {
      const serviceData = {
        service_name: formData.service_name.trim(),
        service_code: formData.service_code.trim(),
        item_type: formData.item_type,
        category: formData.category || undefined,
        unit: formData.unit as ServiceUnit,
        description: formData.description || undefined,
        internal_cost_per_hour: formData.internal_cost_per_hour ? parseFloat(formData.internal_cost_per_hour) : undefined,
        freelance_cost_per_hour: formData.freelance_cost_per_hour ? parseFloat(formData.freelance_cost_per_hour) : undefined,
        default_duration: formData.default_duration ? parseFloat(formData.default_duration) : undefined,
        is_active: formData.is_active,
      };

      if (mode === "edit" && service) {
        await servicesService.updateService(service.id, serviceData);
        showSuccess(`Service "${formData.service_name}" berhasil diperbarui`);
      } else {
        await servicesService.createService(serviceData);
        showSuccess(`Service "${formData.service_name}" berhasil ditambahkan`);
      }

      onClose(true); // Close modal and refresh data
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Terjadi kesalahan saat menyimpan service";
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="h6">
            {mode === "edit" ? "Edit Service" : "Add New Service"}
          </Typography>
          <Button
            onClick={handleClose}
            sx={{ minWidth: "auto", p: 1 }}
            color="inherit"
          >
            <CloseIcon />
          </Button>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Service Name *"
              value={formData.service_name}
              onChange={(e) => handleInputChange("service_name", e.target.value)}
              disabled={loading}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Service Code *"
              value={formData.service_code}
              onChange={(e) => handleInputChange("service_code", e.target.value)}
              disabled={loading}
              placeholder="e.g., GEN-MAINT-001"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Category"
              value={formData.category}
              onChange={(e) => handleInputChange("category", e.target.value)}
              disabled={loading}
              placeholder="e.g., Maintenance, Installation"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Unit *</InputLabel>
              <Select
                value={formData.unit}
                onChange={(e) => handleInputChange("unit", e.target.value)}
                label="Unit *"
                disabled={loading}
              >
                {filterOptions?.units.map((unit) => (
                  <MenuItem key={unit} value={unit}>
                    {unit}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Internal Cost/Hour"
              type="number"
              value={formData.internal_cost_per_hour}
              onChange={(e) => handleInputChange("internal_cost_per_hour", e.target.value)}
              disabled={loading}
              placeholder="IDR per hour"
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Freelance Cost/Hour"
              type="number"
              value={formData.freelance_cost_per_hour}
              onChange={(e) => handleInputChange("freelance_cost_per_hour", e.target.value)}
              disabled={loading}
              placeholder="IDR per hour"
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Default Duration"
              type="number"
              value={formData.default_duration}
              onChange={(e) => handleInputChange("default_duration", e.target.value)}
              disabled={loading}
              placeholder="Hours or Days"
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Description"
              multiline
              rows={3}
              value={formData.description || ""}
              onChange={(e) => handleInputChange("description", e.target.value)}
              disabled={loading}
              placeholder="Additional details about this service..."
            />
          </Grid>

          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={formData.is_active ? "true" : "false"}
                onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.value === "true" }))}
                label="Status"
                disabled={loading}
              >
                <MenuItem value="true">Active</MenuItem>
                <MenuItem value="false">Inactive</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? "Saving..." : mode === "edit" ? "Update" : "Create"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ServiceFormModal;
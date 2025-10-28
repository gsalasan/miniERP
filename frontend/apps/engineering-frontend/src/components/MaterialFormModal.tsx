import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Box,
  Typography,
  CircularProgress,
  Alert,
  IconButton,
} from "@mui/material";
import { Close as CloseIcon, Save as SaveIcon, Add as AddIcon } from "@mui/icons-material";
import { Material, MaterialStatus, MaterialLocation, FilterOptions } from "../types/material";
import { materialsService } from "../api/materialsApi";
import { useNotification } from "../contexts/NotificationContext";

interface MaterialFormModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  material?: Material | null; // null for add, Material object for edit
  filterOptions?: FilterOptions | null;
}

interface FormData {
  sbu: string;
  system: string;
  subsystem: string;
  components: string;
  item_name: string;
  brand: string;
  owner_pn: string;
  vendor: string;
  status: MaterialStatus | "";
  location: MaterialLocation | "";
  cost_ori: string;
  curr: string;
  satuan: string;
  cost_rp: string;
  cost_validity: string;
}

const initialFormData: FormData = {
  sbu: "",
  system: "",
  subsystem: "",
  components: "",
  item_name: "",
  brand: "",
  owner_pn: "",
  vendor: "",
  status: "",
  location: "",
  cost_ori: "",
  curr: "",
  satuan: "",
  cost_rp: "",
  cost_validity: "",
};

const MaterialFormModal: React.FC<MaterialFormModalProps> = ({
  open,
  onClose,
  onSuccess,
  material,
  filterOptions: _filterOptions,
}) => {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Partial<FormData>>({});

  const { showSuccess, showError } = useNotification();

  const isEditMode = !!material;

  // Reset form when modal opens/closes or material changes
  useEffect(() => {
    if (open) {
      if (isEditMode && material) {
        setFormData({
          sbu: material.sbu || "",
          system: material.system || "",
          subsystem: material.subsystem || "",
          components: material.components || "",
          item_name: material.item_name || "",
          brand: material.brand || "",
          owner_pn: material.owner_pn || "",
          vendor: material.vendor || "",
          status: material.status || "",
          location: material.location || "",
          cost_ori: material.cost_ori?.toString() || "",
          curr: material.curr || "",
          satuan: material.satuan || "",
          cost_rp: material.cost_rp?.toString() || "",
          cost_validity: material.cost_validity
            ? new Date(material.cost_validity).toISOString().split("T")[0]
            : "",
        });
      } else {
        setFormData(initialFormData);
      }
      setError(null);
      setFormErrors({});
    }
  }, [open, material, isEditMode]);

  const handleInputChange =
    (field: keyof FormData) =>
    (
      event:
        | React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
        | { target: { value: unknown } },
    ) => {
      const value = event.target.value as string;

      // Special handling for location changes
      if (field === "location") {
        if (value === MaterialLocation.Local) {
          setFormData((prev) => ({
            ...prev,
            [field]: value,
            curr: "IDR", // Auto-set currency to IDR for local items
            cost_ori: "", // Clear original cost for local items
          }));
        } else {
          setFormData((prev) => ({
            ...prev,
            [field]: value,
          }));
        }
      } else {
        setFormData((prev) => ({
          ...prev,
          [field]: value,
        }));
      }

      // Clear field error when user starts typing
      if (formErrors[field]) {
        setFormErrors((prev) => ({
          ...prev,
          [field]: undefined,
        }));
      }
    };

  const validateForm = (): boolean => {
    const errors: Partial<FormData> = {};

    // Validate required fields
    if (!formData.item_name.trim()) {
      errors.item_name = "Item name is required";
    }

    // Validate location-specific fields
    if (formData.location === MaterialLocation.Import) {
      // For import items, validate original cost and currency
      if (!formData.cost_ori || isNaN(parseFloat(formData.cost_ori))) {
        errors.cost_ori = "Original cost is required for import items";
      }
      if (!formData.curr) {
        errors.curr = "Currency is required for import items";
      }
    }

    // Validate numeric fields
    if (formData.cost_ori && isNaN(parseFloat(formData.cost_ori))) {
      errors.cost_ori = "Cost original must be a valid number";
    }
    if (formData.cost_rp && isNaN(parseFloat(formData.cost_rp))) {
      errors.cost_rp = "Cost RP must be a valid number";
    }

    // Validate date field
    if (formData.cost_validity && !isValidDate(formData.cost_validity)) {
      errors.cost_validity = "Cost validity must be a valid date";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const isValidDate = (dateString: string): boolean => {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const submitData = {
        sbu: formData.sbu || undefined,
        system: formData.system || undefined,
        subsystem: formData.subsystem || undefined,
        components: formData.components || undefined,
        item_name: formData.item_name,
        brand: formData.brand || undefined,
        owner_pn: formData.owner_pn || undefined,
        vendor: formData.vendor || undefined,
        status: formData.status || undefined,
        location: formData.location || undefined,
        cost_ori: formData.cost_ori ? parseFloat(formData.cost_ori) : undefined,
        curr: formData.curr || undefined,
        satuan: formData.satuan || undefined,
        cost_rp: formData.cost_rp ? parseFloat(formData.cost_rp) : undefined,
        cost_validity: formData.cost_validity || undefined,
      };

      if (isEditMode && material) {
        await materialsService.updateMaterial(material.id, submitData);
        showSuccess(`Material "${submitData.item_name}" berhasil diperbarui!`);
      } else {
        await materialsService.createMaterial(submitData);
        showSuccess(`Material "${submitData.item_name}" berhasil ditambahkan!`);
      }

      onSuccess();
      onClose();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Terjadi kesalahan saat menyimpan material";
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { minHeight: "70vh" },
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6" component="div" sx={{ display: "flex", alignItems: "center" }}>
            {isEditMode ? (
              <>
                <SaveIcon sx={{ mr: 1 }} />
                Edit Material
              </>
            ) : (
              <>
                <AddIcon sx={{ mr: 1 }} />
                Add New Material
              </>
            )}
          </Typography>
          <IconButton onClick={handleClose} disabled={loading}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Basic Information */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom color="primary">
              Basic Information
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Item Name"
              value={formData.item_name}
              onChange={handleInputChange("item_name")}
              error={!!formErrors.item_name}
              helperText={formErrors.item_name}
              required
              disabled={loading}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Brand"
              value={formData.brand}
              onChange={handleInputChange("brand")}
              error={!!formErrors.brand}
              helperText={formErrors.brand}
              disabled={loading}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Owner Part Number"
              value={formData.owner_pn}
              onChange={handleInputChange("owner_pn")}
              error={!!formErrors.owner_pn}
              helperText={formErrors.owner_pn}
              disabled={loading}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Vendor"
              value={formData.vendor}
              onChange={handleInputChange("vendor")}
              error={!!formErrors.vendor}
              helperText={formErrors.vendor}
              disabled={loading}
            />
          </Grid>

          {/* System Information */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom color="primary" sx={{ mt: 2 }}>
              System Information
            </Typography>
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="SBU"
              value={formData.sbu}
              onChange={handleInputChange("sbu")}
              error={!!formErrors.sbu}
              helperText={formErrors.sbu}
              disabled={loading}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="System"
              value={formData.system}
              onChange={handleInputChange("system")}
              error={!!formErrors.system}
              helperText={formErrors.system}
              disabled={loading}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Subsystem"
              value={formData.subsystem}
              onChange={handleInputChange("subsystem")}
              error={!!formErrors.subsystem}
              helperText={formErrors.subsystem}
              disabled={loading}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Components"
              value={formData.components}
              onChange={handleInputChange("components")}
              error={!!formErrors.components}
              helperText={formErrors.components}
              disabled={loading}
              multiline
              rows={2}
            />
          </Grid>

          {/* Status and Location */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom color="primary" sx={{ mt: 2 }}>
              Status & Location
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth error={!!formErrors.status} disabled={loading}>
              <InputLabel>Status</InputLabel>
              <Select value={formData.status} label="Status" onChange={handleInputChange("status")}>
                <MenuItem value="">
                  <em>Select Status</em>
                </MenuItem>
                {Object.values(MaterialStatus).map((status) => (
                  <MenuItem key={status} value={status}>
                    {status}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth error={!!formErrors.location} disabled={loading}>
              <InputLabel>Location</InputLabel>
              <Select
                value={formData.location}
                label="Location"
                onChange={handleInputChange("location")}
              >
                <MenuItem value="">
                  <em>Select Location</em>
                </MenuItem>
                {Object.values(MaterialLocation).map((location) => (
                  <MenuItem key={location} value={location}>
                    {location}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Cost Information */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom color="primary" sx={{ mt: 2 }}>
              Cost Information
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              label="Unit (Satuan)"
              value={formData.satuan}
              onChange={handleInputChange("satuan")}
              error={!!formErrors.satuan}
              helperText={formErrors.satuan}
              disabled={loading}
              placeholder="e.g., pcs, kg, meter"
            />
          </Grid>

          {/* Show different fields based on location */}
          {formData.location === MaterialLocation.Import && (
            <>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  label="Original Cost"
                  type="number"
                  value={formData.cost_ori}
                  onChange={handleInputChange("cost_ori")}
                  error={!!formErrors.cost_ori}
                  helperText={formErrors.cost_ori || "Cost in original currency"}
                  disabled={loading}
                  inputProps={{ step: "0.01", min: "0" }}
                />
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
                <FormControl fullWidth error={!!formErrors.curr} disabled={loading}>
                  <InputLabel>Currency</InputLabel>
                  <Select
                    value={formData.curr}
                    label="Currency"
                    onChange={handleInputChange("curr")}
                  >
                    <MenuItem value="">
                      <em>Select Currency</em>
                    </MenuItem>
                    <MenuItem value="USD">USD - US Dollar</MenuItem>
                    <MenuItem value="EUR">EUR - Euro</MenuItem>
                    <MenuItem value="JPY">JPY - Japanese Yen</MenuItem>
                    <MenuItem value="SGD">SGD - Singapore Dollar</MenuItem>
                    <MenuItem value="CNY">CNY - Chinese Yuan</MenuItem>
                    <MenuItem value="KRW">KRW - Korean Won</MenuItem>
                    <MenuItem value="GBP">GBP - British Pound</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </>
          )}

          <Grid item xs={12} sm={6} md={formData.location === MaterialLocation.Import ? 6 : 8}>
            <TextField
              fullWidth
              label={formData.location === MaterialLocation.Local ? "Cost (IDR)" : "Cost in IDR"}
              type="number"
              value={formData.cost_rp}
              onChange={handleInputChange("cost_rp")}
              error={!!formErrors.cost_rp}
              helperText={
                formErrors.cost_rp ||
                (formData.location === MaterialLocation.Local
                  ? "Cost in Indonesian Rupiah"
                  : "Converted cost in IDR")
              }
              disabled={loading}
              inputProps={{ step: "1", min: "0" }}
              InputProps={{
                startAdornment: (
                  <Typography variant="body2" sx={{ mr: 1 }}>
                    Rp
                  </Typography>
                ),
              }}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={formData.location === MaterialLocation.Import ? 6 : 4}>
            <TextField
              fullWidth
              label="Cost Validity"
              type="date"
              value={formData.cost_validity}
              onChange={handleInputChange("cost_validity")}
              error={!!formErrors.cost_validity}
              helperText={formErrors.cost_validity || "Valid until date"}
              disabled={loading}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button onClick={handleClose} disabled={loading} variant="outlined">
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={loading}
          variant="contained"
          startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
        >
          {loading ? "Saving..." : isEditMode ? "Update Material" : "Add Material"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MaterialFormModal;

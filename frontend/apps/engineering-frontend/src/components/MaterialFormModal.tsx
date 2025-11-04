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
import Autocomplete from "@mui/material/Autocomplete";
import VendorCreateDialog from "./VendorCreateDialog";
import { Close as CloseIcon, Save as SaveIcon, Add as AddIcon } from "@mui/icons-material";
import { Material, FilterOptions } from "../types/material";
import { MaterialStatus, MaterialLocation, Components } from "../types/enums";
import { materialsService } from "../api/materialsApi";
import { useNotification } from "../contexts/NotificationContext";
import { vendorsService } from "../api/vendorsApi";
import { Vendor } from "../types/vendor";

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
  components: Components | "";
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
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [vendorsLoading, setVendorsLoading] = useState(false);
  const [vendorInput, setVendorInput] = useState("");
  const [openVendorCreate, setOpenVendorCreate] = useState(false);

  const { showSuccess, showError } = useNotification();

  const isEditMode = !!material;

  // Reset form when modal opens/closes or material changes
  useEffect(() => {
    if (open) {
      // load vendors for selection
      (async () => {
        try {
          setVendorsLoading(true);
          const list = await vendorsService.getVendors();
          setVendors(list);
        } catch (e) {
          // Best-effort: keep text input usable if vendors fetch fails
          // eslint-disable-next-line no-console
          console.error("Failed to fetch vendors", e);
        } finally {
          setVendorsLoading(false);
        }
      })();
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
          // eslint-disable-next-line prettier/prettier
          const value = (event as unknown as { target: { value: string } }).target.value;

      // Special handling for location changes
      if (field === "location") {
        const locVal = value as MaterialLocation | "";
        if (locVal === MaterialLocation.Local) {
          setFormData((prev) => ({
            ...prev,
            [field]: locVal,
            curr: "IDR", // Auto-set currency to IDR for local items
            cost_ori: "", // Clear original cost for local items
          }));
        } else {
          setFormData((prev) => ({
            ...prev,
            [field]: locVal,
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
      <DialogTitle sx={{ pb: 1, px: 2, pt: 2, background: "transparent" }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box display="flex" alignItems="center" sx={{ gap: 1 }}>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: 2,
                bgcolor: (theme) => `${theme.palette.primary.main}14`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {isEditMode ? (
                <SaveIcon sx={{ fontSize: 20, color: (theme) => theme.palette.primary.main }} />
              ) : (
                <AddIcon sx={{ fontSize: 20, color: (theme) => theme.palette.primary.main }} />
              )}
            </Box>

            <Box>
              <Typography variant="h6" component="div" sx={{ fontWeight: 700 }}>
                {isEditMode ? "Edit Material" : "Add New Material"}
              </Typography>
              {isEditMode && (
                <Typography variant="body2" sx={{ opacity: 0.85 }}>
                  {material?.item_name}
                </Typography>
              )}
            </Box>
          </Box>

          <IconButton
            onClick={handleClose}
            disabled={loading}
            sx={{ color: (theme) => theme.palette.text.primary }}
          >
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
            <Autocomplete
              options={vendors}
              getOptionLabel={(option) => option.vendor_name}
              loading={vendorsLoading}
              value={
                formData.vendor
                  ? vendors.find((v) => v.vendor_name === formData.vendor) || null
                  : null
              }
              onChange={(_, value) => {
                setFormData((prev) => ({ ...prev, vendor: value?.vendor_name || "" }));
                if (formErrors.vendor) setFormErrors((prev) => ({ ...prev, vendor: undefined }));
              }}
              onInputChange={(_, value) => setVendorInput(value)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Vendor"
                  placeholder="Select vendor"
                  error={!!formErrors.vendor}
                  helperText={formErrors.vendor}
                  disabled={loading}
                />
              )}
            />
            <Box sx={{ mt: 1, display: "flex", justifyContent: "flex-end" }}>
              <Button
                size="small"
                onClick={() => setOpenVendorCreate(true)}
                startIcon={<AddIcon />}
              >
                Tambah vendor baru{vendorInput ? ` "${vendorInput}"` : ""}
              </Button>
            </Box>
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
            <FormControl fullWidth error={!!formErrors.components} disabled={loading}>
              <InputLabel>Components</InputLabel>
              <Select
                value={formData.components}
                label="Components"
                onChange={handleInputChange("components")}
              >
                <MenuItem value="">
                  <em>Select Component Type</em>
                </MenuItem>
                {Object.values(Components).map((component) => (
                  <MenuItem key={component} value={component}>
                    {component.replace(/_/g, " ")}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
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
      <VendorCreateDialog
        open={openVendorCreate}
        initialName={vendorInput || formData.vendor}
        onClose={() => setOpenVendorCreate(false)}
        onCreated={(created) => {
          setVendors((prev) => [created, ...prev]);
          setFormData((prev) => ({ ...prev, vendor: created.vendor_name }));
          setOpenVendorCreate(false);
        }}
      />
    </Dialog>
  );
};

export default MaterialFormModal;

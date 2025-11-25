import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Autocomplete,
  Typography,
  Alert,
  CircularProgress,
  Box,
} from "@mui/material";
import { Star as StarIcon } from "@mui/icons-material";
import { CreateProjectRequest } from "../../types/pipeline";
import { Customer } from "../../types/customer";
import { customersApi } from "../../api/customers";

interface AddOpportunityModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateProjectRequest) => Promise<void>;
  loading?: boolean;
}

const AddOpportunityModal: React.FC<AddOpportunityModalProps> = ({
  open,
  onClose,
  onSubmit,
  loading = false,
}) => {
  const [formData, setFormData] = useState<CreateProjectRequest>({
    project_name: "",
    description: "",
    customer_id: "",
    estimated_value: 0,
    lead_score: 0,
    priority: "MEDIUM",
    expected_close_date: null,
    notes: "",
  });

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [error, setError] = useState<string>("");

  // Load customers when modal opens
  useEffect(() => {
    if (open) {
      loadCustomers();
    }
  }, [open]);

  const loadCustomers = async () => {
    try {
      setLoadingCustomers(true);
      setError("");
      const customerList = await customersApi.getCustomers();
      setCustomers(customerList);
    } catch {
      setError("Gagal memuat data customer");
    } finally {
      setLoadingCustomers(false);
    }
  };

  type FieldValue = string | number | null | undefined | Date;

  const handleInputChange = (field: keyof CreateProjectRequest, value: FieldValue) => {
    setFormData((prev) => ({
      ...prev,
      // Cast via unknown to avoid using `any` while keeping flexibility for different field types
      [field]: value as unknown as CreateProjectRequest[typeof field],
    }));
  };

  const handleCustomerChange = (customer: Customer | null) => {
    setSelectedCustomer(customer);
    handleInputChange("customer_id", customer?.id || "");
  };

  const handleSubmit = async () => {
    try {
      setError("");

      // Validation
      if (!formData.project_name.trim()) {
        setError("Nama project harus diisi");
        return;
      }
      if (!formData.customer_id) {
        setError("Customer harus dipilih");
        return;
      }

      await onSubmit(formData);
      handleClose();
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Gagal membuat opportunity");
    }
  };

  const handleClose = () => {
    // Reset form
    setFormData({
      project_name: "",
      description: "",
      customer_id: "",
      estimated_value: 0,
      lead_score: 0,
      priority: "MEDIUM",
      expected_close_date: null,
      notes: "",
    });
    setSelectedCustomer(null);
    setError("");
    onClose();
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      disableEscapeKeyDown={loading}
    >
      <DialogTitle>
        <Typography variant="h6" fontWeight="bold" color="primary" component="div">
          Tambah Opportunity Baru
        </Typography>
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3} sx={{ mt: 1 }}>
          {/* Project Name */}
          <Grid item xs={12}>
            <TextField
              label="Nama Project / Opportunity *"
              fullWidth
              value={formData.project_name}
              onChange={(e) => handleInputChange("project_name", e.target.value)}
              disabled={loading}
              placeholder="Contoh: Pemasangan CCTV di PT. Maju Jaya"
            />
          </Grid>

          {/* Customer Selection */}
          <Grid item xs={12}>
            <Autocomplete
              options={customers}
              getOptionLabel={(option) => `${option.customer_name} - ${option.city}`}
              value={selectedCustomer}
              onChange={(_, newValue) => handleCustomerChange(newValue)}
              loading={loadingCustomers}
              disabled={loading}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Customer *"
                  placeholder="Pilih atau cari customer"
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {loadingCustomers ? <CircularProgress color="inherit" size={20} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
              renderOption={(props, option) => {
                const { key, ...otherProps } = props;
                return (
                  <Box component="li" key={key} {...otherProps}>
                    <div>
                      <Typography variant="body2" fontWeight="bold">
                        {option.customer_name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {option.city}
                      </Typography>
                    </div>
                  </Box>
                );
              }}
            />
          </Grid>

          {/* Description */}
          <Grid item xs={12}>
            <TextField
              label="Deskripsi"
              fullWidth
              multiline
              rows={3}
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              disabled={loading}
              placeholder="Jelaskan detail kebutuhan atau scope project"
            />
          </Grid>

          {/* Estimated Value */}
          <Grid item xs={12} sm={6}>
            <TextField
              label="Estimasi Nilai Project"
              fullWidth
              type="number"
              value={formData.estimated_value}
              onChange={(e) => handleInputChange("estimated_value", Number(e.target.value))}
              disabled={loading}
              InputProps={{
                startAdornment: <InputAdornment position="start">Rp</InputAdornment>,
              }}
              placeholder="0"
              helperText={
                formData.estimated_value ? formatCurrency(formData.estimated_value) : undefined
              }
            />
          </Grid>

          {/* Skor Lead */}
          <Grid item xs={12} sm={6}>
            <TextField
              label="Skor Lead"
              fullWidth
              type="number"
              value={formData.lead_score}
              onChange={(e) => handleInputChange("lead_score", Number(e.target.value))}
              disabled={loading}
              inputProps={{ min: 0, max: 100 }}
              placeholder="0-100"
              helperText="Skala 0-100, tingkat kemungkinan closing"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <StarIcon sx={{ color: "gold" }} />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          {/* Priority */}
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth disabled={loading}>
              <InputLabel>Prioritas</InputLabel>
              <Select
                value={formData.priority}
                label="Prioritas"
                onChange={(e) => handleInputChange("priority", e.target.value)}
              >
                <MenuItem value="LOW">Low</MenuItem>
                <MenuItem value="MEDIUM">Medium</MenuItem>
                <MenuItem value="HIGH">High</MenuItem>
                <MenuItem value="URGENT">Urgent</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Expected Close Date */}
          <Grid item xs={12} sm={6}>
            <TextField
              label="Target Closing"
              fullWidth
              type="date"
              value={
                formData.expected_close_date
                  ? new Date(formData.expected_close_date).toISOString().split("T")[0]
                  : ""
              }
              onChange={(e) => {
                const dateValue = e.target.value ? new Date(e.target.value) : null;
                handleInputChange("expected_close_date", dateValue);
              }}
              disabled={loading}
              InputLabelProps={{
                shrink: true,
              }}
              helperText="Perkiraan tanggal closing deal"
            />
          </Grid>

          {/* Notes */}
          <Grid item xs={12}>
            <TextField
              label="Catatan Tambahan"
              fullWidth
              multiline
              rows={2}
              value={formData.notes}
              onChange={(e) => handleInputChange("notes", e.target.value)}
              disabled={loading}
              placeholder="Catatan internal, kontak person, dll"
            />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button onClick={handleClose} disabled={loading} color="inherit">
          Batal
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : undefined}
        >
          {loading ? "Menyimpan..." : "Simpan Opportunity"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddOpportunityModal;

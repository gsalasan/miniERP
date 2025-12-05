import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Grid,
  InputAdornment,
  Autocomplete,
  Typography,
  Alert,
  CircularProgress,
  Box,
} from "@mui/material";
import { Star as StarIcon } from "@mui/icons-material";
import { CreateOpportunityData } from "../../api/opportunity";
import { Customer } from "../../types/customer";
import { customersApi } from "../../api/customers";

interface AddOpportunityModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateOpportunityData) => Promise<void>;
  loading?: boolean;
}

const AddOpportunityModal: React.FC<AddOpportunityModalProps> = ({
  open,
  onClose,
  onSubmit,
  loading = false,
}) => {
  const [formData, setFormData] = useState<CreateOpportunityData>({
    title: "",
    customer_id: "",
    description: "",
    estimated_value: 0,
    probability: 0,
    lead_score: 0,
    expected_close_date: "",
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

  const handleInputChange = (field: keyof CreateOpportunityData, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
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
      if (!formData.title.trim()) {
        setError("Judul opportunity harus diisi");
        return;
      }
      if (!formData.customer_id) {
        setError("Customer harus dipilih");
        return;
      }

      // Set default lead_score to 0 if not provided
      const submitData = {
        ...formData,
        lead_score: formData.lead_score || 0,
      };

      await onSubmit(submitData);
      handleClose();
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Gagal membuat opportunity");
    }
  };

  const handleClose = () => {
    // Reset form
    setFormData({
      title: "",
      customer_id: "",
      description: "",
      estimated_value: 0,
      probability: 0,
      lead_score: 0,
      expected_close_date: "",
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
          {/* Opportunity Title */}
          <Grid item xs={12}>
            <TextField
              label="Judul Opportunity *"
              fullWidth
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
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

          {/* Probability */}
          <Grid item xs={12} sm={6}>
            <TextField
              label="Probabilitas (%)"
              fullWidth
              type="number"
              value={formData.probability}
              onChange={(e) => handleInputChange("probability", Number(e.target.value))}
              disabled={loading}
              inputProps={{ min: 0, max: 100 }}
              placeholder="0-100"
              helperText="Persentase kemungkinan closing (0-100%)"
            />
          </Grid>

          {/* Expected Close Date */}
          <Grid item xs={12} sm={6}>
            <TextField
              label="Target Closing"
              fullWidth
              type="date"
              value={formData.expected_close_date || ""}
              onChange={(e) => handleInputChange("expected_close_date", e.target.value)}
              disabled={loading}
              InputLabelProps={{
                shrink: true,
              }}
              helperText="Perkiraan tanggal closing deal"
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

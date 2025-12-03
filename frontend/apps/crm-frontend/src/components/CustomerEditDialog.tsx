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
} from "@mui/material";
import { Customer, CustomerStatus, UpdateCustomerData } from "../types/customer";

interface CustomerEditDialogProps {
  open: boolean;
  customer: Customer | null;
  onClose: () => void;
  onSave: (id: string, data: UpdateCustomerData) => Promise<void>;
}

const CustomerEditDialog: React.FC<CustomerEditDialogProps> = ({
  open,
  customer,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState<UpdateCustomerData>({
    customer_name: "",
    channel: "",
    city: "",
    code: "",
    type: "",
    status: "ACTIVE" as CustomerStatus,
    province: "",
    district: "",
    alamat: "",
    top_days: 30,
    sales_pic: "",
    credit_limit: 0,
    no_npwp: "",
    sppkp: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize form data when customer changes
  useEffect(() => {
    if (customer) {
      setFormData({
        customer_name: customer.customer_name || "",
        code: customer.code || "",
        type: customer.type || "",
        channel: customer.channel || "",
        city: customer.city || "",
        province: customer.province || "",
        district: customer.district || "",
        alamat: customer.alamat || "",
        status: customer.status || "ACTIVE",
        top_days: customer.top_days || 30,
        sales_pic: customer.sales_pic || "",
        credit_limit: customer.credit_limit || 0,
        no_npwp: customer.no_npwp || "",
        sppkp: customer.sppkp || "",
      });
    }
  }, [customer]);

  const handleInputChange =
    (field: keyof UpdateCustomerData) =>
    (
      event:
        | React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
        | { target: { value: unknown } },
    ) => {
      const value = event.target.value;
      // Handle numeric fields
      if (field === "top_days" || field === "credit_limit") {
        const numericValue = value === "" ? 0 : Number(value);
        setFormData((prev) => ({
          ...prev,
          [field]: numericValue,
        }));
      } else {
        setFormData((prev) => ({
          ...prev,
          [field]: value,
        }));
      }
    };

  const handleSave = async () => {
    if (!customer) return;

    try {
      setLoading(true);
      setError(null);

      // Validate required fields
      if (!formData.customer_name?.trim()) {
        setError("Nama customer harus diisi");
        return;
      }

      // Validate numeric fields
      if (formData.top_days !== undefined && formData.top_days < 0) {
        setError("TOP days tidak boleh negatif");
        return;
      }

      if (formData.credit_limit !== undefined && formData.credit_limit < 0) {
        setError("Credit limit tidak boleh negatif");
        return;
      }

      // Clean up data - remove empty strings and convert to proper types
      const cleanData: UpdateCustomerData = {};
      if (formData.customer_name?.trim()) cleanData.customer_name = formData.customer_name.trim();
      if (formData.channel?.trim()) cleanData.channel = formData.channel.trim();
      if (formData.city?.trim()) cleanData.city = formData.city.trim();
      if (formData.district?.trim()) cleanData.district = formData.district.trim();
      if (formData.alamat?.trim()) cleanData.alamat = formData.alamat.trim();
      if (formData.status) cleanData.status = formData.status;
      if (formData.top_days !== undefined) cleanData.top_days = Number(formData.top_days);
      if (formData.sales_pic?.trim())
        cleanData.sales_pic = formData.sales_pic.trim();
      if (formData.credit_limit !== undefined)
        cleanData.credit_limit = Number(formData.credit_limit);
      if (formData.no_npwp?.trim()) cleanData.no_npwp = formData.no_npwp.trim();
      if (formData.sppkp?.trim()) cleanData.sppkp = formData.sppkp.trim();

      await onSave(customer.id, cleanData);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengupdate customer");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setError(null);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 3 },
      }}
    >
      <DialogTitle
        sx={{
          background: "linear-gradient(45deg, #1976d2, #42a5f5)",
          color: "white",
          fontWeight: 600,
        }}
      >
        Edit Customer
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Nama Customer"
              value={formData.customer_name}
              onChange={handleInputChange("customer_name")}
              required
              variant="outlined"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Channel"
              value={formData.channel}
              onChange={handleInputChange("channel")}
              variant="outlined"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Kota"
              value={formData.city}
              onChange={handleInputChange("city")}
              variant="outlined"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select value={formData.status} label="Status" onChange={handleInputChange("status")}>
                <MenuItem value="ACTIVE">Active</MenuItem>
                <MenuItem value="INACTIVE">Inactive</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="TOP (Hari)"
              type="number"
              value={formData.top_days}
              onChange={handleInputChange("top_days")}
              variant="outlined"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Credit Limit"
              type="number"
              value={formData.credit_limit}
              onChange={handleInputChange("credit_limit")}
              variant="outlined"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Sales ID"
              value={formData.sales_pic}
              onChange={handleInputChange("sales_pic")}
              variant="outlined"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="No. NPWP"
              value={formData.no_npwp}
              onChange={handleInputChange("no_npwp")}
              variant="outlined"
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="SPPKP"
              value={formData.sppkp}
              onChange={handleInputChange("sppkp")}
              variant="outlined"
            />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 3, gap: 2 }}>
        <Button onClick={handleClose} variant="outlined" sx={{ minWidth: 100 }}>
          Batal
        </Button>
        <Button onClick={handleSave} variant="contained" disabled={loading} sx={{ minWidth: 100 }}>
          {loading ? "Menyimpan..." : "Simpan"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CustomerEditDialog;

import React, { useState } from "react";
import {
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Box,
  Paper,
  Button,
  IconButton,
  FormControlLabel,
  Switch,
  Alert,
  Tooltip,
  Chip,
} from "@mui/material";
import { Add as AddIcon, Delete as DeleteIcon, Info as InfoIcon } from "@mui/icons-material";
import { CreateCustomerData, CustomerStatus, UpdateCustomerData } from "../types/customer";

interface CustomerFormProps {
  data: CreateCustomerData | UpdateCustomerData;
  onChange: (data: CreateCustomerData | UpdateCustomerData) => void;
  loading?: boolean;
  mode?: "create" | "edit";
}

const CustomerForm: React.FC<CustomerFormProps> = ({
  data,
  onChange,
  loading = false,
  mode = "create",
}) => {
  const [isPKP, setIsPKP] = useState(false);

  // Temporary sales options until user system is active
  const dummySalesOptions = [
    { value: "", label: "Tidak ada sales yang ditugaskan" },
    { value: "admin-sales", label: "Admin Sales (Sementara)" },
    { value: "SALES-001", label: "Sales Team 1" },
    { value: "SALES-002", label: "Sales Team 2" },
    { value: "manager-sales", label: "Sales Manager" },
  ];

  // Determine if tax fields should be shown/required
  const isActiveStatus = data.status === "ACTIVE";
  const shouldShowTaxFields = isActiveStatus || data.no_npwp || data.sppkp;

  const handleInputChange =
    (field: keyof (CreateCustomerData | UpdateCustomerData)) =>
    (
      event:
        | React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
        | { target: { value: unknown } }
    ) => {
      const value = event.target.value;
      // Handle status change
      if (field === "status") {
        const newData = { ...data, [field]: value as CustomerStatus };
        // Clear tax fields if changing to PROSPECT
        if (value === "PROSPECT") {
          newData.no_npwp = "";
          newData.sppkp = "";
        }
        onChange(newData);
        return;
      }
      // Handle numeric fields
      if (field === "top_days" || field === "credit_limit") {
        const numericValue = value === "" ? 0 : Number(value);
        onChange({ ...data, [field]: numericValue });
      } else {
        onChange({ ...data, [field]: value });
      }
    };

  const handlePKPChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const checked = event.target.checked;
    setIsPKP(checked);
    // If not PKP, clear SPPKP
    if (!checked) {
      onChange({ ...data, sppkp: "" });
    }
  };

  const handleAddContact = () => {
    const currentContacts = data.contacts || [];
    const newContact = {
      name: "",
      position: "",
      email: "",
      phone: "",
    };
    onChange({ ...data, contacts: [...currentContacts, newContact] });
  };

  const handleRemoveContact = (index: number) => {
    const currentContacts = data.contacts || [];
    const updatedContacts = currentContacts.filter((_, i) => i !== index);
    onChange({ ...data, contacts: updatedContacts });
  };

  const handleContactChange = (index: number, field: string, value: string) => {
    const currentContacts = data.contacts || [];
    const updatedContacts = currentContacts.map((contact, i) =>
      i === index ? { ...contact, [field]: value } : contact
    );
    onChange({ ...data, contacts: updatedContacts });
  };

  return (
    <Grid container spacing={3}>
      {/* Basic Information */}
      <Grid item xs={12}>
        <Typography variant="h6" fontWeight={600} gutterBottom>
          Informasi Dasar
        </Typography>
      </Grid>

      {/* Status Information - Moved to top */}
      <Grid item xs={12}>
        {data.status === "PROSPECT" && (
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">
              <strong>Status Prospect:</strong> Fokus pada data dasar pelanggan. Data pajak bersifat
              opsional dan dapat diisi nanti saat pelanggan mulai bertransaksi.
            </Typography>
          </Alert>
        )}
        {data.status === "ACTIVE" && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="body2">
              <strong>Status Active:</strong> Pelanggan sudah bertransaksi. Data pajak wajib
              dilengkapi untuk pembuatan faktur resmi.
            </Typography>
          </Alert>
        )}
      </Grid>

      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Nama Customer"
          value={data.customer_name || ""}
          onChange={handleInputChange("customer_name")}
          required={mode === "create"}
          disabled={loading}
          variant="outlined"
        />
      </Grid>

      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Channel"
          value={data.channel || ""}
          onChange={handleInputChange("channel")}
          required={mode === "create"}
          disabled={loading}
          variant="outlined"
        />
      </Grid>

      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Kota"
          value={data.city || ""}
          onChange={handleInputChange("city")}
          required={mode === "create"}
          disabled={loading}
          variant="outlined"
        />
      </Grid>

      <Grid item xs={12} sm={6}>
        <FormControl fullWidth disabled={loading}>
          <InputLabel>Status</InputLabel>
          <Select
            value={data.status || "PROSPECT"}
            label="Status"
            onChange={handleInputChange("status")}
          >
            <MenuItem value="PROSPECT">Prospect</MenuItem>
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
          value={data.top_days || 30}
          onChange={handleInputChange("top_days")}
          disabled={loading}
          variant="outlined"
          inputProps={{ min: 0 }}
        />
      </Grid>

      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Credit Limit"
          type="number"
          value={data.credit_limit || 0}
          onChange={handleInputChange("credit_limit")}
          disabled={loading}
          variant="outlined"
          inputProps={{ min: 0 }}
        />
      </Grid>

      <Grid item xs={12} sm={6}>
        <FormControl fullWidth disabled={loading}>
          <InputLabel>Sales ID</InputLabel>
          <Select
            value={data.assigned_sales_id || ""}
            label="Sales ID"
            onChange={handleInputChange("assigned_sales_id")}
            displayEmpty
          >
            {dummySalesOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>

      {/* Tax Information Section - Only show when needed */}
      {shouldShowTaxFields && (
        <>
          <Grid item xs={12}>
            <Typography variant="h6" fontWeight={600} sx={{ mt: 2, mb: 1 }}>
              Informasi Pajak
              {isActiveStatus && (
                <Chip label="Wajib diisi" color="warning" size="small" sx={{ ml: 1 }} />
              )}
            </Typography>
            {isActiveStatus && (
              <Box sx={{ mb: 2 }}>
                <FormControlLabel
                  control={<Switch checked={isPKP} onChange={handlePKPChange} disabled={loading} />}
                  label={
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography variant="body2">
                        Pelanggan adalah Pengusaha Kena Pajak (PKP)
                      </Typography>
                      <Tooltip title="PKP wajib mengisi NPWP dan SPPKP. Non-PKP hanya perlu NPWP jika ada.">
                        <InfoIcon fontSize="small" color="action" />
                      </Tooltip>
                    </Box>
                  }
                />
              </Box>
            )}
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="No. NPWP"
              value={data.no_npwp || ""}
              onChange={handleInputChange("no_npwp")}
              disabled={loading}
              variant="outlined"
              required={isActiveStatus && isPKP}
              helperText={
                isActiveStatus
                  ? isPKP
                    ? "Wajib diisi untuk PKP"
                    : "Opsional untuk Non-PKP"
                  : "Opsional untuk Prospect"
              }
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="SPPKP (Surat Pengukuhan PKP)"
              value={data.sppkp || ""}
              onChange={handleInputChange("sppkp")}
              disabled={loading || (isActiveStatus && !isPKP)}
              variant="outlined"
              required={isActiveStatus && isPKP}
              helperText={
                isActiveStatus
                  ? isPKP
                    ? "Wajib diisi untuk PKP"
                    : "Tidak perlu diisi untuk Non-PKP"
                  : "Opsional untuk Prospect"
              }
            />
          </Grid>
        </>
      )}

      {/* Show tax fields button for Prospect */}
      {!shouldShowTaxFields && data.status === "PROSPECT" && (
        <Grid item xs={12}>
          <Button
            variant="outlined"
            onClick={() => onChange({ ...data, no_npwp: "" })}
            startIcon={<AddIcon />}
            disabled={loading}
          >
            Tambah Informasi Pajak (Opsional)
          </Button>
        </Grid>
      )}

      {/* Contacts Section */}
      <Grid item xs={12}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 2 }}>
          <Typography variant="h6" fontWeight={600}>
            Kontak ({data.contacts?.length || 0})
          </Typography>
          <Button
            onClick={handleAddContact}
            startIcon={<AddIcon />}
            variant="outlined"
            size="small"
            disabled={loading}
          >
            Tambah Kontak
          </Button>
        </Box>
      </Grid>

      {data.contacts?.map((contact, index) => (
        <Grid item xs={12} key={index}>
          <Paper
            variant="outlined"
            sx={{
              p: 3,
              borderRadius: 2,
              backgroundColor: "rgba(0, 0, 0, 0.02)",
            }}
          >
            <Box
              sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}
            >
              <Typography variant="subtitle1" fontWeight={500}>
                Kontak {index + 1}
              </Typography>
              <IconButton
                onClick={() => handleRemoveContact(index)}
                color="error"
                size="small"
                disabled={loading}
              >
                <DeleteIcon />
              </IconButton>
            </Box>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Nama"
                  value={contact.name || ""}
                  onChange={(e) => handleContactChange(index, "name", e.target.value)}
                  disabled={loading}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Posisi"
                  value={contact.position || ""}
                  onChange={(e) => handleContactChange(index, "position", e.target.value)}
                  disabled={loading}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={contact.email || ""}
                  onChange={(e) => handleContactChange(index, "email", e.target.value)}
                  disabled={loading}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Telepon"
                  value={contact.phone || ""}
                  onChange={(e) => handleContactChange(index, "phone", e.target.value)}
                  disabled={loading}
                  size="small"
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      ))}

      {data.contacts?.length === 0 && (
        <Grid item xs={12}>
          <Box
            sx={{
              textAlign: "center",
              py: 4,
              color: "text.secondary",
              border: "2px dashed",
              borderColor: "divider",
              borderRadius: 2,
            }}
          >
            <Typography variant="body1" gutterBottom>
              Belum ada kontak ditambahkan
            </Typography>
            <Typography variant="body2">
              Klik "Tambah Kontak" untuk menambahkan kontak pertama
            </Typography>
          </Box>
        </Grid>
      )}
    </Grid>
  );
};

export default CustomerForm;

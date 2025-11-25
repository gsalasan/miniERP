import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Typography, Paper, Button, Alert, Breadcrumbs, Link } from "@mui/material";
import { ArrowBack as ArrowBackIcon, Save as SaveIcon } from "@mui/icons-material";
import { customersApi } from "../../api/customers";
import { CreateCustomerData, CustomerStatus, UpdateCustomerData } from "../../types/customer";
import { CustomerForm } from "../../components";

const NewCustomerPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const initialFormData: CreateCustomerData = {
    customer_name: "",
    channel: "",
    city: "",
    district: "",
    alamat: "",
    status: "PROSPECT" as CustomerStatus,
    top_days: 30,
    assigned_sales_id: "",
    credit_limit: 0,
    no_npwp: "",
    sppkp: "",
    contacts: [],
    rekenings: [],
  };

  const [formData, setFormData] = useState<CreateCustomerData>(initialFormData);

  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);

      // Validate required fields
      if (!formData.customer_name?.trim()) {
        setError("Nama customer harus diisi");
        return;
      }
      if (!formData.channel?.trim()) {
        setError("Channel harus diisi");
        return;
      }
      if (!formData.city?.trim()) {
        setError("Kota harus diisi");
        return;
      }

      // Additional validation for ACTIVE status
      if (formData.status === "ACTIVE") {
        if (!formData.no_npwp?.trim()) {
          setError("NPWP wajib diisi untuk customer dengan status Active");
          return;
        }
        // If SPPKP is filled, it means customer is PKP and NPWP is required
        if (formData.sppkp?.trim() && !formData.no_npwp?.trim()) {
          setError("NPWP wajib diisi jika customer adalah PKP (memiliki SPPKP)");
          return;
        }
      }

      // Clean up data - remove empty strings and convert to proper types
      const cleanData: CreateCustomerData = {
        customer_name: formData.customer_name.trim(),
        channel: formData.channel.trim(),
        city: formData.city.trim(),
        district: formData.district?.trim() || undefined,
        alamat: formData.alamat?.trim() || undefined,
        status: formData.status,
        top_days: Number(formData.top_days),
        assigned_sales_id: formData.assigned_sales_id?.trim() || undefined,
        credit_limit: Number(formData.credit_limit) || undefined,
        no_npwp: formData.no_npwp?.trim() || undefined,
        sppkp: formData.sppkp?.trim() || undefined,
        contacts: formData.contacts?.filter((contact) => contact.name?.trim()) || undefined,
        rekenings: formData.rekenings?.filter((r) => r.account_number?.trim()) || undefined,
      };

      await customersApi.createCustomer(cleanData);
      setSuccess(true);

      // Redirect to customers list after 1.5 seconds
      setTimeout(() => {
        navigate("/customers");
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal membuat customer baru");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    // Try to go back in history first, otherwise go to customers list
    try {
      navigate(-1);
    } catch {
      navigate("/customers");
    }
  };

  const handleFormChange = (data: CreateCustomerData | UpdateCustomerData) => {
    setFormData(data as CreateCustomerData);
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: "auto", p: 3 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 3 }}>
        <Link
          component="button"
          variant="body1"
          onClick={() => navigate("/customers")}
          sx={{ textDecoration: "none" }}
        >
          Customers
        </Link>
        <Typography color="text.primary">Tambah Customer Baru</Typography>
      </Breadcrumbs>

      {/* Header */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", sm: "center" },
          gap: 2,
          mb: 3,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Button
            type="button"
            onClick={handleCancel}
            startIcon={<ArrowBackIcon />}
            variant="outlined"
            size="small"
          >
            Kembali
          </Button>
          <Typography variant="h4" component="h1" fontWeight={600}>
            Tambah Customer Baru
          </Typography>
        </Box>

        <Box sx={{ display: "flex", gap: 2 }}>
          <Button type="button" onClick={handleCancel} variant="outlined" disabled={loading}>
            Batal
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            startIcon={<SaveIcon />}
            disabled={loading}
          >
            {loading ? "Menyimpan..." : "Simpan"}
          </Button>
        </Box>
      </Box>

      {/* Alerts */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Customer berhasil dibuat! Mengarahkan ke daftar customers...
        </Alert>
      )}

      {/* Form */}
      <Paper
        elevation={2}
        sx={{
          p: 4,
          borderRadius: 3,
          background: "linear-gradient(145deg, #ffffff 0%, #f8faff 100%)",
        }}
      >
        <CustomerForm data={formData} onChange={handleFormChange} loading={loading} mode="create" />
      </Paper>
    </Box>
  );
};

export default NewCustomerPage;

import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Box, Typography, Paper, Button, Alert, Breadcrumbs, Link } from "@mui/material";
import { ArrowBack as ArrowBackIcon, Save as SaveIcon } from "@mui/icons-material";
import { customersApi } from "../../api/customers";
import { Customer, UpdateCustomerData, CustomerStatus } from "../../types/customer";
import { CustomerForm, LoadingSpinner } from "../../components";

const EditCustomerPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  const [formData, setFormData] = useState<UpdateCustomerData>({
    customer_name: "",
    channel: "",
    city: "",
    status: "ACTIVE" as CustomerStatus,
    top_days: 30,
    assigned_sales_id: "",
    credit_limit: 0,
    no_npwp: "",
    sppkp: "",
    contacts: [],
  });

  // Load customer data
  const loadCustomer = async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);
      const data = await customersApi.getCustomerById(id);
      setCustomer(data);
      // Initialize form data
      setFormData({
        customer_name: data.customer_name,
        channel: data.channel,
        city: data.city,
        status: data.status,
        top_days: data.top_days,
        assigned_sales_id: data.assigned_sales_id || "",
        credit_limit: data.credit_limit || 0,
        no_npwp: data.no_npwp || "",
        sppkp: data.sppkp || "",
        contacts:
          data.customer_contacts?.map((contact) => ({
            id: contact.id,
            name: contact.name,
            position: contact.position || "",
            email: contact.email || "",
            phone: contact.phone || "",
          })) || [],
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan saat memuat data customer");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomer();
  }, [id]);

  // Clear any pending timeouts when unmounting
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleSave = async () => {
    if (!id || !customer) return;

    try {
      setSaving(true);
      setError(null);

      // Validate required fields
      if (!formData.customer_name?.trim()) {
        setError("Nama customer harus diisi");
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
      const cleanData: UpdateCustomerData = {};
      if (formData.customer_name?.trim()) cleanData.customer_name = formData.customer_name.trim();
      if (formData.channel?.trim()) cleanData.channel = formData.channel.trim();
      if (formData.city?.trim()) cleanData.city = formData.city.trim();
      if (formData.status) cleanData.status = formData.status;
      if (formData.top_days !== undefined) cleanData.top_days = Number(formData.top_days);
      if (formData.assigned_sales_id?.trim())
        cleanData.assigned_sales_id = formData.assigned_sales_id.trim();
      if (formData.credit_limit !== undefined)
        cleanData.credit_limit = Number(formData.credit_limit);
      if (formData.no_npwp?.trim()) cleanData.no_npwp = formData.no_npwp.trim();
      // Filter out contacts with empty names
      if (formData.contacts) {
        cleanData.contacts = formData.contacts.filter((contact) => contact.name?.trim());
      }

      // If there's nothing to update (no changed fields), just go back to detail
      if (Object.keys(cleanData).length === 0) {
        setSuccess(true);
        navigate(`/customers/${id}`);
        return;
      }

      await customersApi.updateCustomer(id, cleanData);
      setSuccess(true);
      // After successful update, wait 1.5 seconds then redirect to customer detail
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = window.setTimeout(() => {
        navigate(`/customers/${id}`);
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengupdate customer");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    // Try to go back in history first, otherwise go to customer detail
    try {
      navigate(-1);
    } catch {
      navigate(`/customers/${id}`);
    }
  };

  const handleFormChange = (data: UpdateCustomerData) => {
    setFormData(data);
  };

  if (loading) {
    return <LoadingSpinner message="Memuat data customer..." />;
  }

  if (error && !customer) {
    return (
      <Box sx={{ maxWidth: 1200, mx: "auto", p: 3 }}>
        <Alert severity="error">{error}</Alert>
        <Button onClick={() => navigate("/customers")} sx={{ mt: 2 }}>
          Kembali ke Daftar Customer
        </Button>
      </Box>
    );
  }

  if (!customer) {
    return (
      <Box sx={{ maxWidth: 1200, mx: "auto", p: 3 }}>
        <Alert severity="warning">Customer tidak ditemukan</Alert>
        <Button onClick={() => navigate("/customers")} sx={{ mt: 2 }}>
          Kembali ke Daftar Customer
        </Button>
      </Box>
    );
  }

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
        <Link
          component="button"
          variant="body1"
          onClick={() => navigate(`/customers/${id}`)}
          sx={{ textDecoration: "none" }}
        >
          {customer.customer_name}
        </Link>
        <Typography color="text.primary">Edit</Typography>
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
            Edit Customer - {customer.customer_name}
          </Typography>
        </Box>

        <Box sx={{ display: "flex", gap: 2 }}>
          <Button type="button" onClick={handleCancel} variant="outlined" disabled={saving}>
            Batal
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            startIcon={<SaveIcon />}
            disabled={saving}
          >
            {saving ? "Menyimpan..." : "Simpan"}
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
          Customer berhasil diupdate! Mengarahkan ke halaman detail...
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
        <CustomerForm data={formData} onChange={handleFormChange} loading={saving} mode="edit" />
      </Paper>
    </Box>
  );
};

export default EditCustomerPage;

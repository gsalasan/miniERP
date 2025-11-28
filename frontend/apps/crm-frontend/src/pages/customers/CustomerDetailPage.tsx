import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Paper,
  Button,
  Alert,
  Breadcrumbs,
  Link,
  Grid,
  Divider,
  Chip,
  Card,
  CardContent,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Person as PersonIcon,
} from "@mui/icons-material";
import { customersApi } from "../../api/customers";
import { Customer, CustomerStatus } from "../../types/customer";
import { LoadingSpinner, StatusBadge } from "../../components";
import { useAuth } from "../../contexts/AuthContext";

const CustomerDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if user is CEO - CEO cannot edit/delete customers
  const isCEO = user?.roles?.includes("CEO") || false;

  // Load customer data
  const loadCustomer = async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);
      const data = await customersApi.getCustomerById(id);
      setCustomer(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan saat memuat data customer");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomer();
  }, [id]);

  const handleEdit = () => {
    navigate(`/customers/${id}/edit`);
  };

  const handleDelete = async () => {
    if (!id || !customer) return;

    if (window.confirm(`Apakah Anda yakin ingin menghapus customer "${customer.customer_name}"?`)) {
      try {
        await customersApi.deleteCustomer(id);
        navigate("/customers");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Gagal menghapus customer");
      }
    }
  };

  const handleBack = () => {
    navigate("/customers");
  };

  if (loading) {
    return <LoadingSpinner message="Memuat data customer..." />;
  }

  if (error && !customer) {
    return (
      <Box sx={{ maxWidth: 1200, mx: "auto", p: 3 }}>
        <Alert severity="error">{error}</Alert>
        <Button onClick={handleBack} sx={{ mt: 2 }}>
          Kembali ke Daftar Customer
        </Button>
      </Box>
    );
  }

  if (!customer) {
    return (
      <Box sx={{ maxWidth: 1200, mx: "auto", p: 3 }}>
        <Alert severity="warning">Customer tidak ditemukan</Alert>
        <Button onClick={handleBack} sx={{ mt: 2 }}>
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
          onClick={handleBack}
          sx={{ textDecoration: "none" }}
        >
          Customers
        </Link>
        <Typography color="text.primary">{customer.customer_name}</Typography>
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
            onClick={handleBack}
            startIcon={<ArrowBackIcon />}
            variant="outlined"
            size="small"
          >
            Kembali
          </Button>
          <Typography variant="h4" component="h1" fontWeight={600}>
            {customer.customer_name}
          </Typography>
          <StatusBadge status={customer.status} />
        </Box>

        {!isCEO && (
          <Box sx={{ display: "flex", gap: 2 }}>
            <Button
              onClick={handleDelete}
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
            >
              Hapus
            </Button>
            <Button onClick={handleEdit} variant="contained" startIcon={<EditIcon />}>
              Edit
            </Button>
          </Box>
        )}
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Customer Information */}
      <Paper
        elevation={2}
        sx={{
          p: 4,
          borderRadius: 3,
          mb: 3,
          background: "linear-gradient(145deg, #ffffff 0%, #f8faff 100%)",
        }}
      >
        <Typography variant="h6" fontWeight={600} mb={3}>
          Informasi Customer
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary" mb={0.5}>
              Nama Customer
            </Typography>
            <Typography variant="body1" fontWeight={500}>
              {customer.customer_name}
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary" mb={0.5}>
              Channel
            </Typography>
            <Typography variant="body1" fontWeight={500}>
              {customer.channel}
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary" mb={0.5}>
              Kota
            </Typography>
            <Typography variant="body1" fontWeight={500}>
              {customer.city}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary" mb={0.5}>
              District
            </Typography>
            <Typography variant="body1" fontWeight={500}>
              {customer.district || "-"}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={12}>
            <Typography variant="body2" color="text.secondary" mb={0.5}>
              Alamat
            </Typography>
            <Typography variant="body1" fontWeight={500}>
              {customer.alamat || "-"}
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary" mb={0.5}>
              Status
            </Typography>
            <StatusBadge status={customer.status} />
          </Grid>

          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary" mb={0.5}>
              TOP (Terms of Payment)
            </Typography>
            <Typography variant="body1" fontWeight={500}>
              {customer.top_days} hari
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary" mb={0.5}>
              Credit Limit
            </Typography>
            <Typography variant="body1" fontWeight={500}>
              {customer.credit_limit
                ? new Intl.NumberFormat("id-ID", {
                    style: "currency",
                    currency: "IDR",
                  }).format(customer.credit_limit)
                : "-"}
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary" mb={0.5}>
              Sales Assigned
            </Typography>
            <Typography variant="body1" fontWeight={500}>
              {customer.assigned_sales_id || "-"}
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary" mb={0.5}>
              NPWP
            </Typography>
            <Typography variant="body1" fontWeight={500}>
              {customer.no_npwp || "-"}
            </Typography>
          </Grid>

          {customer.sppkp && (
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary" mb={0.5}>
                SPPKP
              </Typography>
              <Typography variant="body1" fontWeight={500}>
                {customer.sppkp}
              </Typography>
            </Grid>
          )}
        </Grid>
      </Paper>

      {/* Contacts */}
      <Paper
        elevation={2}
        sx={{
          p: 4,
          borderRadius: 3,
          background: "linear-gradient(145deg, #ffffff 0%, #f8faff 100%)",
        }}
      >
        <Typography variant="h6" fontWeight={600} mb={3}>
          Kontak ({customer.customer_contacts?.length || 0})
        </Typography>

        {customer.customer_contacts && customer.customer_contacts.length > 0 ? (
          <Grid container spacing={2}>
            {customer.customer_contacts.map((contact, index) => (
              <Grid item xs={12} sm={6} md={4} key={contact.id || index}>
                <Card
                  variant="outlined"
                  sx={{
                    borderRadius: 2,
                    "&:hover": {
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                      borderColor: "primary.main",
                    },
                  }}
                >
                  <CardContent>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        mb: 2,
                      }}
                    >
                      <PersonIcon color="primary" />
                      <Typography variant="subtitle1" fontWeight={600}>
                        {contact.name}
                      </Typography>
                    </Box>

                    {contact.position && (
                      <Typography variant="body2" color="text.secondary" mb={1}>
                        {contact.position}
                      </Typography>
                    )}

                    {contact.email && (
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          mb: 0.5,
                        }}
                      >
                        <EmailIcon fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">
                          {contact.email}
                        </Typography>
                      </Box>
                    )}

                    {contact.phone && (
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <PhoneIcon fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">
                          {contact.phone}
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Alert severity="info" sx={{ borderRadius: 2 }}>
            Belum ada kontak untuk customer ini
          </Alert>
        )}
      </Paper>

      {/* Rekening (Bank Accounts) */}
      <Paper
        elevation={2}
        sx={{
          p: 4,
          borderRadius: 3,
          background: "linear-gradient(145deg, #ffffff 0%, #f8faff 100%)",
          mt: 3,
        }}
      >
        <Typography variant="h6" fontWeight={600} mb={3}>
          Rekening ({customer.customer_rekenings?.length || 0})
        </Typography>

        {customer.customer_rekenings && customer.customer_rekenings.length > 0 ? (
          <Grid container spacing={2}>
            {customer.customer_rekenings.map((r, idx) => (
              <Grid item xs={12} sm={6} md={4} key={r.id || idx}>
                <Card variant="outlined" sx={{ borderRadius: 2 }}>
                  <CardContent>
                    <Typography variant="subtitle1" fontWeight={600} mb={1}>
                      {r.bank_name || "Bank"} - {r.account_number}
                    </Typography>
                    {r.account_holder && (
                      <Typography variant="body2" color="text.secondary">
                        {r.account_holder}
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Alert severity="info" sx={{ borderRadius: 2 }}>
            Belum ada nomor rekening untuk customer ini
          </Alert>
        )}
      </Paper>
    </Box>
  );
};

export default CustomerDetailPage;

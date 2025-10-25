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
  Card,
  CardContent,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Person as PersonIcon,
} from "@mui/icons-material";
import { customersApi } from "../../api/customers";
import { Customer, CustomerContact } from "../../types/customer";
import { LoadingSpinner, StatusBadge } from "../../components";

const CustomerDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [newContact, setNewContact] = useState({
    name: "",
    position: "",
    email: "",
    phone: "",
  });

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

  const handleBack = () => {
    navigate("/customers");
  };

  const handleAddContact = () => {
    setContactDialogOpen(true);
  };

  const handleSaveContact = async () => {
    // TODO: Implement add contact functionality
    // For now, just close the dialog
    setContactDialogOpen(false);
    setNewContact({ name: "", position: "", email: "", phone: "" });
  };

  const handleDeleteContact = async (contactId: string) => {
    if (!id || !customer) return;
    
    if (window.confirm("Apakah Anda yakin ingin menghapus kontak ini?")) {
      try {
        await customersApi.deleteCustomerContact(id, contactId);
        // Reload customer data to refresh the contact list
        await loadCustomer();
      } catch (error) {
        setError(error instanceof Error ? error.message : "Gagal menghapus kontak");
      }
    }
  };

  if (loading) {
    return <LoadingSpinner message="Memuat data customer..." />;
  }

  if (error) {
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

        <Button onClick={handleEdit} variant="contained" startIcon={<EditIcon />}>
          Edit Customer
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Customer Information */}
        <Grid item xs={12} md={8}>
          <Paper
            elevation={2}
            sx={{
              p: 3,
              borderRadius: 3,
              background: "linear-gradient(145deg, #ffffff 0%, #f8faff 100%)",
            }}
          >
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Informasi Customer
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Nama Customer
                </Typography>
                <Typography variant="body1" fontWeight={500}>
                  {customer.customer_name}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Channel
                </Typography>
                <Typography variant="body1" fontWeight={500}>
                  {customer.channel}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Kota
                </Typography>
                <Typography variant="body1" fontWeight={500}>
                  {customer.city}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Status
                </Typography>
                <StatusBadge status={customer.status} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  TOP (Hari)
                </Typography>
                <Typography variant="body1" fontWeight={500}>
                  {customer.top_days} hari
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Credit Limit
                </Typography>
                <Typography variant="body1" fontWeight={500}>
                  {customer.credit_limit
                    ? new Intl.NumberFormat('id-ID', { 
                        style: 'currency', 
                        currency: 'IDR' 
                      }).format(customer.credit_limit)
                    : "-"}
                </Typography>
              </Grid>
              {customer.assigned_sales_id && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Sales ID
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {customer.assigned_sales_id}
                  </Typography>
                </Grid>
              )}
              
              {customer.no_npwp && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    No. NPWP
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {customer.no_npwp}
                  </Typography>
                </Grid>
              )}
              
              {customer.sppkp && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    SPPKP
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {customer.sppkp}
                  </Typography>
                </Grid>
              )}
            </Grid>
          </Paper>
        </Grid>

        {/* Summary Card */}
        <Grid item xs={12} md={4}>
          <Card
            elevation={2}
            sx={{
              borderRadius: 3,
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              color: "white",
            }}
          >
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Ringkasan
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Total Kontak
                </Typography>
                <Typography variant="h4" fontWeight={700}>
                  {customer.customer_contacts?.length || 0}
                </Typography>
              </Box>
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Bergabung Sejak
                </Typography>
                <Typography variant="body1" fontWeight={500}>
                  {new Date(customer.createdAt).toLocaleDateString('id-ID', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Customer Contacts */}
        <Grid item xs={12}>
          <Paper
            elevation={2}
            sx={{
              p: 3,
              borderRadius: 3,
              background: "linear-gradient(145deg, #ffffff 0%, #f8faff 100%)",
            }}
          >
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 3,
              }}
            >
              <Typography variant="h6" fontWeight={600}>
                Daftar Kontak ({customer.customer_contacts?.length || 0})
              </Typography>
              <Button
                onClick={handleAddContact}
                variant="contained"
                startIcon={<AddIcon />}
                size="small"
              >
                Tambah Kontak
              </Button>
            </Box>

            {customer.customer_contacts && customer.customer_contacts.length > 0 ? (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Nama</TableCell>
                      <TableCell>Posisi</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Telepon</TableCell>
                      <TableCell align="center">Aksi</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {customer.customer_contacts.map((contact) => (
                      <TableRow key={contact.id}>
                        <TableCell>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <PersonIcon color="action" fontSize="small" />
                            {contact.name}
                          </Box>
                        </TableCell>
                        <TableCell>{contact.position || '-'}</TableCell>
                        <TableCell>
                          {contact.email ? (
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                              <EmailIcon color="action" fontSize="small" />
                              {contact.email}
                            </Box>
                          ) : '-'}
                        </TableCell>
                        <TableCell>
                          {contact.phone ? (
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                              <PhoneIcon color="action" fontSize="small" />
                              {contact.phone}
                            </Box>
                          ) : '-'}
                        </TableCell>
                        <TableCell align="center">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteContact(contact.id)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Box
                sx={{
                  textAlign: "center",
                  py: 6,
                  color: "text.secondary",
                }}
              >
                <PersonIcon sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
                <Typography variant="h6" gutterBottom>
                  Belum ada kontak
                </Typography>
                <Typography variant="body2">
                  Tambahkan kontak pertama untuk customer ini
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Add Contact Dialog */}
      <Dialog
        open={contactDialogOpen}
        onClose={() => setContactDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Tambah Kontak Baru</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nama"
                value={newContact.name}
                onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Posisi"
                value={newContact.position}
                onChange={(e) => setNewContact({ ...newContact, position: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={newContact.email}
                onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Telepon"
                value={newContact.phone}
                onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setContactDialogOpen(false)}>Batal</Button>
          <Button onClick={handleSaveContact} variant="contained">
            Simpan
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CustomerDetailPage;
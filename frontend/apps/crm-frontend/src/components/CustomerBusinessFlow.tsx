import React from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Step,
  Stepper,
  StepLabel,
  StepContent,
  Chip,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import {
  PersonAdd as PersonAddIcon,
  Business as BusinessIcon,
  CheckCircle as CheckCircleIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  Person as PersonIcon,
} from "@mui/icons-material";

const CustomerBusinessFlow: React.FC = () => {
  const steps = [
    {
      label: "Status: PROSPECT",
      description: "Pelanggan baru yang masih bersifat calon atau potensial",
      color: "info",
      icon: <PersonAddIcon />,
      requirements: [
        "Data dasar wajib: Nama, Channel, Kota",
        "Data pajak (NPWP, SPPKP) bersifat opsional",
        "Fokus pada pengumpulan informasi kontak",
      ],
    },
    {
      label: "Status: ACTIVE",
      description: "Pelanggan yang sudah mulai bertransaksi dengan perusahaan",
      color: "success",
      icon: <BusinessIcon />,
      requirements: [
        "Semua data dasar tetap wajib",
        "NPWP wajib diisi untuk pembuatan faktur",
        "Penentuan status PKP/Non-PKP",
      ],
    },
    {
      label: "Penentuan Status Pajak",
      description: "Klasifikasi pelanggan berdasarkan status pajak",
      color: "warning",
      icon: <CheckCircleIcon />,
      requirements: [
        "PKP: Wajib mengisi NPWP dan SPPKP",
        "Non-PKP: Hanya perlu NPWP (jika ada)",
        "Validasi oleh bagian Finance",
      ],
    },
  ];

  return (
    <Box sx={{ maxWidth: 1200, mx: "auto", p: 3 }}>
      <Typography variant="h4" fontWeight={600} gutterBottom>
        Alur Bisnis Pengisian Data Customer
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Sistem mengikuti alur bisnis yang disesuaikan dengan kebutuhan administrasi dan perpajakan
        perusahaan.
      </Typography>

      {/* Overview Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Card elevation={2}>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <PersonAddIcon color="info" sx={{ mr: 1 }} />
                <Typography variant="h6" fontWeight={600}>
                  Prospect
                </Typography>
                <Chip label="Calon" color="info" size="small" sx={{ ml: "auto" }} />
              </Box>
              <Typography variant="body2" color="text.secondary">
                Data dasar saja, pajak opsional. Fokus pada kontak dan informasi dasar pelanggan.
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card elevation={2}>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <BusinessIcon color="success" sx={{ mr: 1 }} />
                <Typography variant="h6" fontWeight={600}>
                  Active
                </Typography>
                <Chip label="Aktif" color="success" size="small" sx={{ ml: "auto" }} />
              </Box>
              <Typography variant="body2" color="text.secondary">
                Sudah bertransaksi. Data pajak wajib untuk pembuatan faktur resmi.
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card elevation={2}>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <CheckCircleIcon color="warning" sx={{ mr: 1 }} />
                <Typography variant="h6" fontWeight={600}>
                  PKP Status
                </Typography>
                <Chip label="Validasi" color="warning" size="small" sx={{ ml: "auto" }} />
              </Box>
              <Typography variant="body2" color="text.secondary">
                Penentuan status Pengusaha Kena Pajak untuk kebutuhan PPN.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Detailed Flow */}
      <Paper elevation={2} sx={{ p: 4, mb: 4 }}>
        <Typography variant="h5" fontWeight={600} gutterBottom>
          Alur Detail
        </Typography>

        <Stepper orientation="vertical">
          {steps.map((step, index) => (
            <Step key={index} active={true}>
              <StepLabel icon={step.icon}>
                <Typography variant="h6" fontWeight={600}>
                  {step.label}
                </Typography>
              </StepLabel>
              <StepContent>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {step.description}
                </Typography>
                <List dense>
                  {step.requirements.map((req, reqIndex) => (
                    <ListItem key={reqIndex} sx={{ py: 0.5 }}>
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        <InfoIcon fontSize="small" color="action" />
                      </ListItemIcon>
                      <ListItemText primary={req} />
                    </ListItem>
                  ))}
                </List>
              </StepContent>
            </Step>
          ))}
        </Stepper>
      </Paper>

      {/* PKP vs Non-PKP */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 3, bgcolor: "success.50" }}>
            <Typography variant="h6" fontWeight={600} color="success.main" gutterBottom>
              Pengusaha Kena Pajak (PKP)
            </Typography>
            <Alert severity="success" sx={{ mb: 2 }}>
              Untuk perusahaan besar atau yang sudah terdaftar di DJP
            </Alert>
            <List dense>
              <ListItem>
                <ListItemIcon>
                  <WarningIcon color="warning" fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="NPWP wajib diisi" />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <WarningIcon color="warning" fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="SPPKP wajib diisi" />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <CheckCircleIcon color="success" fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Dapat menerima faktur pajak (PPN)" />
              </ListItem>
            </List>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 3, bgcolor: "info.50" }}>
            <Typography variant="h6" fontWeight={600} color="info.main" gutterBottom>
              Non-PKP
            </Typography>
            <Alert severity="info" sx={{ mb: 2 }}>
              Untuk individu atau usaha kecil
            </Alert>
            <List dense>
              <ListItem>
                <ListItemIcon>
                  <InfoIcon color="info" fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="NPWP opsional (jika ada)" />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <InfoIcon color="disabled" fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="SPPKP tidak perlu diisi" />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <CheckCircleIcon color="info" fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Transaksi tanpa PPN" />
              </ListItem>
            </List>
          </Paper>
        </Grid>
      </Grid>

      {/* Sales Assignment Section */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h5" fontWeight={600} gutterBottom>
          Penugasan Sales
        </Typography>
        <Paper elevation={2} sx={{ p: 3, bgcolor: "warning.50" }}>
          <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
            <PersonIcon color="warning" sx={{ mr: 1 }} />
            <Typography variant="h6" fontWeight={600} color="warning.main">
              assigned_sales_id
            </Typography>
            <Chip label="Tahap Pengembangan" color="warning" size="small" sx={{ ml: "auto" }} />
          </Box>
          <Alert severity="info" sx={{ mb: 2 }}>
            Field ini menunjukkan sales yang bertanggung jawab terhadap pelanggan, namun sistem user
            belum aktif sepenuhnya.
          </Alert>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                Kondisi Saat Ini:
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <InfoIcon color="info" fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary="Dapat dikosongkan (NULL)" />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <InfoIcon color="info" fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary="Dapat diisi dengan ID sementara" />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <InfoIcon color="info" fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary="Contoh: admin-sales, SALES-001" />
                </ListItem>
              </List>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                Rencana Masa Depan:
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircleIcon color="success" fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary="Relasi ke tabel users aktif" />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircleIcon color="success" fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary="Validasi ID sales yang valid" />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircleIcon color="success" fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary="Tracking performa sales" />
                </ListItem>
              </List>
            </Grid>
          </Grid>
        </Paper>
      </Box>
    </Box>
  );
};

export default CustomerBusinessFlow;

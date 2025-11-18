import React, { useState, useEffect } from "react";
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Paper,
  Divider,
  Chip,
} from "@mui/material";
import {
  TrendingUp as TrendingUpIcon,
  Assessment as AssessmentIcon,
  Group as GroupIcon,
  Loop as LoopIcon,
  Speed as SpeedIcon,
  CheckCircle as CheckCircleIcon,
} from "@mui/icons-material";
import { dashboardService, EngineeringDashboardData } from "../../api/dashboardApi";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82CA9D"];

export const EngineeringDashboardPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<EngineeringDashboardData | null>(null);
  const [period, setPeriod] = useState("this_quarter");
  const [assigneeId, setAssigneeId] = useState<string>("");

  useEffect(() => {
    loadDashboard();
  }, [period, assigneeId]);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const response = await dashboardService.getEngineeringDashboard(
        period,
        assigneeId || undefined,
      );
      setDashboardData(response.data);
    } catch (error) {
      console.error("Error loading dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!dashboardData) {
    return (
      <Container>
        <Typography color="error">Failed to load dashboard data</Typography>
      </Container>
    );
  }

  // Prepare chart data
  const statusChartData = dashboardData.statusDistribution.map((item) => ({
    name: item.status,
    value: item.count,
  }));

  const workloadChartData = dashboardData.workloadMetrics.details.map((item) => ({
    name: item.engineerName,
    count: item.count,
  }));

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box mb={4}>
        <Typography variant="h4" fontWeight="700" color="primary.main" gutterBottom>
          📊 Dasbor Kinerja Engineering
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Evaluasi kinerja tim estimasi, identifikasi bottleneck, dan ukur akurasi
        </Typography>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Periode</InputLabel>
              <Select value={period} label="Periode" onChange={(e) => setPeriod(e.target.value)}>
                <MenuItem value="this_month">Bulan Ini</MenuItem>
                <MenuItem value="this_quarter">Kuartal Ini</MenuItem>
                <MenuItem value="this_year">Tahun Ini</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Project Engineer</InputLabel>
              <Select
                value={assigneeId}
                label="Project Engineer"
                onChange={(e) => setAssigneeId(e.target.value)}
              >
                <MenuItem value="">Semua PE</MenuItem>
                {/* TODO: Load dari API */}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Widget 1: Volume & Kecepatan Kerja */}
      <Box mb={4}>
        <Typography variant="h6" fontWeight="600" mb={2} display="flex" alignItems="center" gap={1}>
          <SpeedIcon color="primary" />
          Volume & Kecepatan Kerja
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider" }}>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2}>
                  <Box
                    sx={{
                      bgcolor: "primary.50",
                      borderRadius: 2,
                      p: 1.5,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <TrendingUpIcon color="primary" fontSize="large" />
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Permintaan Masuk
                    </Typography>
                    <Typography variant="h4" fontWeight="700" color="primary.main">
                      {dashboardData.volumeMetrics.requestsIn}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider" }}>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2}>
                  <Box
                    sx={{
                      bgcolor: "success.50",
                      borderRadius: 2,
                      p: 1.5,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <CheckCircleIcon color="success" fontSize="large" />
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Estimasi Selesai
                    </Typography>
                    <Typography variant="h4" fontWeight="700" color="success.main">
                      {dashboardData.volumeMetrics.completedEstimations}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider" }}>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2}>
                  <Box
                    sx={{
                      bgcolor: "warning.50",
                      borderRadius: 2,
                      p: 1.5,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <AssessmentIcon color="warning" fontSize="large" />
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Rata-rata Waktu Pengerjaan
                    </Typography>
                    <Typography variant="h4" fontWeight="700" color="warning.main">
                      {dashboardData.volumeMetrics.avgTurnaroundTime.toFixed(1)}
                      <Typography component="span" variant="body1" ml={0.5}>
                        hari
                      </Typography>
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* Widget 2: Beban Kerja Tim */}
      <Box mb={4}>
        <Typography variant="h6" fontWeight="600" mb={2} display="flex" alignItems="center" gap={1}>
          <GroupIcon color="primary" />
          Beban Kerja Tim (In Progress)
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider" }}>
              <CardContent>
                <Typography variant="subtitle1" fontWeight="600" mb={2}>
                  Distribusi Beban Kerja
                </Typography>
                {dashboardData.workloadMetrics.details.length > 0 ? (
                  <Box>
                    {dashboardData.workloadMetrics.details.map((item, index) => (
                      <Box key={index} mb={2}>
                        <Box display="flex" justifyContent="space-between" mb={0.5}>
                          <Typography variant="body2">{item.engineerName}</Typography>
                          <Chip label={item.count} size="small" color="primary" />
                        </Box>
                        <Divider />
                      </Box>
                    ))}
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary" textAlign="center">
                    Tidak ada estimasi dalam progress
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider" }}>
              <CardContent>
                <Typography variant="subtitle1" fontWeight="600" mb={2}>
                  Grafik Beban Kerja
                </Typography>
                {workloadChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={workloadChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#1976d2" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <Typography variant="body2" color="text.secondary" textAlign="center">
                    Tidak ada data untuk ditampilkan
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* Widget 3: Siklus Revisi */}
      <Box mb={4}>
        <Typography variant="h6" fontWeight="600" mb={2} display="flex" alignItems="center" gap={1}>
          <LoopIcon color="primary" />
          Siklus Revisi
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider" }}>
              <CardContent>
                <Typography variant="body2" color="text.secondary" mb={1}>
                  Tingkat Revisi
                </Typography>
                <Typography variant="h3" fontWeight="700" color="error.main">
                  {dashboardData.revisionMetrics.revisionRate.toFixed(1)}%
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {dashboardData.revisionMetrics.revisionCount} dari{" "}
                  {dashboardData.volumeMetrics.completedEstimations} estimasi membutuhkan revisi
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider" }}>
              <CardContent>
                <Typography variant="subtitle1" fontWeight="600" mb={2}>
                  Distribusi Status Estimasi
                </Typography>
                {statusChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={statusChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {statusChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <Typography variant="body2" color="text.secondary" textAlign="center">
                    Tidak ada data untuk ditampilkan
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* Widget 4: Tingkat Akurasi (Placeholder) */}
      <Box mb={4}>
        <Typography variant="h6" fontWeight="600" mb={2} display="flex" alignItems="center" gap={1}>
          <AssessmentIcon color="primary" />
          Tingkat Akurasi Estimasi
        </Typography>
  <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider" }}>
          <CardContent>
            <Typography variant="body2" color="text.secondary" textAlign="center" py={4}>
              📊 Fitur ini membutuhkan data actual cost dari proyek yang telah selesai.
              <br />
              Akan diimplementasikan setelah integrasi dengan modul project management.
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
};

import React, { useState, useEffect } from "react";
import { Box, Card, CardContent, Typography, Grid, CircularProgress } from "@mui/material";
import {
  Build as BuildIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
} from "@mui/icons-material";
import { servicesService } from "../api/servicesApi";
import { ServicesStats } from "../types/service";
import { useNotification } from "../contexts/NotificationContext";

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  loading?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, loading = false }) => (
  <Card sx={{ height: "100%" }}>
    <CardContent sx={{ p: 3 }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Box>
          <Typography variant="h4" component="div" sx={{ fontWeight: 700, color, mb: 1 }}>
            {loading ? <CircularProgress size={24} /> : value.toLocaleString()}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {title}
          </Typography>
        </Box>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 48,
            height: 48,
            borderRadius: 2,
            bgcolor: `${color}15`,
            color,
          }}
        >
          {icon}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

const ServicesStatsWidget: React.FC = () => {
  const [stats, setStats] = useState<ServicesStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { showError } = useNotification();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await servicesService.getServicesStats();
        // Backend returns { success: boolean, message: string, data: ServicesStats }
        setStats(response.data);
      } catch {
        showError("Gagal memuat statistik services");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [showError]);

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} sm={6} md={3}>
        <StatCard
          title="Total Services"
          value={stats?.total || 0}
          icon={<BuildIcon />}
          color="#2563eb"
          loading={loading}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <StatCard
          title="Active Services"
          value={stats?.active || 0}
          icon={<CheckCircleIcon />}
          color="#10b981"
          loading={loading}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <StatCard
          title="Inactive Services"
          value={stats?.inactive || 0}
          icon={<WarningIcon />}
          color="#f59e0b"
          loading={loading}
        />
      </Grid>
    </Grid>
  );
};

export default ServicesStatsWidget;

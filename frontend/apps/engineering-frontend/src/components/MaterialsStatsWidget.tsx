import React, { useState, useEffect } from "react";
import { Grid, Card, CardContent, Typography, Box, CircularProgress, Alert } from "@mui/material";
import {
  Inventory as TotalIcon,
  CheckCircle as ActiveIcon,
  Warning as EndOfLifeIcon,
  Cancel as DiscontinueIcon,
} from "@mui/icons-material";
import { materialsService } from "../api/materialsApi";
import { MaterialsStats } from "../types/material";

interface StatsCardProps {
  title: string;
  value: number;
  icon: React.ReactElement;
  color: string;
  backgroundColor: string;
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon, color, backgroundColor }) => {
  return (
    <Card sx={{ height: "100%" }}>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="h4" component="div" sx={{ fontWeight: "bold", color }}>
              {value}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {title}
            </Typography>
          </Box>
          <Box
            sx={{
              p: 2,
              borderRadius: "50%",
              backgroundColor,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {React.cloneElement(icon, { sx: { color, fontSize: 32 } })}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

const MaterialsStatsWidget: React.FC = () => {
  const [stats, setStats] = useState<MaterialsStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const statsData = await materialsService.getMaterialsStats();
      setStats(statsData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch statistics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  if (!stats) {
    return null;
  }

  const statsCards = [
    {
      title: "Total Materials",
      value: stats.totalMaterials,
      icon: <TotalIcon />,
      color: "#1976d2",
      backgroundColor: "#e3f2fd",
    },
    {
      title: "Active Materials",
      value: stats.activeMaterials,
      icon: <ActiveIcon />,
      color: "#2e7d32",
      backgroundColor: "#e8f5e8",
    },
    {
      title: "End of Life",
      value: stats.endOfLifeMaterials,
      icon: <EndOfLifeIcon />,
      color: "#ed6c02",
      backgroundColor: "#fff3e0",
    },
    {
      title: "Discontinued",
      value: stats.discontinuedMaterials,
      icon: <DiscontinueIcon />,
      color: "#d32f2f",
      backgroundColor: "#ffebee",
    },
  ];

  return (
    <Grid container spacing={3} sx={{ mb: 3 }}>
      {statsCards.map((card, index) => (
        <Grid item xs={12} sm={6} md={3} key={index}>
          <StatsCard {...card} />
        </Grid>
      ))}
    </Grid>
  );
};

export default MaterialsStatsWidget;

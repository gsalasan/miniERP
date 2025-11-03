import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  LinearProgress,
  Paper,
} from "@mui/material";
import {
  Store as VendorIcon,
  AttachMoney as MoneyIcon,
  ShoppingCart as PurchaseIcon,
  Star as StarIcon,
  TrendingUp as TrendingUpIcon,
  Today as TodayIcon,
} from "@mui/icons-material";
import { vendorsApi } from "../api/vendors";
import { Vendor } from "../types/vendor";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  color,
  subtitle,
}) => {
  return (
    <Card
      sx={{
        height: "100%",
        background: "#FFFFFF",
        border: `1px solid ${color}20`,
        transition: "all 0.3s ease-in-out",
        position: "relative",
        overflow: "hidden",
        boxShadow: "0 2px 8px rgba(6, 16, 58, 0.08)",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: `0 8px 24px ${color}20`,
          border: `1px solid ${color}40`,
        },
        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "3px",
          background: color,
        },
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box flex={1}>
            <Typography
              variant="body2"
              sx={{
                fontWeight: 500,
                mb: 1,
                color: "#6B6E70",
                textTransform: "uppercase",
                fontSize: "0.75rem",
                letterSpacing: "0.5px",
              }}
            >
              {title}
            </Typography>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 700,
                color: "#333333",
                mb: 1,
                fontSize: "2rem",
              }}
            >
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="caption" sx={{ color: "#6B6E70" }}>
                {subtitle}
              </Typography>
            )}
          </Box>
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: "12px",
              background: `${color}15`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: color,
              transition: "transform 0.3s ease",
              "&:hover": {
                transform: "scale(1.1)",
              },
            }}
          >
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

const DashboardPage: React.FC = () => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadVendors = async () => {
      try {
        setLoading(true);
        const data = await vendorsApi.getAllVendors();
        setVendors(data);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("Error loading vendors:", error);
      } finally {
        setLoading(false);
      }
    };

    loadVendors();
  }, []);

  // Calculate statistics
  const totalVendors = vendors.length;
  const preferredVendors = vendors.filter((v) => v.is_preferred).length;

  // Count by classification
  const smallVendors = vendors.filter((v) => v.classification === "SMALL").length;
  const mediumVendors = vendors.filter((v) => v.classification === "MEDIUM").length;
  const largeVendors = vendors.filter((v) => v.classification === "LARGE").length;
  const enterpriseVendors = vendors.filter((v) => v.classification === "ENTERPRISE").length;

  // Get recent vendors
  const recentVendors = [...vendors]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 3);

  const stats = [
    {
      title: "Total Vendors",
      value: totalVendors.toLocaleString("id-ID"),
      icon: <VendorIcon fontSize="large" />,
      color: "#06103A",
      subtitle: `${preferredVendors} preferred`,
    },
    {
      title: "Preferred Vendors",
      value: preferredVendors.toLocaleString("id-ID"),
      icon: <StarIcon fontSize="large" />,
      color: "#C8A870",
      subtitle: "vendor unggulan",
    },
    {
      title: "Purchase Orders",
      value: "0",
      icon: <PurchaseIcon fontSize="large" />,
      color: "#4E88BE",
      subtitle: "bulan ini",
    },
    {
      title: "Total Spend",
      value: "Rp 0",
      icon: <MoneyIcon fontSize="large" />,
      color: "#F0AD4E",
      subtitle: "bulan ini",
    },
  ];

  const recentActivities = recentVendors.map((vendor, index) => ({
    id: vendor.id,
    title: "Vendor ditambahkan",
    description: `${vendor.vendor_name} - ${vendor.classification}`,
    time: new Date(vendor.created_at).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
    avatar: vendor.vendor_name.charAt(0).toUpperCase(),
    color: index === 0 ? "#06103A" : index === 1 ? "#4E88BE" : "#C8A870",
  }));

  const vendorDistribution = [
    {
      name: "Small Vendors",
      current: totalVendors > 0 ? Math.round((smallVendors / totalVendors) * 100) : 0,
      target: 100,
      color: "#06103A",
    },
    {
      name: "Medium Vendors",
      current: totalVendors > 0 ? Math.round((mediumVendors / totalVendors) * 100) : 0,
      target: 100,
      color: "#4E88BE",
    },
    {
      name: "Large & Enterprise",
      current:
        totalVendors > 0
          ? Math.round(((largeVendors + enterpriseVendors) / totalVendors) * 100)
          : 0,
      target: 100,
      color: "#C8A870",
    },
  ];

  return (
    <Box>
      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <Typography variant="h6" color="text.secondary">
            Memuat data...
          </Typography>
        </Box>
      ) : (
        <>
          {/* Hero Header */}
          <Paper
            elevation={0}
            sx={{
              background: "linear-gradient(135deg, #06103A 0%, #4E88BE 100%)",
              color: "white",
              p: 4,
              mb: 4,
              borderRadius: 3,
              position: "relative",
              overflow: "hidden",
              boxShadow: "0 4px 20px rgba(6, 16, 58, 0.15)",
              "&::before": {
                content: '""',
                position: "absolute",
                top: 0,
                right: 0,
                width: "200px",
                height: "200px",
                background: "rgba(200, 168, 112, 0.1)",
                borderRadius: "50%",
                transform: "translate(60px, -100px)",
              },
            }}
          >
            <Box position="relative" zIndex={1}>
              <Typography variant="h3" sx={{ mb: 1, fontWeight: 700 }}>
                Dashboard Procurement ✨
              </Typography>
              <Typography variant="h6" sx={{ mb: 2, opacity: 0.9 }}>
                Selamat datang di sistem Procurement Management miniERP
              </Typography>
              <Box display="flex" alignItems="center" gap={1}>
                <TodayIcon fontSize="small" />
                <Typography variant="body1">
                  {new Date().toLocaleDateString("id-ID", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </Typography>
              </Box>
            </Box>
          </Paper>

          {/* Stats Grid */}
          <Grid container spacing={3} mb={4}>
            {stats.map((stat, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <StatCard
                  title={stat.title}
                  value={stat.value}
                  icon={stat.icon}
                  color={stat.color}
                  subtitle={stat.subtitle}
                />
              </Grid>
            ))}
          </Grid>

          {/* Main Content */}
          <Grid container spacing={3}>
            {/* Recent Activities */}
            <Grid item xs={12} md={8}>
              <Card
                sx={{
                  height: "100%",
                  backgroundColor: "#FFFFFF",
                  boxShadow: "0 2px 8px rgba(6, 16, 58, 0.08)",
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
                    Recent Activities
                  </Typography>
                  {recentActivities.length > 0 ? (
                    <List>
                      {recentActivities.map((activity) => (
                        <ListItem
                          key={activity.id}
                          sx={{
                            mb: 1,
                            borderRadius: 2,
                            transition: "background-color 0.2s",
                            "&:hover": {
                              backgroundColor: "rgba(0,0,0,0.02)",
                            },
                          }}
                        >
                          <ListItemAvatar>
                            <Avatar
                              sx={{
                                backgroundColor: activity.color,
                                fontWeight: 600,
                              }}
                            >
                              {activity.avatar}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={
                              <Typography variant="subtitle1" fontWeight={600}>
                                {activity.title}
                              </Typography>
                            }
                            secondary={
                              <React.Fragment>
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                  component="span"
                                  display="block"
                                >
                                  {activity.description}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  color="text.disabled"
                                  component="span"
                                  display="block"
                                >
                                  {activity.time}
                                </Typography>
                              </React.Fragment>
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Belum ada aktivitas
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Sidebar */}
            <Grid item xs={12} md={4}>
              <Card
                sx={{
                  backgroundColor: "#FFFFFF",
                  boxShadow: "0 2px 8px rgba(6, 16, 58, 0.08)",
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                    Vendor Distribution
                  </Typography>
                  <Box display="flex" flexDirection="column" gap={3}>
                    {vendorDistribution.map((item, index) => (
                      <Box key={index}>
                        <Box display="flex" justifyContent="space-between" mb={1}>
                          <Typography variant="subtitle2" fontWeight={600}>
                            {item.name}
                          </Typography>
                          <Typography variant="body2" color={item.color} fontWeight={600}>
                            {item.current}%
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={item.current}
                          sx={{
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: `${item.color}20`,
                            "& .MuiLinearProgress-bar": {
                              borderRadius: 4,
                              backgroundColor: item.color,
                            },
                          }}
                        />
                      </Box>
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </>
      )}
    </Box>
  );
};

export default DashboardPage;
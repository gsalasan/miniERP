import React from "react";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
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
  People as PeopleIcon,
  TrendingUp as TrendingUpIcon,
  Assignment as AssignmentIcon,
  AttachMoney as MoneyIcon,
  Add as AddIcon,
  Visibility as VisibilityIcon,
  Today as TodayIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
  trend?: "up" | "down";
  percentage?: string;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  color,
  subtitle,
  trend,
  percentage,
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
            <Box display="flex" alignItems="center" gap={1}>
              {trend && percentage && (
                <Chip
                  icon={trend === "up" ? <ArrowUpwardIcon /> : <ArrowDownwardIcon />}
                  label={percentage}
                  size="small"
                  sx={
                    trend === "up"
                      ? {
                          backgroundColor: "#5CB85C",
                          color: "white",
                          fontWeight: 600,
                          fontSize: "0.7rem",
                        }
                      : {
                          backgroundColor: "#D9534F",
                          color: "white",
                          fontWeight: 600,
                          fontSize: "0.7rem",
                        }
                  }
                />
              )}
              {subtitle && (
                <Typography variant="caption" sx={{ color: "#6B6E70" }}>
                  {subtitle}
                </Typography>
              )}
            </Box>
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

const HomePage: React.FC = () => {
  const navigate = useNavigate();

  const stats = [
    {
      title: "Total Customers",
      value: "1,234",
      icon: <PeopleIcon fontSize="large" />,
      color: "#06103A", // Primary Dark
      subtitle: "dari bulan lalu",
      trend: "up" as const,
      percentage: "+12%",
    },
    {
      title: "Active Pipeline",
      value: "456",
      icon: <TrendingUpIcon fontSize="large" />,
      color: "#4E88BE", // Primary Light
      subtitle: "leads baru",
      trend: "up" as const,
      percentage: "+18%",
    },
    {
      title: "Sales Orders",
      value: "89",
      icon: <AssignmentIcon fontSize="large" />,
      color: "#F0AD4E", // Warning
      subtitle: "bulan ini",
      trend: "down" as const,
      percentage: "-3%",
    },
    {
      title: "Revenue",
      value: "Rp 2.1M",
      icon: <MoneyIcon fontSize="large" />,
      color: "#C8A870", // Accent Gold
      subtitle: "vs target",
      trend: "up" as const,
      percentage: "+8.2%",
    },
  ];

  const recentActivities = [
    {
      id: 1,
      type: "customer",
      title: "Customer baru ditambahkan",
      description: "PT Maju Mundur - Jakarta",
      time: "2 jam yang lalu",
      avatar: "M",
      color: "#06103A", // Primary Dark
    },
    {
      id: 2,
      type: "call",
      title: "Follow up call",
      description: "Hubungi PT Berkah Jaya untuk proposal",
      time: "4 jam yang lalu",
      avatar: "B",
      color: "#4E88BE", // Primary Light
    },
    {
      id: 3,
      type: "meeting",
      title: "Meeting terjadwal",
      description: "Presentasi produk dengan CV Sejahtera",
      time: "1 hari yang lalu",
      avatar: "S",
      color: "#C8A870", // Accent Gold
    },
  ];

  const quickActions = [
    {
      title: "Tambah Customer",
      description: "Buat customer baru",
      icon: <AddIcon />,
      color: "#C8A870", // Accent Gold
      action: () => navigate("/customers/new"),
    },
    {
      title: "Lihat Customers",
      description: "Kelola semua customer",
      icon: <VisibilityIcon />,
      color: "#06103A", // Primary Dark
      action: () => navigate("/customers"),
    },
    {
      title: "Pipeline",
      description: "Kelola sales pipeline",
      icon: <TrendingUpIcon />,
      color: "#4E88BE", // Primary Light
      action: () => navigate("/pipeline"),
    },
  ];

  const salesProgress = [
    { name: "Target Bulanan", current: 75, target: 100, color: "#06103A" }, // Primary Dark
    { name: "Leads Conversion", current: 45, target: 60, color: "#4E88BE" }, // Primary Light
    { name: "Customer Retention", current: 88, target: 90, color: "#C8A870" }, // Accent Gold
  ];

  return (
    <Box>
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
            Dashboard CRM ✨
          </Typography>
          <Typography variant="h6" sx={{ mb: 2, opacity: 0.9 }}>
            Selamat datang di sistem Customer Relationship Management miniERP
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
              trend={stat.trend}
              percentage={stat.percentage}
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
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            {activity.description}
                          </Typography>
                          <Typography variant="caption" color="text.disabled">
                            {activity.time}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} md={4}>
          <Box display="flex" flexDirection="column" gap={3}>
            {/* Quick Actions */}
            <Card
              sx={{
                backgroundColor: "#FFFFFF",
                boxShadow: "0 2px 8px rgba(6, 16, 58, 0.08)",
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                  Quick Actions
                </Typography>
                <Box display="flex" flexDirection="column" gap={2}>
                  {quickActions.map((action, index) => (
                    <Button
                      key={index}
                      variant="outlined"
                      startIcon={action.icon}
                      onClick={action.action}
                      fullWidth
                      sx={{
                        p: 2,
                        justifyContent: "flex-start",
                        borderColor: `${action.color}30`,
                        color: action.color,
                        "&:hover": {
                          borderColor: action.color,
                          backgroundColor: `${action.color}08`,
                        },
                      }}
                    >
                      <Box textAlign="left" ml={1}>
                        <Typography variant="subtitle2" fontWeight={600}>
                          {action.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {action.description}
                        </Typography>
                      </Box>
                    </Button>
                  ))}
                </Box>
              </CardContent>
            </Card>

            {/* Sales Progress */}
            <Card
              sx={{
                backgroundColor: "#FFFFFF",
                boxShadow: "0 2px 8px rgba(6, 16, 58, 0.08)",
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                  Sales Progress
                </Typography>
                <Box display="flex" flexDirection="column" gap={3}>
                  {salesProgress.map((item, index) => (
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
                      <Typography variant="caption" color="text.secondary" mt={0.5}>
                        Target: {item.target}%
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default HomePage;

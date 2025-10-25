import React from "react";
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActionArea,
  Paper,
  Chip,
  Avatar,
} from "@mui/material";
import {
  Inventory as InventoryIcon,
  Build as BuildIcon,
  Engineering as EngineeringIcon,
  Assessment as ReportsIcon,
  TrendingUp as TrendingUpIcon,
  Schedule as ScheduleIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

const quickAccessItems = [
  {
    title: "Materials Database",
    description: "Manage engineering materials, parts, and components",
    icon: <InventoryIcon sx={{ fontSize: 40 }} />,
    path: "/items/materials",
    color: "#1976d2",
    stats: "1,247 items",
  },
  {
    title: "Services Catalog",
    description: "Engineering services and maintenance procedures",
    icon: <BuildIcon sx={{ fontSize: 40 }} />,
    path: "/items/services",
    color: "#388e3c",
    stats: "89 services",
  },
  {
    title: "Engineering Reports",
    description: "Technical reports and documentation",
    icon: <ReportsIcon sx={{ fontSize: 40 }} />,
    path: "/reports",
    color: "#f57c00",
    stats: "156 reports",
  },
  {
    title: "Project Management",
    description: "Track engineering projects and milestones",
    icon: <EngineeringIcon sx={{ fontSize: 40 }} />,
    path: "/projects",
    color: "#7b1fa2",
    stats: "23 active",
  },
];

const statsCards = [
  {
    title: "Total Materials",
    value: "1,247",
    change: "+12%",
    changeType: "positive",
    icon: <InventoryIcon />,
  },
  {
    title: "Active Projects",
    value: "23",
    change: "+3",
    changeType: "positive",
    icon: <EngineeringIcon />,
  },
  {
    title: "Pending Reviews",
    value: "8",
    change: "-2",
    changeType: "positive",
    icon: <ScheduleIcon />,
  },
  {
    title: "Cost Efficiency",
    value: "94.2%",
    change: "+2.1%",
    changeType: "positive",
    icon: <TrendingUpIcon />,
  },
];

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          Engineering Dashboard
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Welcome to miniERP Engineering Module
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {statsCards.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Paper sx={{ p: 2 }}>
              <Box display="flex" alignItems="center" mb={1}>
                <Avatar
                  sx={{
                    bgcolor: "primary.main",
                    width: 48,
                    height: 48,
                    mr: 2,
                  }}
                >
                  {stat.icon}
                </Avatar>
                <Box flexGrow={1}>
                  <Typography variant="h4" component="div" fontWeight="bold">
                    {stat.value}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {stat.title}
                  </Typography>
                </Box>
              </Box>
              <Chip
                label={stat.change}
                color={stat.changeType === "positive" ? "success" : "error"}
                size="small"
                variant="outlined"
              />
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Quick Access */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h2" gutterBottom>
          Quick Access
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Access frequently used modules and features
        </Typography>

        <Grid container spacing={3}>
          {quickAccessItems.map((item, index) => (
            <Grid item xs={12} sm={6} md={6} lg={3} key={index}>
              <Card
                sx={{
                  height: "100%",
                  transition: "all 0.3s ease",
                  "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow: 4,
                  },
                }}
              >
                <CardActionArea sx={{ height: "100%", p: 3 }} onClick={() => navigate(item.path)}>
                  <CardContent sx={{ textAlign: "center", p: 0 }}>
                    <Avatar
                      sx={{
                        bgcolor: item.color,
                        width: 64,
                        height: 64,
                        mx: "auto",
                        mb: 2,
                      }}
                    >
                      {item.icon}
                    </Avatar>
                    <Typography variant="h6" component="h3" gutterBottom>
                      {item.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {item.description}
                    </Typography>
                    <Chip label={item.stats} size="small" color="primary" variant="outlined" />
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Recent Activity */}
      <Box>
        <Typography variant="h4" component="h2" gutterBottom>
          Recent Activity
        </Typography>
        <Paper sx={{ p: 3 }}>
          <Typography variant="body1" color="text.secondary" textAlign="center">
            Recent activity and notifications will appear here
          </Typography>
        </Paper>
      </Box>
    </Container>
  );
};

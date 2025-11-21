import React, { useState, useEffect } from "react";
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
} from "@mui/material";
import { SelectChangeEvent } from "@mui/material/Select";
import {
  Inventory as InventoryIcon,
  Build as BuildIcon,
  Engineering as EngineeringIcon,
  Assessment as ReportsIcon,
  TrendingUp as TrendingUpIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  Assessment as AssessmentIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { dashboardService } from "../api/dashboardApi";
import { identityService } from "../api/identityApi";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { useTheme } from "@mui/material/styles";

// Quick access items and chart colors will be created using theme inside component

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

// COLORS will be derived from theme inside component

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const PRIMARY = theme.palette.primary.main;
  const quickAccessItems = [
    {
      title: "Estimation Queue",
      description: "View and manage pending cost estimation requests",
      icon: <ScheduleIcon sx={{ fontSize: 40 }} />,
      path: "/estimations/queue",
      color: PRIMARY,
      stats: "View Queue",
    },
    {
      title: "Materials Database",
      description: "Browse materials catalog for cost estimation",
      icon: <InventoryIcon sx={{ fontSize: 40 }} />,
      path: "/items/materials",
      color: PRIMARY,
      stats: "Browse Items",
    },
    {
      title: "Services Catalog",
      description: "Explore services for project cost calculation",
      icon: <BuildIcon sx={{ fontSize: 40 }} />,
      path: "/items/services",
      color: PRIMARY,
      stats: "View Services",
    },
    {
      title: "All Estimations",
      description: "View complete estimation history and reports",
      icon: <ReportsIcon sx={{ fontSize: 40 }} />,
      path: "/estimations",
      color: PRIMARY,
      stats: "View All",
    },
  ];
  const COLORS = [PRIMARY, PRIMARY, PRIMARY, PRIMARY, PRIMARY, PRIMARY];
  const [loading, setLoading] = useState(false);
  const [dashboardData, setDashboardData] = useState<{
    volumeMetrics?: {
      requestsIn: number;
      completedEstimations: number;
      avgTurnaroundTime: number;
    };
    revisionMetrics?: {
      revisionRate: number;
      revisionCount: number;
    };
    workloadMetrics?: {
      details: Array<{ engineerName: string; count: number }>;
    };
    statusDistribution?: Array<{ status: string; count: number }>;
  } | null>(null);
  const [period, setPeriod] = useState("this_month");
  const [assigneeId, setAssigneeId] = useState("");
  const [userName, setUserName] = useState<string>("");

  // Load dashboard data when filters change
  useEffect(() => {
    loadDashboardData();
  }, [period, assigneeId]);

  // Load user only once on mount
  useEffect(() => {
    loadUserInfo();
  }, []);

  const loadUserInfo = async () => {
    try {
      // Try to get user from backend first
      const profile = await identityService.getCurrentUser();
      console.log("👤 Profile from API:", profile);
      
      const name = 
        profile.employee?.full_name || 
        profile.name || 
        profile.username || 
        profile.email?.split("@")[0] || 
        "Engineer";
      
      console.log("✅ User name set to:", name);
      setUserName(name);
    } catch (error) {
      console.error("❌ Failed to load user from API:", error);
      // Fallback to localStorage
      try {
        const userStr = localStorage.getItem("user");
        if (userStr) {
          const user = JSON.parse(userStr);
          console.log("👤 User from localStorage:", user);
          
          const name =
            user.employee?.full_name || 
            user.name || 
            user.full_name ||
            user.email?.split("@")[0] || 
            "Engineer";
          
          console.log("✅ User name set from localStorage:", name);
          setUserName(name);
        }
      } catch (e) {
        console.error("❌ Failed to parse localStorage user:", e);
      }
    }
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const response = await dashboardService.getEngineeringDashboard(
        period,
        assigneeId || undefined,
      );
      setDashboardData(response.data);
    } catch {
      // Silent fail - keep null state
    } finally {
      setLoading(false);
    }
  };

  // Dynamic stats based on real data
  const dynamicStats =
    dashboardData && dashboardData.volumeMetrics
      ? [
          {
            title: "Estimation Requests",
            value: dashboardData.volumeMetrics.requestsIn.toString(),
            change: "This period",
            changeType: "positive",
            icon: <AssessmentIcon />,
          },
          {
            title: "Completed Estimations",
            value: dashboardData.volumeMetrics.completedEstimations.toString(),
            change: "Approved",
            changeType: "positive",
            icon: <CheckCircleIcon />,
          },
          {
            title: "Avg Processing Time",
            value: `${dashboardData.volumeMetrics.avgTurnaroundTime.toFixed(1)} days`,
            change: "Target: ≤ 5 days",
            changeType: dashboardData.volumeMetrics.avgTurnaroundTime <= 5 ? "positive" : "warning",
            icon: <TrendingUpIcon />,
          },
          {
            title: "Revision Rate",
            value: `${(dashboardData.revisionMetrics?.revisionRate ?? 0).toFixed(1)}%`,
            change: `${dashboardData.revisionMetrics?.revisionCount ?? 0} revisions`,
            changeType:
              (dashboardData.revisionMetrics?.revisionRate ?? 0) < 20 ? "positive" : "warning",
            icon: <ScheduleIcon />,
          },
        ]
      : statsCards;

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header Section */}
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="subtitle2"
          color="primary"
          fontWeight={600}
          sx={{ letterSpacing: 1.2, textTransform: "none" }}
        >
          Engineering Division
        </Typography>
        <Typography variant="h4" component="h1" fontWeight={700} gutterBottom sx={{ mt: 1 }}>
          Cost Estimation
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 800, lineHeight: 1.7 }}>
          {userName ? (
            <>
              Welcome back, <strong>{userName}</strong>. Monitor and manage cost estimation
              activities, team performance metrics, and project analytics in real-time.
            </>
          ) : (
            "Monitor and manage cost estimation activities, team performance metrics, and project analytics in real-time."
          )}
        </Typography>
      </Box>

      {/* Filters Section */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 4,
          bgcolor: "grey.50",
          borderRadius: 2,
          border: "1px solid",
          borderColor: "divider",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 2,
          }}
        >
          <Typography variant="subtitle1" fontWeight="600" color="text.primary">
            Filter Analytics
          </Typography>
          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel>Time Period</InputLabel>
              <Select
                value={period}
                label="Time Period"
                onChange={(e: SelectChangeEvent) => setPeriod(e.target.value)}
              >
                <MenuItem value="this_month">This Month</MenuItem>
                <MenuItem value="this_quarter">This Quarter</MenuItem>
                <MenuItem value="this_year">This Year</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel>Engineer</InputLabel>
              <Select
                value={assigneeId}
                label="Engineer"
                onChange={(e: SelectChangeEvent) => setAssigneeId(e.target.value)}
              >
                <MenuItem value="">All Engineers</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Box>
      </Paper>

      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress size={60} />
        </Box>
      ) : (
        <>
          {/* Key Metrics Cards */}
          <Box sx={{ mb: 5 }}>
            <Typography variant="h5" fontWeight="600" gutterBottom>
              Performance Metrics
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Real-time indicators for cost estimation activities
            </Typography>
            <Grid container spacing={3}>
              {dynamicStats.map((stat, index) => (
                <Grid item xs={12} sm={6} lg={3} key={index}>
                  <Card
                    elevation={0}
                    sx={{
                      height: "100%",
                      border: "1px solid",
                      borderColor: "divider",
                      transition: "all 0.3s",
                      "&:hover": {
                        boxShadow: 3,
                        transform: "translateY(-4px)",
                      },
                    }}
                  >
                    <CardContent sx={{ p: 3 }}>
                      <Box
                        display="flex"
                        alignItems="flex-start"
                        justifyContent="space-between"
                        mb={2}
                      >
                        <Avatar
                          sx={{
                            bgcolor: PRIMARY,
                            width: 56,
                            height: 56,
                          }}
                        >
                          {stat.icon}
                        </Avatar>
                        <Chip
                          label={stat.change}
                          sx={{
                            bgcolor: PRIMARY,
                            color: theme.palette.primary.contrastText,
                            fontWeight: 600,
                          }}
                          size="small"
                        />
                      </Box>
                      <Typography variant="h3" component="div" fontWeight="700" gutterBottom>
                        {stat.value}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" fontWeight="500">
                        {stat.title}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>

          {/* Analytics Section */}
          {dashboardData && dashboardData.workloadMetrics && dashboardData.statusDistribution && (
            <Box sx={{ mb: 5 }}>
              <Typography variant="h5" fontWeight="600" gutterBottom>
                Team Analytics
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Workload distribution and status tracking across engineering team
              </Typography>
              <Grid container spacing={3}>
                {/* Team Workload */}
                <Grid item xs={12} lg={7}>
                  <Card
                    elevation={0}
                    sx={{ height: "100%", border: "1px solid", borderColor: "divider" }}
                  >
                    <CardContent sx={{ p: 3 }}>
                      <Typography variant="h6" fontWeight="600" gutterBottom>
                        Workload by Engineer
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        Active cost estimation tasks per engineer
                      </Typography>

                      {dashboardData.workloadMetrics.details.length > 0 ? (
                        <>
                          <TableContainer sx={{ mb: 3 }}>
                            <Table size="small">
                              <TableHead>
                                <TableRow>
                                  <TableCell sx={{ fontWeight: 600 }}>Engineer</TableCell>
                                  <TableCell align="right" sx={{ fontWeight: 600 }}>
                                    Active Tasks
                                  </TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {dashboardData.workloadMetrics.details.map(
                                  (
                                    engineer: { engineerName: string; count: number },
                                    idx: number,
                                  ) => (
                                    <TableRow key={idx} hover>
                                      <TableCell>{engineer.engineerName}</TableCell>
                                      <TableCell align="right">
                                        <Chip
                                          label={engineer.count}
                                          size="small"
                                          sx={{
                                            bgcolor: PRIMARY,
                                            color: "white",
                                            fontWeight: 600,
                                          }}
                                        />
                                      </TableCell>
                                    </TableRow>
                                  ),
                                )}
                              </TableBody>
                            </Table>
                          </TableContainer>
                          <Box sx={{ height: 300 }}>
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={dashboardData.workloadMetrics.details}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis
                                  dataKey="engineerName"
                                  angle={-45}
                                  textAnchor="end"
                                  height={100}
                                  tick={{ fontSize: 12 }}
                                />
                                <YAxis tick={{ fontSize: 12 }} />
                                <Tooltip
                                  contentStyle={{
                                    borderRadius: 8,
                                    border: "1px solid #e0e0e0",
                                  }}
                                />
                                <Bar dataKey="count" fill={PRIMARY} radius={[8, 8, 0, 0]} />
                              </BarChart>
                            </ResponsiveContainer>
                          </Box>
                        </>
                      ) : (
                        <Box
                          sx={{
                            py: 8,
                            textAlign: "center",
                            bgcolor: "grey.50",
                            borderRadius: 2,
                          }}
                        >
                          <Typography variant="body1" color="text.secondary">
                            No active workload data available
                          </Typography>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Grid>

                {/* Status Distribution */}
                <Grid item xs={12} lg={5}>
                  <Card
                    elevation={0}
                    sx={{ height: "100%", border: "1px solid", borderColor: "divider" }}
                  >
                    <CardContent sx={{ p: 3 }}>
                      <Typography variant="h6" fontWeight="600" gutterBottom>
                        Estimation Status
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        Cost estimation workflow distribution
                      </Typography>

                      {dashboardData.statusDistribution.length > 0 ? (
                        <Box
                          sx={{
                            height: 450,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={dashboardData.statusDistribution}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={(entry) => `${entry.status}: ${entry.count}`}
                                outerRadius={120}
                                fill="#8884d8"
                                dataKey="count"
                              >
                                {dashboardData.statusDistribution.map(
                                  (_entry: { status: string; count: number }, index: number) => (
                                    <Cell
                                      key={`cell-${index}`}
                                      fill={COLORS[index % COLORS.length]}
                                    />
                                  ),
                                )}
                              </Pie>
                              <Tooltip
                                contentStyle={{
                                  borderRadius: 8,
                                  border: "1px solid #e0e0e0",
                                }}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        </Box>
                      ) : (
                        <Box
                          sx={{
                            py: 8,
                            textAlign: "center",
                            bgcolor: "grey.50",
                            borderRadius: 2,
                          }}
                        >
                          <Typography variant="body1" color="text.secondary">
                            No status data available
                          </Typography>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          )}

          {/* Quick Access Section */}
          <Box>
            <Typography variant="h5" fontWeight="600" gutterBottom>
              Quick Access
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Navigate to frequently used cost estimation tools and features
            </Typography>
            <Grid container spacing={3}>
              {quickAccessItems.map((item, index) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
                  <Card
                    elevation={0}
                    sx={{
                      height: "100%",
                      border: "1px solid",
                      borderColor: "divider",
                      transition: "all 0.3s ease",
                      "&:hover": {
                        transform: "translateY(-8px)",
                        boxShadow: 4,
                        borderColor: item.color,
                      },
                    }}
                  >
                    <CardActionArea
                      sx={{ height: "100%", p: 3 }}
                      onClick={() => navigate(item.path)}
                    >
                      <CardContent sx={{ textAlign: "center", p: 0 }}>
                        <Avatar
                          sx={{
                            bgcolor: item.color,
                            width: 72,
                            height: 72,
                            mx: "auto",
                            mb: 2,
                          }}
                        >
                          {item.icon}
                        </Avatar>
                        <Typography variant="h6" component="h3" gutterBottom fontWeight="600">
                          {item.title}
                        </Typography>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mb: 2, minHeight: 40 }}
                        >
                          {item.description}
                        </Typography>
                        <Chip
                          label={item.stats}
                          size="small"
                          sx={{ bgcolor: item.color, color: "white" }}
                        />
                      </CardContent>
                    </CardActionArea>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        </>
      )}
    </Container>
  );
};

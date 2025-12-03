import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  Typography,
  Divider,
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
  CircularProgress,
  Stack,
  Paper,
  Alert,
  Badge,
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
  NotificationsActive as NotificationIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { customersApi } from "../api/customers";
import { dashboardApi } from "../api/dashboard";
import IncentiveSimulationCard from "../components/dashboard/IncentiveSimulationCard";
import { Customer } from "../types/customer";
import { useAuth } from "../contexts/AuthContext";
import { config } from "../config";

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
  const { user, token } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [pendingDiscounts, setPendingDiscounts] = useState<any[]>([]);

  // Load customers data
  useEffect(() => {
    const loadCustomers = async () => {
      try {
        setLoading(true);
        const data = await customersApi.getAllCustomers();
        setCustomers(data);
        // also load dashboard analytics (best-effort)
        try {
          const db = await dashboardApi.getSalesDashboard();
          setDashboardData(db.data || db);
        } catch (e) {
          console.warn('Failed to load dashboard analytics', e);
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("Error loading customers:", error);
      } finally {
        setLoading(false);
      }
    };

    loadCustomers();
  }, []);

  // Load pending discount approvals for CEO/SALES_MANAGER
  useEffect(() => {
    const loadPendingDiscounts = async () => {
      if (!user || !token) return;
      
      const isCEO = user.roles?.includes('CEO');
      const isSalesManager = user.roles?.includes('SALES_MANAGER');
      
      if (!isCEO && !isSalesManager) return;

      try {
        const response = await fetch(
          `${config.ENGINEERING_SERVICE_URL}/estimations?status=DISCOUNT_REQUESTED`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          const result = await response.json();
          const estimations = result.data || result || [];
          setPendingDiscounts(estimations);
        }
      } catch (error) {
        console.error('Failed to load pending discount approvals:', error);
      }
    };

    loadPendingDiscounts();
  }, [user, token]);

  // Calculate statistics from real data
  const totalCustomers = customers.length;
  const activeCustomers = customers.filter((c) => c.status === "ACTIVE").length;
  const inactiveCustomers = customers.filter((c) => c.status === "INACTIVE").length;

  // Calculate total contacts
  const totalContacts = customers.reduce(
    (sum, customer) => sum + (customer.customer_contacts?.length || 0),
    0,
  );

  const formatCurrencyNoDecimals = (value: number | null | undefined) => {
    if (value == null) return '-';
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0, minimumFractionDigits: 0 }).format(Number(value));
  };

  // Get recent customers (last 3 added)
  const recentCustomers = [...customers]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3);

  const stats = [
    {
      title: "Total Customers",
      value: totalCustomers.toLocaleString("id-ID"),
      icon: <PeopleIcon fontSize="large" />,
      color: "#06103A", // Primary Dark
      subtitle: `${activeCustomers} active`,
      trend: "up" as const,
      percentage:
        activeCustomers > 0 ? `${Math.round((activeCustomers / totalCustomers) * 100)}%` : "0%",
    },
    {
      title: "Sales Orders",
      value: dashboardData?.summary?.total_sales_orders != null ? String(dashboardData.summary.total_sales_orders) : "0",
      icon: <AssignmentIcon fontSize="large" />,
      color: "#F0AD4E", // Warning
      subtitle: "bulan ini",
      trend: "down" as const,
      percentage: "0%",
    },
    {
      title: "Total Kontak",
      value: totalContacts.toLocaleString("id-ID"),
      icon: <MoneyIcon fontSize="large" />,
      color: "#C8A870", // Accent Gold
      subtitle: "kontak customer",
      trend: totalContacts > 0 ? ("up" as const) : ("down" as const),
      percentage: `${totalContacts}`,
    },
  ];

  const recentActivities = recentCustomers.map((customer, index) => ({
    id: customer.id,
    type: "customer",
    title: "Customer ditambahkan",
    description: `${customer.customer_name} - ${customer.city}`,
    time: new Date(customer.createdAt).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
    avatar: customer.customer_name.charAt(0).toUpperCase(),
    color: index === 0 ? "#06103A" : index === 1 ? "#4E88BE" : "#C8A870",
  }));

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
    {
      name: "Active Customers",
      current: totalCustomers > 0 ? Math.round((activeCustomers / totalCustomers) * 100) : 0,
      target: 100,
      color: "#06103A",
    },
    {
      name: "Inactive Rate",
      current: totalCustomers > 0 ? Math.round((inactiveCustomers / totalCustomers) * 100) : 0,
      target: 100,
      color: "#4E88BE",
    },
    {
      name: "Customer Retention",
      current:
        totalCustomers > 0
          ? Math.round(((totalCustomers - inactiveCustomers) / totalCustomers) * 100)
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

          {/* Discount Approval Notification */}
          {pendingDiscounts.length > 0 && (user?.roles?.includes('CEO') || user?.roles?.includes('SALES_MANAGER')) && (
            <Alert 
              severity="warning" 
              icon={<NotificationIcon />}
              sx={{ 
                mb: 3,
                boxShadow: '0 4px 12px rgba(240, 173, 78, 0.2)',
                border: '1px solid #F0AD4E40',
              }}
              action={
                <Button 
                  color="inherit" 
                  size="small" 
                  onClick={() => navigate('/pipeline')}
                  sx={{ fontWeight: 600 }}
                >
                  Lihat Detail
                </Button>
              }
            >
              <Typography variant="body1" sx={{ fontWeight: 600, mb: 0.5 }}>
                <Badge badgeContent={pendingDiscounts.length} color="error" sx={{ mr: 2 }}>
                  Permintaan Approval Diskon
                </Badge>
              </Typography>
              <Typography variant="body2">
                Ada {pendingDiscounts.length} estimasi yang memerlukan approval diskon dari Anda.
                Klik "Lihat Detail" untuk approve atau reject.
              </Typography>
            </Alert>
          )}

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

          {/* Analytic Widgets: Left column stacks Target vs Actual above Sales Funnel; Right column is Activities sidebar */}
          <Grid container spacing={3} mb={4}>
            {/* Left column: Target then Funnel (full width now that Activities removed) */}
            <Grid item xs={12} md={12}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Card sx={{ height: '100%', borderRadius: 2, boxShadow: '0 6px 18px rgba(6,16,58,0.08)' }}>
                    <CardContent>
                      <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>Target vs Actual</Typography>
                      {dashboardData ? (
                        <Stack direction="column" spacing={2}>
                          <Box display="flex" gap={2} alignItems="center">
                            <Box sx={{ width: 110, height: 110, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                                <CircularProgress
                                  variant="determinate"
                                  value={Math.min(100, dashboardData.target_vs_actual?.percent ?? 0)}
                                  size={110}
                                  thickness={6}
                                  sx={{ color: '#4E88BE', transition: 'all 600ms ease' }}
                                />
                                <Box
                                  sx={{
                                    top: 0,
                                    left: 0,
                                    bottom: 0,
                                    right: 0,
                                    position: 'absolute',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                  }}
                                >
                                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                                    {`${Math.round(dashboardData.target_vs_actual?.percent ?? 0)}%`}
                                  </Typography>
                                </Box>
                              </Box>
                            </Box>

                            <Box sx={{ flex: 1 }}>
                              <Typography variant="subtitle2" color="text.secondary">Target</Typography>
                              <Typography variant="h6" sx={{ fontWeight: 700 }}>{dashboardData.summary?.total_sales_orders ? `${dashboardData.summary.total_sales_orders} orders` : '-'}</Typography>
                              <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 1 }}>Actual Revenue</Typography>
                              <Typography variant="h6" sx={{ fontWeight: 700 }}>{dashboardData.target_vs_actual?.actual != null ? formatCurrencyNoDecimals(dashboardData.target_vs_actual.actual) : '-'}</Typography>
                              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>{dashboardData.target_vs_actual?.note ?? ''}</Typography>
                            </Box>
                          </Box>

                          <Box sx={{ width: '100%' }}>
                            <LinearProgress variant="determinate" value={Math.min(100, dashboardData.target_vs_actual?.percent ?? 0)} sx={{ height: 10, borderRadius: 6 }} />
                          </Box>

                          {/* Incentive simulation widget placed under Target vs Actual */}
                          <IncentiveSimulationCard />
                        </Stack>
                      ) : (
                        <Typography variant="body2">Analitik belum tersedia</Typography>
                      )}
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12}>
                  <Card sx={{ height: '100%', borderRadius: 2, boxShadow: '0 6px 18px rgba(6,16,58,0.08)' }}>
                    <CardContent>
                      <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>Sales Funnel</Typography>
                      {dashboardData?.funnel && dashboardData.funnel.length > 0 ? (
                        <Box>
                          {(() => {
                            const total = dashboardData.funnel.reduce((acc: number, cur: any) => acc + (cur.count || 0), 0) || 1;
                            return (
                              <Box display="flex" flexDirection="column" gap={2}>
                                {dashboardData.funnel.map((f: any, idx: number) => {
                                  const percent = Math.round(((f.count || 0) / total) * 100);
                                  const colors = ['#4E88BE', '#C8A870', '#06103A', '#F0AD4E'];
                                  const color = colors[idx % colors.length];
                                  return (
                                    <Box key={f.status}>
                                      <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{f.status}</Typography>
                                        <Typography variant="body2" color="text.secondary">{f.count}</Typography>
                                      </Box>
                                      <Box sx={{ width: '100%', background: '#F4F6F8', borderRadius: 8, height: 18 }}>
                                        <Box sx={{ width: `${Math.max(6, percent)}%`, height: '100%', background: color, borderRadius: 8, transition: 'width 600ms ease' }} />
                                      </Box>
                                    </Box>
                                  );
                                })}
                              </Box>
                            );
                          })()}
                        </Box>
                      ) : (
                        <Typography variant="body2">Tidak ada data funnel</Typography>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Grid>

            {/* Activities removed per request */}
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
        </>
      )}
    </Box>
  );
};

export default HomePage;

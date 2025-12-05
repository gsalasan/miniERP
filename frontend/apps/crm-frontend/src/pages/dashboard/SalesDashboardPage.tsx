import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Grid,
  Paper,
  Typography,
  LinearProgress,
  CircularProgress,
  Divider,
  Skeleton,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  TextField,
  Button,
} from "@mui/material";
import { useAuth } from '../../contexts/AuthContext';
import { usersApi } from '../../api/users';
import { dashboardApi } from "../../api/dashboard";
import IncentiveSimulationCard from '../../components/dashboard/IncentiveSimulationCard';

const currency = (v?: number) => {
  if (v == null) return "-";
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(v);
};

const SmallBar: React.FC<{ value: number; max: number }> = ({ value, max }) => {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Box sx={{ flex: 1, height: 10, bgcolor: 'grey.200', borderRadius: 1, overflow: 'hidden' }}>
        <Box sx={{ height: '100%', width: `${pct}%`, bgcolor: 'primary.main' }} />
      </Box>
      <Typography variant="caption">{pct}%</Typography>
    </Box>
  );
};

const SalesDashboardPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Filters
  const [period, setPeriod] = useState<string>('this_month');
  const [customFrom, setCustomFrom] = useState<string>('');
  const [customTo, setCustomTo] = useState<string>('');
  const [salesUserId, setSalesUserId] = useState<string | undefined>(undefined);
  const [salesUsers, setSalesUsers] = useState<Array<{ id: string; name: string }>>([]);

  // Fetch sales users if manager/CEO for selector
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (user && (user.roles?.includes('SALES_MANAGER') || user.roles?.includes('CEO'))) {
          const list = await usersApi.getSalesUsers();
          if (!mounted) return;
          setSalesUsers(list.map((s) => ({ id: s.id, name: s.name })));
        }
      } catch (e) {
        // ignore
      }
    })();
    return () => { mounted = false; };
  }, [user]);

  // Fetch dashboard when filters change
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const params: any = { period };
        if (period === 'custom' && customFrom && customTo) {
          params.period = 'custom';
          params.from = customFrom;
          params.to = customTo;
        }
        if (salesUserId) params.sales_user_id = salesUserId;

        const res = await dashboardApi.getSalesDashboard(params);
        if (!mounted) return;
        setData(res.data || res);
      } catch (e: any) {
        console.error('Failed load dashboard', e);
        if (!mounted) return;
        setError(e?.response?.data?.message || e?.message || 'Gagal memuat dashboard');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [period, customFrom, customTo, salesUserId]);

  const funnel = data?.funnel || [];
  const activities = data?.activities || {};
  const tva = data?.target_vs_actual || { target: null, actual: 0, percent: null };
  const winRate = data?.win_rate || { won: 0, lost: 0, rate: null };

  const funnelMax = useMemo(() => {
    if (!funnel || funnel.length === 0) return 1;
    return Math.max(1, ...funnel.map((f: any) => f.count));
  }, [funnel]);

  if (loading) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>Dasbor Kinerja Sales</Typography>
        <Grid container spacing={2}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Grid item xs={12} md={6} key={i}><Skeleton variant="rectangular" height={140} /></Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Dasbor Kinerja Sales</Typography>

      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel id="period-label">Periode</InputLabel>
          <Select
            labelId="period-label"
            value={period}
            label="Periode"
            onChange={(e) => setPeriod(e.target.value)}
          >
            <MenuItem value="this_month">Bulan Ini</MenuItem>
            <MenuItem value="this_quarter">Kuartal Ini</MenuItem>
            <MenuItem value="this_year">Tahun Ini</MenuItem>
            <MenuItem value="custom">Rentang Kustom</MenuItem>
          </Select>
        </FormControl>

        {period === 'custom' && (
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <TextField label="Dari" type="date" size="small" InputLabelProps={{ shrink: true }} value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} />
            <TextField label="Sampai" type="date" size="small" InputLabelProps={{ shrink: true }} value={customTo} onChange={(e) => setCustomTo(e.target.value)} />
          </Box>
        )}

        {(user?.roles?.includes('SALES_MANAGER') || user?.roles?.includes('CEO')) && (
          <FormControl size="small" sx={{ minWidth: 220 }}>
            <InputLabel id="sales-user-label">Sales Person</InputLabel>
            <Select
              labelId="sales-user-label"
              value={salesUserId ?? ''}
              label="Sales Person"
              onChange={(e) => setSalesUserId(e.target.value || undefined)}
            >
              <MenuItem value="">Semua Tim</MenuItem>
              {salesUsers.map((s) => (
                <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

        <Button variant="outlined" size="small" onClick={() => { setPeriod('this_month'); setCustomFrom(''); setCustomTo(''); setSalesUserId(undefined); }}>Reset</Button>
      </Box>

      <Grid container spacing={2}>
        {/* Target vs Actual */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6">Target vs Actual</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
              <Box sx={{ textAlign: 'center' }}>
                <CircularProgress variant="determinate" value={tva.percent ?? 0} size={96} />
                <Box sx={{ mt: 1 }}>
                  <Typography variant="subtitle2">{tva.percent !== null ? `${tva.percent}%` : 'No target'}</Typography>
                </Box>
              </Box>

              <Box sx={{ flex: 1 }}>
                <Typography variant="caption">Target</Typography>
                <Typography variant="h6">{currency(tva.target)}</Typography>
                <Divider sx={{ my: 1 }} />
                <Typography variant="caption">Actual</Typography>
                <Typography variant="h6">{currency(tva.actual)}</Typography>
                <Box sx={{ mt: 1 }}><LinearProgress variant="determinate" value={tva.percent ?? 0} /></Box>
              </Box>
            </Box>
          </Paper>
          {/* Incentive simulation card placed under Target vs Actual */}
          <IncentiveSimulationCard />
        </Grid>

        {/* Win Rate */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6">Win Rate</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4">{winRate.rate !== null ? `${winRate.rate}%` : '-'}</Typography>
                <Typography variant="caption">Won: {winRate.won ?? 0} — Lost: {winRate.lost ?? 0}</Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* Activities summary */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6">Aktivitas Sales</Typography>
            <Box sx={{ mt: 1 }}>
              {Object.keys(activities).length === 0 ? (
                <Typography variant="body2">Tidak ada aktivitas tercatat</Typography>
              ) : (
                Object.entries(activities).map(([k, v]) => (
                  <Box key={k} sx={{ mb: 1 }}>
                    <Typography variant="subtitle2">{k}</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box sx={{ width: '70%' }}><SmallBar value={Number(v)} max={Math.max(1, ...Object.values(activities).map(Number))} /></Box>
                      <Typography variant="body2">{v}</Typography>
                    </Box>
                  </Box>
                ))
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Funnel chart (simple segmented bars) */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6">Sales Funnel</Typography>
            <Box sx={{ mt: 1 }}>
              {funnel.map((f: any) => (
                <Box key={f.status} sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                  <Box sx={{ width: 180 }}><Typography variant="body2">{f.status}</Typography></Box>
                  <Box sx={{ flex: 1 }}>
                    <SmallBar value={f.count} max={funnelMax} />
                  </Box>
                  <Box sx={{ width: 140, textAlign: 'right' }}>
                    <Typography variant="body2">{f.count} — {currency(f.total_value)}</Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>

        {/* Bigger activities detail / placeholder for bar chart */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6">Aktivitas (Detail)</Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>Ringkasan aktivitas sales untuk periode yang dipilih.</Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SalesDashboardPage;

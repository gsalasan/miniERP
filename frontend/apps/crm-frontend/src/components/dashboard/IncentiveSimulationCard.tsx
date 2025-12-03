import React, { useState, useEffect } from 'react';
import { Card, CardContent, Typography, Box, TextField, Button, LinearProgress } from '@mui/material';
import { dashboardApi } from '../../api/dashboard';

const formatCurrencyNoDecimals = (value: number | null | undefined) => {
  if (value == null) return '-';
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0, minimumFractionDigits: 0 }).format(Number(value));
};

const IncentiveSimulationCard: React.FC = () => {
  const [additional, setAdditional] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [base, setBase] = useState({ currentSales: 0, targetSales: 0, currentIncentive: 0, achievementRate: 0 });

   // Fetch dashboard data on mount to populate base values
   useEffect(() => {
     let mounted = true;
     (async () => {
       setLoading(true);
       try {
         const resp = await dashboardApi.getSalesDashboard({ period: 'this_month' });
         const data = resp?.data || resp;
         // support multiple possible keys used in different implementations
         const tva = data?.target_vs_actual || data?.salesAchievement || data?.sales_achievement || {};
         const incentiveSim = data?.incentive_simulation || data?.incentiveSimulation || {};

         const currentSales = Number(tva.actual ?? tva.actual_revenue ?? 0) || 0;
         const targetSales = Number(tva.target ?? 0) || 0;
         const currentIncentive = Number(incentiveSim.estimated ?? incentiveSim.currentIncentive ?? incentiveSim.currentIncentiveAmount ?? 0) || 0;
         const achievementRate = targetSales > 0 ? Number(((currentSales / targetSales) * 100).toFixed(2)) : 0;

         if (!mounted) return;
         setBase({ currentSales, targetSales, currentIncentive, achievementRate });
         // initialize result based on base values and zero additional
         setResult({
           currentSales,
           targetSales,
           currentIncentive,
           achievementRate,
           simulatedIncentive: currentIncentive,
           simulatedAchievementRate: achievementRate,
         });
       } catch (err: any) {
         if (mounted) setError(err?.response?.data?.message || err?.message || 'Gagal memuat data dashboard');
       } finally {
         if (mounted) setLoading(false);
       }
     })();
     return () => { mounted = false; };
   }, []);

  // Debounce input changes and compute simulation locally using base values
  useEffect(() => {
    const t = setTimeout(() => {
      setError(null);
      try {
        const currentSales = base.currentSales || 0;
        const targetSales = base.targetSales || 0;

        // Determine incentive percent: prefer server-provided currentIncentive, otherwise fallback to 2%
        let incentivePercent = 0.02;
        if (currentSales > 0 && base.currentIncentive > 0) {
          incentivePercent = base.currentIncentive / currentSales;
        }

        const simulatedRevenue = currentSales + Number(additional || 0);
        const simulatedAchievementRate = targetSales > 0 ? Number(((simulatedRevenue / targetSales) * 100).toFixed(2)) : 0;
        const simulatedIncentive = Math.round(simulatedRevenue * incentivePercent);
        const currentIncentive = Math.round(currentSales * incentivePercent);

        setResult({
          currentSales,
          targetSales,
          currentIncentive,
          achievementRate: base.achievementRate,
          simulatedIncentive,
          simulatedAchievementRate,
        });
      } catch (e: any) {
        setError(e?.message || 'Gagal menghitung simulasi');
      }
    }, 300);
    return () => clearTimeout(t);
  }, [additional, base]);

  return (
    <Card sx={{ mt: 2 }}>
      <CardContent>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Estimasi Insentif Anda (Simulasi)</Typography>
        {loading && <LinearProgress sx={{ mb: 2 }} />}
        {error && <Typography color="error" variant="body2">{error}</Typography>}

        <Box display="flex" gap={2} flexDirection={{ xs: 'column', sm: 'row' }} alignItems="center">
          <Box sx={{ flex: 1 }}>
            <Typography variant="caption" color="text.secondary">Pencapaian Saat Ini</Typography>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>{formatCurrencyNoDecimals(result?.currentSales)}</Typography>
            <Typography variant="caption" color="text.secondary">Target: {formatCurrencyNoDecimals(result?.targetSales)}</Typography>
            <Box sx={{ mt: 1 }}>
              <Typography variant="body2">Tingkat Pencapaian: {result?.achievementRate ?? '-'}%</Typography>
            </Box>
          </Box>

          <Box sx={{ width: 220 }}>
            <TextField
              label="Tambahan Penjualan (Rp)"
              type="number"
              fullWidth
              value={additional}
              onChange={(e) => setAdditional(Number(e.target.value || 0))}
            />
            <Button sx={{ mt: 1 }} variant="contained" onClick={() => setAdditional(0)}>Reset</Button>
          </Box>

          <Box sx={{ width: 220 }}>
            <Typography variant="caption" color="text.secondary">Insentif Saat Ini</Typography>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>{formatCurrencyNoDecimals(result?.currentIncentive)}</Typography>
            <Typography variant="caption" color="text.secondary">Insentif Simulasi</Typography>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>{formatCurrencyNoDecimals(result?.simulatedIncentive)}</Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default IncentiveSimulationCard;

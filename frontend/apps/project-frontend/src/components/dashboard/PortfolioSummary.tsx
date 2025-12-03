import React from 'react';
import { Typography, Grid, Box } from '@mui/material';

interface Props {
  totalActiveProjects: number;
  totalContractValue: number;
  averageMargin: number;
}

const formatCurrency = (v: number) => new Intl.NumberFormat('id-ID').format(v || 0);

const PortfolioSummary: React.FC<Props> = ({ totalActiveProjects, totalContractValue, averageMargin }) => {
  return (
    <Box sx={{ display: 'flex', gap: 2, alignItems: 'stretch', flexDirection: { xs: 'column', sm: 'row' } }}>
      <Box sx={{ flex: 1, bgcolor: 'background.paper', p: 1.5, borderRadius: 1, boxShadow: 1 }}>
        <Typography variant="subtitle2">Total Proyek Aktif</Typography>
        <Typography variant="h6">{totalActiveProjects ?? 0}</Typography>
      </Box>
      <Box sx={{ flex: 1, bgcolor: 'background.paper', p: 1.5, borderRadius: 1, boxShadow: 1 }}>
        <Typography variant="subtitle2">Total Nilai Kontrak</Typography>
        <Typography variant="h6">Rp {formatCurrency(totalContractValue || 0)}</Typography>
      </Box>
      <Box sx={{ flex: 1, bgcolor: 'background.paper', p: 1.5, borderRadius: 1, boxShadow: 1 }}>
        <Typography variant="subtitle2">Rata-rata Margin Proyek</Typography>
        <Typography variant="h6">{Number(averageMargin || 0).toFixed(2)}%</Typography>
      </Box>
    </Box>
  );
};

export default PortfolioSummary;

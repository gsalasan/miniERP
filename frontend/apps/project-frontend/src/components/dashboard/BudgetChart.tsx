import React from 'react';
import { Typography, Box, Stack } from '@mui/material';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, Legend } from 'recharts';

interface Props {
  estimated: number;
  actual: number;
}

const BudgetChart: React.FC<Props> = ({ estimated, actual }) => {
  const data = [
    { name: 'Estimated HPP', value: Number(estimated || 0) },
    { name: 'Actual Cost', value: Number(actual || 0) },
  ];

  const fmt = (v: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(v || 0);

  return (
    <Box>
      <Typography variant="subtitle2" sx={{ mb: 1 }}>Anggaran vs Aktual</Typography>
      <Box sx={{ width: '100%', height: 220, minHeight: 220 }}>
        <ResponsiveContainer>
          <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 30 }}>
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toLocaleString()}k` : v)} tick={{ fontSize: 12 }} />
            <Tooltip formatter={(value: any) => fmt(Number(value))} />
            <Legend verticalAlign="top" height={24} />
            <Bar dataKey="value" barSize={40}>
              {data.map((entry, idx) => (
                <Cell key={`cell-${idx}`} fill={idx === 0 ? '#1976d2' : '#2e7d32'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Box>

      <Stack direction="row" justifyContent="space-between" sx={{ mt: 1 }}>
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>{fmt(estimated)}</Typography>
          <Typography variant="caption" color="text.secondary">Estimated HPP</Typography>
        </Box>
        <Box sx={{ textAlign: 'right' }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>{fmt(actual)}</Typography>
          <Typography variant="caption" color="text.secondary">Actual Cost</Typography>
        </Box>
      </Stack>
    </Box>
  );
};

export default BudgetChart;

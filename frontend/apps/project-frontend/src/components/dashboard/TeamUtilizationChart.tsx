import React from 'react';
import { Typography, Box } from '@mui/material';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

interface Row {
  assigneeName: string;
  value: number;
}

interface Props {
  rows: Row[];
}

const TeamUtilizationChart: React.FC<Props> = ({ rows }) => {
  const data = (rows || []).map(r => ({ name: r.assigneeName, value: r.value }));

  if (!data || data.length === 0) {
    return <Typography variant="body2" color="text.secondary">No utilization data</Typography>;
  }

  return (
    <Box>
      <Typography variant="subtitle1" gutterBottom>Utilisasi Tim Internal</Typography>
      <div style={{ width: '100%', height: 260 }}>
        <ResponsiveContainer>
          <BarChart data={data} layout="vertical" margin={{ left: 8 }}>
            <XAxis type="number" tickFormatter={(v) => `${v}`} />
            <YAxis dataKey="name" type="category" width={140} />
            <Tooltip formatter={(v:any) => v} />
            <Bar dataKey="value" fill="#1976d2" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Box>
  );
};

export default TeamUtilizationChart;

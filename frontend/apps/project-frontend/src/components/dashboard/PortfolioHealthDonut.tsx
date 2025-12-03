import React from 'react';
import { Typography } from '@mui/material';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

interface Props {
  onTrack: number;
  atRisk: number;
  overdue: number;
}

const COLORS = ['#2e7d32', '#f57c00', '#d32f2f'];

const PortfolioHealthDonut: React.FC<Props> = ({ onTrack, atRisk, overdue }) => {
  const data = [
    { name: 'On Track', value: onTrack || 0 },
    { name: 'At Risk', value: atRisk || 0 },
    { name: 'Overdue', value: overdue || 0 },
  ];

  return (
    <div>
      <div style={{ width: '100%', height: 240, minHeight: 240 }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" outerRadius={80} innerRadius={40} label>
              {data.map((entry, idx) => (
                <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(v:any) => v} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default PortfolioHealthDonut;

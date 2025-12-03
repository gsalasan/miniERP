import React from 'react';
import { Typography, Box, LinearProgress, Divider } from '@mui/material';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';

interface Milestone {
  id?: string;
  name: string;
  start_date?: string;
  end_date?: string;
  progress?: number;
  status?: string;
}

interface Props {
  milestones: Milestone[];
}

const MilestoneTimeline: React.FC<Props> = ({ milestones }) => {
  const statusToColor = (s?: string) => {
    if (!s) return 'gray';
    const key = s.toLowerCase();
    if (key.includes('done') || key.includes('completed')) return 'green';
    if (key.includes('overdue')) return 'red';
    if (key.includes('risk')) return 'orange';
    return 'blue';
  };

  return (
    <div>
      {(!milestones || milestones.length === 0) ? (
        <Typography variant="body2" color="text.secondary">No milestones</Typography>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {milestones.map((m, idx) => (
            <Box key={idx} sx={{ display: 'flex', gap: 2, alignItems: 'center', p: 1 }}>
              <FiberManualRecordIcon sx={{ color: statusToColor(m.status), fontSize: 14 }} />
              <Box sx={{ flex: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="subtitle2">{m.name}</Typography>
                  <Typography variant="caption" color="text.secondary">{m.start_date ? new Date(m.start_date).toLocaleDateString() : '-'} — {m.end_date ? new Date(m.end_date).toLocaleDateString() : '-'}</Typography>
                </Box>
                <LinearProgress variant="determinate" value={Math.max(0, Math.min(100, Number(m.progress || 0)))} sx={{ height: 10, borderRadius: 6, mt: 1 }} />
              </Box>
            </Box>
          ))}
        </Box>
      )}
    </div>
  );
};

export default MilestoneTimeline;

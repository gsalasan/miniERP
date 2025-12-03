import React from 'react';
import { Box, Typography, Chip, LinearProgress, Stack } from '@mui/material';
import TimelineIcon from '@mui/icons-material/Timeline';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';

interface Props {
  timelineStatus: string;
  budgetStatus: string;
  overallProgress: number;
  budgetUsedPercentage?: number;
}

const statusColor = (s: string) => {
  if (!s) return 'default';
  const key = s.toLowerCase();
  if (key.includes('on track') || key.includes('on_track') || key.includes('ontrack')) return 'success';
  if (key.includes('risk') || key.includes('at risk')) return 'warning';
  if (key.includes('overdue')) return 'error';
  if (key.includes('under')) return 'success';
  if (key.includes('over')) return 'error';
  return 'default';
};

const ProjectHealthCard: React.FC<Props> = ({ timelineStatus, budgetStatus, overallProgress, budgetUsedPercentage }) => {
  return (
    <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' }, alignItems: 'stretch' }}>
      {/* three equal columns */}
      <Box sx={{ flex: 1, borderRadius: 1, p: 2, border: '1px solid', borderColor: 'divider', display: 'flex', gap: 1, alignItems: 'center' }}>
        <TimelineIcon color="primary" sx={{ fontSize: 32 }} />
        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle2" gutterBottom>Status Timeline</Typography>
          <Chip label={timelineStatus || 'Unknown'} color={statusColor(timelineStatus) as any} size="small" />
        </Box>
      </Box>

      <Box sx={{ flex: 1, borderRadius: 1, p: 2, border: '1px solid', borderColor: 'divider', display: 'flex', gap: 1, alignItems: 'center' }}>
        <AccountBalanceWalletIcon sx={{ color: 'success.main', fontSize: 32 }} />
        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle2" gutterBottom>Status Anggaran</Typography>
          <Chip label={budgetStatus || 'Unknown'} color={statusColor(budgetStatus) as any} size="small" />
        </Box>
      </Box>

      <Box sx={{ flex: 1, borderRadius: 1, p: 2, border: '1px solid', borderColor: 'divider', display: 'flex', gap: 1, flexDirection: 'column', justifyContent: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TrendingUpIcon color="action" sx={{ fontSize: 32 }} />
          <Typography variant="subtitle2" gutterBottom>Progress Keseluruhan</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
          <Box sx={{ flex: 1 }}>
            <LinearProgress variant="determinate" value={Math.max(0, Math.min(100, Number(overallProgress || 0)))} sx={{ height: 12, borderRadius: 6 }} />
          </Box>
          <Typography variant="body2" sx={{ minWidth: 56, textAlign: 'right' }}>{Number(overallProgress || 0).toFixed(0)}%</Typography>
        </Box>
        {typeof budgetUsedPercentage !== 'undefined' && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>Budget used: {Number(budgetUsedPercentage || 0).toFixed(0)}%</Typography>
        )}
      </Box>
    </Box>
  );
};

export default ProjectHealthCard;

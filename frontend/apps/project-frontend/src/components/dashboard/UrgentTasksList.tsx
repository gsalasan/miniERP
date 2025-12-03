import React from 'react';
import { Typography, List, ListItem, ListItemText, Chip, Avatar, Box } from '@mui/material';
import { format } from 'date-fns';

interface Task {
  id?: string;
  title: string;
  due_date?: string;
  assignee?: { full_name?: string; email?: string } | string;
  status?: string;
}

interface Props {
  tasks: Task[];
}

const UrgentTasksList: React.FC<Props> = ({ tasks }) => {
  const statusColor = (s?: string) => {
    if (!s) return 'default';
    const k = s.toLowerCase();
    if (k.includes('overdue')) return 'error';
    if (k.includes('in_progress') || k.includes('in progress') || k.includes('in-progress')) return 'warning';
    if (k.includes('done') || k.includes('completed')) return 'success';
    return 'default';
  };

  return (
    <div>
      <List sx={{ py: 0 }}>
        {(tasks || []).slice(0, 5).map((t, idx) => {
          const assigneeLabel = typeof t.assignee === 'string' ? t.assignee : t.assignee?.full_name || t.assignee?.email || 'Unassigned';
          const dueLabel = t.due_date ? format(new Date(t.due_date), 'dd MMM yyyy') : 'No due date';
          return (
            <ListItem key={idx} divider sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 1 }}>
              <Avatar src={undefined} sx={{ width: 40, height: 40, bgcolor: 'primary.light', mr: 1, fontSize: '0.95rem' }}>{assigneeLabel.charAt(0).toUpperCase()}</Avatar>
              <ListItemText
                primary={<Typography variant="body2" sx={{ fontWeight: 600 }}>{t.title}</Typography>}
                secondary={<Typography variant="caption" color="text.secondary">{dueLabel}</Typography>}
              />
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.5 }}>
                <Chip label={t.status || '-'} size="small" color={statusColor(t.status) as any} sx={{ fontWeight: 600 }} />
                <Typography variant="caption" color="text.secondary">{assigneeLabel}</Typography>
              </Box>
            </ListItem>
          );
        })}
      </List>
    </div>
  );
};

export default UrgentTasksList;

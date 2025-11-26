import React from 'react';
import {
  Card,
  CardContent,
  Box,
  Typography,
  Chip,
  Stack,
  Divider,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  AccessTime as AccessTimeIcon,
  LocationOn as LocationOnIcon,
  LogoutOutlined as CheckOutIcon,
} from '@mui/icons-material';
import LocationDisplay from './LocationDisplay';
import { formatTime, formatDuration } from '../api/attendance';

interface AttendanceRecord {
  id?: string | number;
  check_in_time?: string;
  check_out_time?: string | null;
  check_in_location?: string;
  check_out_location?: string | null;
  date?: string;
  status?: 'present' | 'absent' | 'late' | 'incomplete';
  work_duration_minutes?: number;
}

interface AttendanceCardProps {
  record: AttendanceRecord;
}

const AttendanceCard: React.FC<AttendanceCardProps> = ({ record }) => {
  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
    });
  };

  // Get status badge color
  const getStatusBadgeColor = (status?: string) => {
    switch (status) {
      case 'present':
        return { bgcolor: '#d1f2eb', color: '#27ae60' };
      case 'late':
        return { bgcolor: '#fff3cd', color: '#f39c12' };
      case 'absent':
        return { bgcolor: '#f8d7da', color: '#c0392b' };
      case 'incomplete':
        return { bgcolor: '#d1ecf1', color: '#0c5460' };
      default:
        return { bgcolor: '#e9ecef', color: '#495057' };
    }
  };

  // Get status label
  const getStatusLabel = (status?: string) => {
    switch (status) {
      case 'present':
        return 'Hadir';
      case 'late':
        return 'Terlambat';
      case 'absent':
        return 'Tidak Hadir';
      case 'incomplete':
        return 'Belum Check Out';
      default:
        return 'Pending';
    }
  };

  const checkInTime = record.check_in_time ? formatTime(record.check_in_time) : '-';
  const checkOutTime = record.check_out_time ? formatTime(record.check_out_time) : '-';
  const displayDate = formatDate(record.check_in_time || record.date);
  const status = record.status || (record.check_out_time ? 'present' : 'incomplete');
  const badgeColor = getStatusBadgeColor(status);

  return (
    <Card
      sx={{
        mb: 2,
        borderRadius: 2,
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        border: '1px solid #e9ecef',
        transition: 'all 0.3s ease',
        '&:hover': {
          boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
        },
      }}
    >
      <CardContent sx={{ p: 3 }}>
        {/* Header dengan tanggal dan status */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            mb: 2.5,
          }}
        >
          <Box>
            <Typography variant="h6" fontWeight="bold" sx={{ color: '#2c3e50', mb: 0.5 }}>
              {displayDate}
            </Typography>
          </Box>
          <Chip
            label={getStatusLabel(status)}
            size="small"
            sx={{
              fontWeight: 600,
              fontSize: '0.75rem',
              ...badgeColor,
            }}
          />
        </Box>

        {/* Waktu check-in dan check-out */}
        <Stack spacing={2} sx={{ mb: 2.5 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            {/* Check In */}
            <Box
              sx={{
                borderLeft: '4px solid #3498db',
                pl: 2,
                py: 1,
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  color: '#7f8c8d',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  display: 'block',
                  mb: 0.5,
                }}
              >
                Jam Masuk
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                <CheckCircleIcon sx={{ fontSize: 24, color: '#3498db' }} />
                <Typography variant="h6" fontWeight="bold" sx={{ color: '#3498db' }}>
                  {checkInTime}
                </Typography>
              </Box>
              {record.check_in_location && (
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5, mt: 1 }}>
                  <LocationOnIcon
                    sx={{
                      fontSize: 16,
                      color: '#7f8c8d',
                      mt: 0.25,
                      flexShrink: 0,
                    }}
                  />
                  <Typography variant="caption" sx={{ color: '#7f8c8d' }}>
                    {record.check_in_location}
                  </Typography>
                </Box>
              )}
            </Box>

            {/* Check Out */}
            <Box
              sx={{
                borderLeft: `4px solid ${record.check_out_time ? '#27ae60' : '#bdc3c7'}`,
                pl: 2,
                py: 1,
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  color: '#7f8c8d',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  display: 'block',
                  mb: 0.5,
                }}
              >
                Jam Keluar
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                <CheckOutIcon
                  sx={{
                    fontSize: 24,
                    color: record.check_out_time ? '#27ae60' : '#bdc3c7',
                  }}
                />
                <Typography
                  variant="h6"
                  fontWeight="bold"
                  sx={{ color: record.check_out_time ? '#27ae60' : '#bdc3c7' }}
                >
                  {checkOutTime}
                </Typography>
              </Box>
              {record.check_out_location && (
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5, mt: 1 }}>
                  <LocationOnIcon
                    sx={{
                      fontSize: 16,
                      color: '#7f8c8d',
                      mt: 0.25,
                      flexShrink: 0,
                    }}
                  />
                  <Typography variant="caption" sx={{ color: '#7f8c8d' }}>
                    {record.check_out_location}
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
        </Stack>

        {/* Duration */}
        {record.check_in_time && record.check_out_time && record.work_duration_minutes && (
          <>
            <Divider sx={{ my: 1.5 }} />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AccessTimeIcon sx={{ fontSize: 20, color: '#7f8c8d' }} />
              <Typography variant="body2" sx={{ color: '#7f8c8d' }}>
                <strong>Durasi Kerja:</strong> {formatDuration(record.work_duration_minutes)}
              </Typography>
            </Box>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default AttendanceCard;

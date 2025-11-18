import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  CircularProgress,
  Alert,
  Chip,
  Stack,
  Paper,
  Grid,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  AccessTime as ClockIcon,
  LocationOn as LocationIcon,
  EventAvailable as CalendarIcon,
  Login as LoginIcon,
  Logout as LogoutIcon,
} from '@mui/icons-material';
import {
  getTodayAttendance,
  checkIn,
  checkOut,
  getCurrentPosition,
  formatTime,
  formatDuration,
  type Attendance,
} from '../api/attendance';

const AttendanceWidget: React.FC = () => {
  const [attendance, setAttendance] = useState<Attendance | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch today's attendance on mount
  useEffect(() => {
    fetchTodayAttendance();
  }, []);

  const fetchTodayAttendance = async () => {
    try {
      setLoading(true);
      const data = await getTodayAttendance();
      setAttendance(data);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching attendance:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    try {
      setProcessing(true);
      setError(null);

      // Get current position
      const position = await getCurrentPosition();

      // Call check-in API
      const data = await checkIn(position);

      setAttendance(data);
      alert('✅ Check-in berhasil!');
    } catch (err: any) {
      console.error('Check-in error:', err);
      setError(err.message || 'Gagal melakukan check-in');
      alert('❌ ' + (err.message || 'Gagal melakukan check-in'));
    } finally {
      setProcessing(false);
    }
  };

  const handleCheckOut = async () => {
    try {
      setProcessing(true);
      setError(null);

      // Get current position
      const position = await getCurrentPosition();

      // Call check-out API
      const data = await checkOut(position);

      setAttendance(data);
      alert('✅ Check-out berhasil!');
    } catch (err: any) {
      console.error('Check-out error:', err);
      setError(err.message || 'Gagal melakukan check-out');
      alert('❌ ' + (err.message || 'Gagal melakukan check-out'));
    } finally {
      setProcessing(false);
    }
  };

  // Determine button state
  const getButtonState = () => {
    if (!attendance || !attendance.check_in_time) {
      return {
        label: 'CHECK-IN',
        color: 'success' as const,
        icon: <CheckCircleIcon sx={{ fontSize: { xs: 28, sm: 32 } }} />,
        onClick: handleCheckIn,
        disabled: false,
      };
    } else if (attendance.check_in_time && !attendance.check_out_time) {
      return {
        label: 'CHECK-OUT',
        color: 'error' as const,
        icon: <CancelIcon sx={{ fontSize: { xs: 28, sm: 32 } }} />,
        onClick: handleCheckOut,
        disabled: false,
      };
    } else {
      return {
        label: 'SELESAI',
        color: 'inherit' as const,
        icon: <CheckCircleIcon sx={{ fontSize: { xs: 28, sm: 32 } }} />,
        onClick: () => {},
        disabled: true,
      };
    }
  };

  const buttonState = getButtonState();

  if (loading) {
    return (
      <Card sx={{ borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      sx={{
        borderRadius: 3,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        overflow: 'hidden',
      }}
    >
      {/* Header with Red Gradient */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)',
          color: 'white',
          p: 3,
          textAlign: 'center',
        }}
      >
        <Typography variant="h5" fontWeight="bold" sx={{ mb: 1 }}>
          Live Attendance
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.95, mb: 3, fontSize: '0.9rem' }}>
          {currentTime.toLocaleDateString('id-ID', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </Typography>

        {/* Big Digital Clock */}
        <Typography
          variant="h2"
          fontWeight="bold"
          sx={{
            fontFamily: 'monospace',
            letterSpacing: 3,
            textShadow: '0 2px 4px rgba(0,0,0,0.2)',
            fontSize: { xs: '2.5rem', sm: '3rem' },
          }}
        >
          {currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
        </Typography>
      </Box>

      <CardContent sx={{ p: 3 }}>
        {/* Error Message */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Check In & Check Out Buttons */}
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <Button
            variant="contained"
            fullWidth
            disabled={!!attendance?.check_in_time || processing}
            onClick={handleCheckIn}
            sx={{
              py: 2,
              fontSize: '1rem',
              fontWeight: 'bold',
              bgcolor: '#3498db',
              borderRadius: 2,
              textTransform: 'none',
              boxShadow: 'none',
              '&:hover': {
                bgcolor: '#2980b9',
                boxShadow: 'none',
              },
              '&:disabled': {
                bgcolor: '#95a5a6',
                color: 'white',
              },
            }}
            startIcon={processing ? <CircularProgress size={18} color="inherit" /> : null}
          >
            Check In
          </Button>
          <Button
            variant="contained"
            fullWidth
            disabled={!attendance?.check_in_time || !!attendance?.check_out_time || processing}
            onClick={handleCheckOut}
            sx={{
              py: 2,
              fontSize: '1rem',
              fontWeight: 'bold',
              bgcolor: '#e74c3c',
              borderRadius: 2,
              textTransform: 'none',
              boxShadow: 'none',
              '&:hover': {
                bgcolor: '#c0392b',
                boxShadow: 'none',
              },
              '&:disabled': {
                bgcolor: '#95a5a6',
                color: 'white',
              },
            }}
            startIcon={processing ? <CircularProgress size={18} color="inherit" /> : null}
          >
            Check Out
          </Button>
        </Box>

        {/* Attendance Log */}
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
            <Typography variant="subtitle2" fontWeight="bold">
              Attendance log
            </Typography>
            {attendance?.status && (
              <Chip
                label={attendance.status}
                size="small"
                sx={{
                  bgcolor: '#d1f2eb',
                  color: '#27ae60',
                  fontWeight: 600,
                  fontSize: '0.7rem',
                }}
              />
            )}
          </Box>

          {attendance && (attendance.check_in_time || attendance.check_out_time) ? (
            <Box sx={{ bgcolor: '#f8f9fa', borderRadius: 2, p: 2, border: '1px solid #e9ecef' }}>
              <Grid container spacing={2}>
                {/* Check In */}
                {attendance.check_in_time && (
                  <Grid item xs={attendance.check_out_time ? 6 : 12}>
                    <Box>
                      <Stack direction="row" spacing={0.5} alignItems="center" mb={0.5}>
                        <ClockIcon sx={{ fontSize: 16, color: '#3498db' }} />
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem', fontWeight: 600 }}>
                          Check In
                        </Typography>
                      </Stack>
                      <Typography variant="h6" fontWeight="bold" sx={{ mb: 0.5 }}>
                        {formatTime(attendance.check_in_time)}
                      </Typography>
                      {attendance.check_in_location && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                          <LocationIcon sx={{ fontSize: 12, color: 'text.secondary' }} />
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                            {attendance.check_in_location.length > 30
                              ? attendance.check_in_location.substring(0, 30) + '...'
                              : attendance.check_in_location}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </Grid>
                )}

                {/* Check Out */}
                {attendance.check_out_time && (
                  <Grid item xs={6}>
                    <Box>
                      <Stack direction="row" spacing={0.5} alignItems="center" mb={0.5}>
                        <ClockIcon sx={{ fontSize: 16, color: '#e74c3c' }} />
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem', fontWeight: 600 }}>
                          Check Out
                        </Typography>
                      </Stack>
                      <Typography variant="h6" fontWeight="bold" sx={{ mb: 0.5 }}>
                        {formatTime(attendance.check_out_time)}
                      </Typography>
                      {attendance.work_duration_minutes && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                          Duration: {formatDuration(attendance.work_duration_minutes)}
                        </Typography>
                      )}
                    </Box>
                  </Grid>
                )}
              </Grid>
            </Box>
          ) : (
            <Box
              sx={{
                bgcolor: '#f8f9fa',
                borderRadius: 2,
                p: 3,
                textAlign: 'center',
                border: '1px dashed #dee2e6',
              }}
            >
              <Typography variant="body2" color="text.secondary" fontWeight="500" sx={{ mb: 0.5 }}>
                No activity log today
              </Typography>
              <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.75rem' }}>
                Your check in/check out activity will appear here
              </Typography>
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default AttendanceWidget;

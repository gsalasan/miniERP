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
  Divider,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  AccessTime as AccessTimeIcon,
  LocationOn as LocationOnIcon,
  EventAvailable as EventAvailableIcon,
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
      setError(null);
      const data = await getTodayAttendance();
      setAttendance(data);
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

      // Get current location
      const location = await getCurrentPosition();

      // Call check-in API
      const result = await checkIn(location);
      setAttendance(result);

      // Show success message
      alert('✓ Check-in berhasil!');
    } catch (err: any) {
      console.error('Error during check-in:', err);
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleCheckOut = async () => {
    try {
      setProcessing(true);
      setError(null);

      // Get current location
      const location = await getCurrentPosition();

      // Call check-out API
      const result = await checkOut(location);
      setAttendance(result);

      // Show success message with duration
      const duration = result.work_duration_minutes
        ? formatDuration(result.work_duration_minutes)
        : 'N/A';
      alert(`✓ Check-out berhasil! Total durasi kerja: ${duration}`);
    } catch (err: any) {
      console.error('Error during check-out:', err);
      setError(err.message);
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
        disabled: false,
        onClick: handleCheckIn,
      };
    } else if (!attendance.check_out_time) {
      return {
        label: 'CHECK-OUT',
        color: 'error' as const,
        disabled: false,
        onClick: handleCheckOut,
      };
    } else {
      return {
        label: 'SELESAI',
        color: 'primary' as const,
        disabled: true,
        onClick: () => {},
      };
    }
  };

  // Get status text
  const getStatusText = () => {
    if (!attendance || !attendance.check_in_time) {
      return 'Anda belum melakukan check-in hari ini.';
    } else if (!attendance.check_out_time) {
      return (
        <>
          <CheckCircleIcon sx={{ color: 'success.main', mr: 1, verticalAlign: 'middle' }} />
          Check-in berhasil pada jam {formatTime(attendance.check_in_time)}
          {attendance.check_in_location && (
            <>
              {' di '}
              <LocationOnIcon sx={{ fontSize: 16, verticalAlign: 'middle' }} />
              {attendance.check_in_location}
            </>
          )}
        </>
      );
    } else {
      const duration = attendance.work_duration_minutes
        ? formatDuration(attendance.work_duration_minutes)
        : 'N/A';
      return (
        <>
          <CheckCircleIcon sx={{ color: 'success.main', mr: 1, verticalAlign: 'middle' }} />
          Check-out berhasil pada jam {formatTime(attendance.check_out_time)}. Total durasi kerja: <strong>{duration}</strong>
        </>
      );
    }
  };

  const buttonState = getButtonState();
  const today = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  if (loading) {
    return (
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ textAlign: 'center', py: 4 }}>
          <CircularProgress />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      sx={{
        mb: 3,
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
        <Typography variant="body2" sx={{ opacity: 0.95, mb: 3 }}>
          {today}
        </Typography>

        {/* Big Digital Clock */}
        <Typography 
          variant="h2" 
          fontWeight="bold" 
          sx={{ 
            fontFamily: 'monospace',
            letterSpacing: 3,
            textShadow: '0 2px 4px rgba(0,0,0,0.2)',
          }}
        >
          {currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
        </Typography>
        <Typography variant="caption" sx={{ opacity: 0.9, mt: 0.5, display: 'block' }}>
          {currentTime.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
        </Typography>
      </Box>

      <CardContent sx={{ p: 3 }}>
        {/* Error Message */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Status/Schedule Info */}
        <Box
          sx={{
            bgcolor: '#f8f9fa',
            borderRadius: 2,
            p: 2.5,
            mb: 2,
            border: '1px solid #e9ecef',
          }}
        >
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 500 }}>
            Schedule 12 Mar 2025
          </Typography>
          <Typography variant="h6" fontWeight="bold" sx={{ mb: 0.5 }}>
            Shift Pagi
          </Typography>
          <Typography variant="body2" color="text.secondary">
            09:00 - 13:00
          </Typography>
        </Box>

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
              '&:hover': {
                bgcolor: '#2980b9',
              },
              '&:disabled': {
                bgcolor: '#95a5a6',
                color: 'white',
              },
            }}
            startIcon={processing ? <CircularProgress size={18} color="inherit" /> : null}
          >
            Clock In
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
              '&:hover': {
                bgcolor: '#c0392b',
              },
              '&:disabled': {
                bgcolor: '#95a5a6',
                color: 'white',
              },
            }}
            startIcon={processing ? <CircularProgress size={18} color="inherit" /> : null}
          >
            Clock Out
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
              {attendance.check_in_time && (
                <Box sx={{ mb: attendance.check_out_time ? 1.5 : 0 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem', mb: 0.5 }}>
                    Check In
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {formatTime(attendance.check_in_time)}
                  </Typography>
                  {attendance.check_in_location && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                      <LocationOnIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                      <Typography variant="caption" color="text.secondary">
                        {attendance.check_in_location}
                      </Typography>
                    </Box>
                  )}
                </Box>
              )}

              {attendance.check_out_time && (
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem', mb: 0.5 }}>
                    Check Out
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {formatTime(attendance.check_out_time)}
                  </Typography>
                  {attendance.work_duration_minutes && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                      Total: {formatDuration(attendance.work_duration_minutes)}
                    </Typography>
                  )}
                </Box>
              )}
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
              <Typography variant="caption" color="text.disabled">
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

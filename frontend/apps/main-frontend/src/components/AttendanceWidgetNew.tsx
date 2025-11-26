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
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
dayjs.extend(utc);
dayjs.extend(timezone);
import {
  getTodayAttendance,
  checkIn,
  checkOut,
  getCurrentPosition,
  formatTime,
  formatDuration,
  type Attendance,
} from '../api/attendance';
import LocationDisplay from './LocationDisplay';
import GMapView from './GMapView';
import { AttendanceToast } from './AttendanceToast';
import LocationPermissionPrompt from './LocationPermissionPrompt';

const AttendanceWidget: React.FC = () => {
  const [attendance, setAttendance] = useState<Attendance | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  // Remove live preview: we only request location when user performs check-in/out
  const [geoError, setGeoError] = useState<string | null>(null);
  const [showPermissionPrompt, setShowPermissionPrompt] = useState(false);
  const [permissionState, setPermissionState] = useState<'granted' | 'prompt' | 'denied' | 'unknown'>('unknown');
  // For toast notifications - Initialize as false to prevent auto-show
  const [showToast, setShowToast] = useState<boolean>(false);
  const [toastType, setToastType] = useState<'checkIn' | 'checkOut'>('checkIn');
  const [toastTime, setToastTime] = useState<string>('');

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
    // Use Permissions API to present a nicer in-app prompt before asking browser for location
    const initPermissionCheck = async () => {
      if (!navigator.geolocation) {
        setGeoError('Geolocation tidak didukung oleh browser Anda.');
        return;
      }
      try {
        const perm = await (navigator as any).permissions?.query?.({ name: 'geolocation' });
        const state = perm ? perm.state : 'prompt';
        setPermissionState(state);
        if (state === 'prompt') {
          setShowPermissionPrompt(true);
        } else if (state === 'denied') {
          setGeoError('Akses lokasi ditolak di browser. Aktifkan secara manual.');
        }
        // If granted we deliberately DO NOT call geolocation yet to avoid duplicate native prompt.
      } catch {
        setShowPermissionPrompt(true);
      }
    };
    initPermissionCheck();
  }, []);

  const fetchTodayAttendance = async () => {
    try {
      setLoading(true);
      const data = await getTodayAttendance();
      console.log('[DEBUG][AttendanceWidget] attendance API result:', data);
      setAttendance(data);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching attendance:', err, err?.response);
      setError((err && err.message ? err.message : 'Error fetching attendance') + (err?.response ? ' | ' + JSON.stringify(err.response.data) : ''));
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    try {
      setProcessing(true);
      setError(null);
      setShowToast(false); // Reset toast state

      // Get current position only now (first interactive action)
      const position = await getCurrentPosition();

      // Call check-in API
      await checkIn(position);

      // Selalu refresh data attendance dari server
      await fetchTodayAttendance();
      
      // Show professional toast notification ONLY after successful check-in
      const currentTime = dayjs().tz('Asia/Jakarta').format('HH:mm');
      setToastType('checkIn');
      setToastTime(currentTime);
      setShowToast(true);
    } catch (err: any) {
      console.error('Check-in error:', err, err?.response);
      const errorMsg = err && err.message ? err.message : 'Gagal melakukan check-in';
      setError(errorMsg + (err?.response ? ' | ' + JSON.stringify(err.response.data) : ''));
    } finally {
      setProcessing(false);
    }
  };

  // Helper: apakah check_in_time/check_out_time adalah hari ini (Asia/Jakarta)?
  const todayJakarta = dayjs().tz('Asia/Jakarta').format('YYYY-MM-DD');
  // Workaround: jika attendance.date bukan hari ini, treat seolah-olah user belum check-in hari ini
  const attendanceDate = attendance?.date ? dayjs(attendance.date).tz('Asia/Jakarta').format('YYYY-MM-DD') : null;
  const isAttendanceToday = attendanceDate === todayJakarta;
  const checkInDate = attendance?.check_in_time ? dayjs(attendance.check_in_time).tz('Asia/Jakarta').format('YYYY-MM-DD') : null;
  const checkOutDate = attendance?.check_out_time ? dayjs(attendance.check_out_time).tz('Asia/Jakarta').format('YYYY-MM-DD') : null;

  const isCheckInToday = isAttendanceToday && checkInDate === todayJakarta;
  const isCheckOutToday = isAttendanceToday && checkOutDate === todayJakarta;

  // Jika attendance bukan hari ini, treat seolah-olah user belum check-in/check-out
  const checkInDisabled = processing || (attendance && isAttendanceToday && isCheckInToday);
  const checkOutDisabled = processing || !attendance || !isAttendanceToday || !isCheckInToday || isCheckOutToday;

  const handleCheckOut = async () => {
    try {
      setProcessing(true);
      setError(null);
      setShowToast(false); // Reset toast state

      const position = await getCurrentPosition();

      // Call check-out API
      await checkOut(position);

      // Selalu refresh data attendance dari server
      await fetchTodayAttendance();
      
      // Show professional toast notification ONLY after successful check-out
      const currentTime = dayjs().tz('Asia/Jakarta').format('HH:mm');
      setToastType('checkOut');
      setToastTime(currentTime);
      setShowToast(true);
    } catch (err: any) {
      console.error('Check-out error:', err, err?.response);
      const errorMsg = err && err.message ? err.message : 'Gagal melakukan check-out';
      setError(errorMsg + (err?.response ? ' | ' + JSON.stringify(err.response.data) : ''));
    } finally {
      setProcessing(false);
    }
  };

  // Called when user clicks Allow in our custom prompt
  const onAllowLocation = async () => {
    setShowPermissionPrompt(false);
    try { (window as any).__allowGeolocation = true; } catch {}
    // We intentionally do not call geolocation here; it will be called when user presses Check In / Check Out.
  };

  const onCancelLocation = () => {
    setShowPermissionPrompt(false);
    setGeoError('Izin lokasi tidak diberikan');
  };

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
          {currentTime.toLocaleDateString('en-US', {
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
            disabled={!!checkInDisabled}
            onClick={handleCheckIn}
            sx={{
              py: 2,
              fontSize: '1rem',
              fontWeight: 'bold',
              bgcolor: '#27ae60', // green
              borderRadius: 2,
              textTransform: 'none',
              boxShadow: 'none',
              '&:hover': {
                bgcolor: '#219150', // darker green
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
            disabled={!!checkOutDisabled}
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
        {geoError && (
          <Typography variant="caption" color="error" sx={{ mb: 2, display: 'block' }}>{geoError}</Typography>
        )}

        {/* In-app permission prompt to improve UX before browser prompt */}
        <LocationPermissionPrompt
          open={showPermissionPrompt}
          onAllow={onAllowLocation}
          onCancel={onCancelLocation}
        />

        {/* Attendance Log + Debug Info */}
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
          {/* Attendance date & check-in time (API) disembunyikan */}

          {attendance && (attendance.check_in_time || attendance.check_out_time) ? (
            <Box sx={{ bgcolor: '#f8f9fa', borderRadius: 2, p: 2, border: '1px solid #e9ecef' }}>
              <Grid container spacing={2}>
                {/* Check In */}
                {attendance.check_in_time && (
                  <Grid>
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
                      {attendance.check_in_location && (() => {
                        const loc = attendance.check_in_location;
                        const match = loc.match(/^(-?\d+\.?\d*),\s*(-?\d+\.?\d*)$/);
                        if (match) {
                          const lat = parseFloat(match[1]);
                          const lng = parseFloat(match[2]);
                          return (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                              <LocationIcon sx={{ fontSize: 12, color: 'text.secondary' }} />
                              <LocationDisplay lat={lat} lng={lng} />
                            </Box>
                          );
                        } else {
                          return (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                              <LocationIcon sx={{ fontSize: 12, color: 'text.secondary' }} />
                              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                                {loc.length > 30 ? loc.substring(0, 30) + '...' : loc}
                              </Typography>
                            </Box>
                          );
                        }
                      })()}
                    </Box>
                  </Grid>
                )}

                {/* Check Out */}
                {attendance.check_out_time && (
                  <Grid>
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
                      {attendance.check_out_location && (() => {
                        const loc = attendance.check_out_location;
                        const match = loc.match(/^(-?\d+\.?\d*),\s*(-?\d+\.?\d*)$/);
                        if (match) {
                          const lat = parseFloat(match[1]);
                          const lng = parseFloat(match[2]);
                          return (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                              <LocationIcon sx={{ fontSize: 12, color: 'text.secondary' }} />
                              <LocationDisplay lat={lat} lng={lng} />
                            </Box>
                          );
                        } else {
                          return (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                              <LocationIcon sx={{ fontSize: 12, color: 'text.secondary' }} />
                              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                                {loc.length > 30 ? loc.substring(0, 30) + '...' : loc}
                              </Typography>
                            </Box>
                          );
                        }
                      })()}
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

      {/* Professional Toast Notification */}
      <AttendanceToast
        show={showToast}
        type={toastType}
        time={toastTime}
        onClose={() => setShowToast(false)}
      />
    </Card>
  );
};

export default AttendanceWidget;

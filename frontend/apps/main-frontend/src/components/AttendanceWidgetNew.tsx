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
} from '@mui/material';
import {
  AccessTime as ClockIcon,
  LocationOn as LocationIcon,
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
import LocationPermissionDialog from './LocationPermissionDialog';

const AttendanceWidget: React.FC = () => {
  const [attendance, setAttendance] = useState<Attendance | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showPermissionDialog, setShowPermissionDialog] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [pendingAction, setPendingAction] = useState<'checkIn' | 'checkOut' | null>(null);
  const [liveLocation, setLiveLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [liveAddress, setLiveAddress] = useState<string>('Mengambil lokasi...');
  const [showToast, setShowToast] = useState<boolean>(false);
  const [toastType, setToastType] = useState<'checkIn' | 'checkOut'>('checkIn');
  const [toastTime, setToastTime] = useState<string>('');

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchTodayAttendance();
    requestLiveLocation();
  }, []);

  const requestLiveLocation = async () => {
    try {
      const position = await getCurrentPosition();
      setLiveLocation({
        lat: position.latitude,
        lng: position.longitude,
      });
      setLiveAddress(position.location || 'Lokasi Anda saat ini');
      setPermissionGranted(true);
    } catch (err: any) {
      console.error('Failed to get live location:', err);
      if (err.code === 1) {
        setShowPermissionDialog(true);
        setLiveAddress('Izin lokasi diperlukan');
      } else {
        setLiveAddress('Tidak dapat mengakses lokasi');
      }
    }
  };

  const fetchTodayAttendance = async () => {
    try {
      setLoading(true);
      const data = await getTodayAttendance();
      setAttendance(data);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching attendance:', err);
      setError(err?.message || 'Error fetching attendance');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    if (!permissionGranted) {
      setPendingAction('checkIn');
      setShowPermissionDialog(true);
      return;
    }

    try {
      setProcessing(true);
      setError(null);
      const position = await getCurrentPosition();
      await checkIn(position);
      await fetchTodayAttendance();
      const currentTime = dayjs().tz('Asia/Jakarta').format('HH:mm');
      setToastType('checkIn');
      setToastTime(currentTime);
      setShowToast(true);
    } catch (err: any) {
      if (err.code === 1 || err.message?.includes('User denied')) {
        setError('Akses lokasi ditolak. Silakan izinkan akses lokasi di browser.');
        setPermissionGranted(false);
      } else {
        setError(err?.message || 'Gagal melakukan check-in');
      }
    } finally {
      setProcessing(false);
    }
  };

  const todayJakarta = dayjs().tz('Asia/Jakarta').format('YYYY-MM-DD');
  const attendanceDate = attendance?.date ? dayjs(attendance.date).tz('Asia/Jakarta').format('YYYY-MM-DD') : null;
  const isAttendanceToday = attendanceDate === todayJakarta;
  const checkInDate = attendance?.check_in_time ? dayjs(attendance.check_in_time).tz('Asia/Jakarta').format('YYYY-MM-DD') : null;
  const checkOutDate = attendance?.check_out_time ? dayjs(attendance.check_out_time).tz('Asia/Jakarta').format('YYYY-MM-DD') : null;
  const isCheckInToday = isAttendanceToday && checkInDate === todayJakarta;
  const isCheckOutToday = isAttendanceToday && checkOutDate === todayJakarta;

  const checkInDisabled = processing || (attendance && isAttendanceToday && isCheckInToday);
  const checkOutDisabled = processing || !attendance || !isAttendanceToday || !isCheckInToday || isCheckOutToday;

  const handleCheckOut = async () => {
    if (!permissionGranted) {
      setPendingAction('checkOut');
      setShowPermissionDialog(true);
      return;
    }

    try {
      setProcessing(true);
      setError(null);
      const position = await getCurrentPosition();
      await checkOut(position);
      await fetchTodayAttendance();
      const currentTime = dayjs().tz('Asia/Jakarta').format('HH:mm');
      setToastType('checkOut');
      setToastTime(currentTime);
      setShowToast(true);
    } catch (err: any) {
      if (err.code === 1 || err.message?.includes('User denied')) {
        setError('Akses lokasi ditolak. Silakan izinkan akses lokasi di browser.');
        setPermissionGranted(false);
      } else {
        setError(err?.message || 'Gagal melakukan check-out');
      }
    } finally {
      setProcessing(false);
    }
  };

  const handleAllowLocation = async () => {
    setShowPermissionDialog(false);
    setPermissionGranted(true);
    await requestLiveLocation();
    if (pendingAction === 'checkIn') {
      await handleCheckIn();
    } else if (pendingAction === 'checkOut') {
      await handleCheckOut();
    }
    setPendingAction(null);
  };

  const handleDenyLocation = () => {
    setShowPermissionDialog(false);
    setPendingAction(null);
    setError('Akses lokasi diperlukan untuk melakukan absensi.');
    setLiveAddress('Izin lokasi ditolak');
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
    <Card sx={{ borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
      <Box sx={{ background: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)', color: 'white', p: 3, textAlign: 'center' }}>
        <Typography variant="h5" fontWeight="bold" sx={{ mb: 1 }}>Live Attendance</Typography>
        <Typography variant="body2" sx={{ opacity: 0.95, mb: 3, fontSize: '0.9rem' }}>
          {currentTime.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </Typography>
        <Typography variant="h2" fontWeight="bold" sx={{ fontFamily: 'monospace', letterSpacing: 3, fontSize: { xs: '2.5rem', sm: '3rem' } }}>
          {currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
        </Typography>
      </Box>

      <CardContent sx={{ p: 3 }}>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {liveLocation && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
              <LocationIcon sx={{ fontSize: 14 }} />
              {liveAddress}
            </Typography>
            <GMapView lat={liveLocation.lat} lng={liveLocation.lng} height={180} zoom={16} />
          </Box>
        )}

        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <Button variant="contained" fullWidth disabled={!!checkInDisabled} onClick={handleCheckIn}
            sx={{ py: 2, fontSize: '1rem', fontWeight: 'bold', bgcolor: '#27ae60', borderRadius: 2, textTransform: 'none', boxShadow: 'none',
              '&:hover': { bgcolor: '#219150', boxShadow: 'none' }, '&:disabled': { bgcolor: '#95a5a6', color: 'white' } }}
            startIcon={processing ? <CircularProgress size={18} color="inherit" /> : null}
          >Check In</Button>
          <Button variant="contained" fullWidth disabled={!!checkOutDisabled} onClick={handleCheckOut}
            sx={{ py: 2, fontSize: '1rem', fontWeight: 'bold', bgcolor: '#e74c3c', borderRadius: 2, textTransform: 'none', boxShadow: 'none',
              '&:hover': { bgcolor: '#c0392b', boxShadow: 'none' }, '&:disabled': { bgcolor: '#95a5a6', color: 'white' } }}
            startIcon={processing ? <CircularProgress size={18} color="inherit" /> : null}
          >Check Out</Button>
        </Box>

        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
            <Typography variant="subtitle2" fontWeight="bold">Attendance log</Typography>
            {attendance?.status && <Chip label={attendance.status} size="small" sx={{ bgcolor: '#d1f2eb', color: '#27ae60', fontWeight: 600, fontSize: '0.7rem' }} />}
          </Box>

          {attendance && (attendance.check_in_time || attendance.check_out_time) ? (
            <Box sx={{ bgcolor: '#f8f9fa', borderRadius: 2, p: 2, border: '1px solid #e9ecef' }}>
              <Stack spacing={2}>
                {attendance.check_in_time && (
                  <Box>
                    <Stack direction="row" spacing={0.5} alignItems="center" mb={0.5}>
                      <ClockIcon sx={{ fontSize: 16, color: '#3498db' }} />
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem', fontWeight: 600 }}>Check In</Typography>
                    </Stack>
                    <Typography variant="h6" fontWeight="bold" sx={{ mb: 0.5 }}>{formatTime(attendance.check_in_time)}</Typography>
                    {(() => {
                      const lat = (attendance as any).check_in_latitude;
                      const lng = (attendance as any).check_in_longitude;
                      if (lat && lng) return <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}><LocationIcon sx={{ fontSize: 12, color: 'text.secondary' }} /><LocationDisplay lat={lat} lng={lng} /></Box>;
                      return null;
                    })()}
                  </Box>
                )}

                {attendance.check_out_time && (
                  <Box>
                    <Stack direction="row" spacing={0.5} alignItems="center" mb={0.5}>
                      <ClockIcon sx={{ fontSize: 16, color: '#e74c3c' }} />
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem', fontWeight: 600 }}>Check Out</Typography>
                    </Stack>
                    <Typography variant="h6" fontWeight="bold" sx={{ mb: 0.5 }}>{formatTime(attendance.check_out_time)}</Typography>
                    {(() => {
                      const lat = (attendance as any).check_out_latitude;
                      const lng = (attendance as any).check_out_longitude;
                      if (lat && lng) return <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}><LocationIcon sx={{ fontSize: 12, color: 'text.secondary' }} /><LocationDisplay lat={lat} lng={lng} /></Box>;
                      return null;
                    })()}
                    {attendance.work_duration_minutes && <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>Duration: {formatDuration(attendance.work_duration_minutes)}</Typography>}
                  </Box>
                )}
              </Stack>
            </Box>
          ) : (
            <Box sx={{ bgcolor: '#f8f9fa', borderRadius: 2, p: 3, textAlign: 'center', border: '1px dashed #dee2e6' }}>
              <Typography variant="body2" color="text.secondary" fontWeight="500" sx={{ mb: 0.5 }}>No activity log today</Typography>
              <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.75rem' }}>Your check in/check out activity will appear here</Typography>
            </Box>
          )}
        </Box>
      </CardContent>

      <LocationPermissionDialog open={showPermissionDialog} onAllow={handleAllowLocation} onDeny={handleDenyLocation} />
      <AttendanceToast show={showToast} type={toastType} time={toastTime} onClose={() => setShowToast(false)} />
    </Card>
  );
};

export default AttendanceWidget;

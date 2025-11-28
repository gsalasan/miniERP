
import React, { useEffect, useState } from 'react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import AttendanceHistory from '../components/AttendanceHistory';

interface AttendanceRecord {
  id?: string | number;
  type: string;
  time: string;
  note?: string;
}

export default function AttendancePage() {
  const [history, setHistory] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [geoAllowed, setGeoAllowed] = useState(true);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [position, setPosition] = useState<{lat: number, lng: number} | null>(null);
  const [checkinLoading, setCheckinLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  // Fetch attendance history
  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch('/api/v1/attendances/my', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setHistory(
            (data.data || []).map((item: any) => ({
              id: item.id,
              type: item.check_out_time ? 'Check Out' : 'Check In',
              time: item.jam, // gunakan field jam dari backend
              note: item.check_in_location || undefined,
            }))
          );
        } else {
          setError(data.error || 'Gagal mengambil riwayat absen');
        }
      })
      .catch(err => setError(err.message || 'Gagal mengambil riwayat absen'))
      .finally(() => setLoading(false));
  }, []);


  // Fungsi reverse geocoding (OpenStreetMap Nominatim)
  const getAddressFromCoords = async (lat: number, lng: number): Promise<string | null> => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
      const data = await res.json();
      return data.display_name || null;
    } catch {
      return null;
    }
  };

  // Geolocation permission check
  const requestLocation = (cb: (pos: GeolocationPosition, address: string | null) => void) => {
    setGeoError(null);
    if (!navigator.geolocation) {
      setGeoAllowed(false);
      setGeoError('Geolocation tidak didukung browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setGeoAllowed(true);
        setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        const address = await getAddressFromCoords(pos.coords.latitude, pos.coords.longitude);
        cb(pos, address);
      },
      (err) => {
        setGeoAllowed(false);
        setGeoError('Izin lokasi diperlukan untuk absensi.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };


  // Check-in
  const handleCheckIn = () => {
    setCheckinLoading(true);
    requestLocation((pos, address) => {
      fetch('/api/v1/attendances/checkin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          location: address,
        }),
      })
        .then(res => res.json())
        .then(data => {
          if (!data.success) throw new Error(data.error || 'Check-in gagal');
          window.location.reload();
        })
        .catch(err => setError(err.message || 'Check-in gagal'))
        .finally(() => setCheckinLoading(false));
    });
  };


  // Check-out
  const handleCheckOut = () => {
    setCheckoutLoading(true);
    requestLocation((pos, address) => {
      fetch('/api/v1/attendances/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          location: address,
        }),
      })
        .then(res => res.json())
        .then(data => {
          if (!data.success) throw new Error(data.error || 'Check-out gagal');
          window.location.reload();
        })
        .catch(err => setError(err.message || 'Check-out gagal'))
        .finally(() => setCheckoutLoading(false));
    });
  };

  return (
    <div className="max-w-xl mx-auto mt-8">
      <Card>
        <h2 className="text-xl font-bold mb-4">Absensi Kehadiran</h2>
        <div className="flex gap-4 mb-4">
          <Button onClick={handleCheckIn} disabled={checkinLoading || !geoAllowed}>
            {checkinLoading ? 'Memproses...' : 'Check In'}
          </Button>
          <Button onClick={handleCheckOut} disabled={checkoutLoading || !geoAllowed}>
            {checkoutLoading ? 'Memproses...' : 'Check Out'}
          </Button>
        </div>
        {!geoAllowed && (
          <div className="text-red-500 text-sm mb-2">{geoError || 'Izin lokasi diperlukan untuk absensi.'}</div>
        )}
        {error && <div className="text-red-500 text-sm mb-2">{error}</div>}
        {loading ? (
          <div>Memuat riwayat absen...</div>
        ) : (
          <AttendanceHistory records={history} maxItems={10} />
        )}
      </Card>
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { CircularProgress, Typography } from '@mui/material';

interface LocationDisplayProps {
  lat: number | string;
  lng: number | string;
}

const LocationDisplay: React.FC<LocationDisplayProps> = ({ lat, lng }) => {
  const [address, setAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!lat || !lng) return;
    
    console.log('[LocationDisplay] Fetching address for:', { lat, lng });
    
    // Set timeout untuk loading - jika lebih dari 3 detik, langsung tampilkan koordinat
    const timeoutId = setTimeout(() => {
      if (loading) {
        console.log('[LocationDisplay] Timeout - showing coordinates');
        setLoading(false);
      }
    }, 3000);

    setLoading(true);
    
    // Use backend endpoint to bypass CORS
    const token = localStorage.getItem('token');
    const url = `http://localhost:4004/api/v1/attendances/reverse-geocode?lat=${lat}&lng=${lng}`;
    console.log('[LocationDisplay] Calling:', url);
    
    fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      .then((res) => {
        console.log('[LocationDisplay] Response status:', res.status);
        if (!res.ok) throw new Error(`API error: ${res.status}`);
        return res.json();
      })
      .then((result) => {
        clearTimeout(timeoutId);
        console.log('[LocationDisplay] Result:', result);
        if (result.success && result.data?.address) {
          console.log('[LocationDisplay] Setting address:', result.data.address);
          setAddress(result.data.address);
        } else {
          console.log('[LocationDisplay] No address in result');
        }
        setLoading(false);
      })
      .catch((err) => {
        clearTimeout(timeoutId);
        console.error('[LocationDisplay] Error:', err);
        // Jangan set error, biarkan fallback ke koordinat
        setAddress(null);
        setLoading(false);
      });

    return () => clearTimeout(timeoutId);
  }, [lat, lng]);

  if (loading) {
    return <CircularProgress size={10} sx={{ ml: 0.5 }} />;
  }
  
  if (address) {
    return (
      <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
        {address}
      </Typography>
    );
  }
  
  // Fallback: tampilkan koordinat dengan format lebih readable
  return (
    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
      {typeof lat === 'number' ? lat.toFixed(5) : lat}, {typeof lng === 'number' ? lng.toFixed(5) : lng}
    </Typography>
  );
};

export default LocationDisplay;

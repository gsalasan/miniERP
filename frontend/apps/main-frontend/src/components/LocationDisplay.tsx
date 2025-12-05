import React, { useEffect, useState } from 'react';
import { CircularProgress, Typography } from '@mui/material';
import { reverseGeocodeLocation } from '../api/attendance';

interface LocationDisplayProps {
  lat: number | string;
  lng: number | string;
}

const LocationDisplay: React.FC<LocationDisplayProps> = ({ lat, lng }) => {
  const [address, setAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (lat === null || lat === undefined || lng === null || lng === undefined) {
      setAddress(null);
      return;
    }

    const numericLat = typeof lat === 'string' ? Number(lat) : lat;
    const numericLng = typeof lng === 'string' ? Number(lng) : lng;

    if (Number.isNaN(numericLat) || Number.isNaN(numericLng)) {
      setAddress(null);
      return;
    }
    
    console.log('[LocationDisplay] Fetching address for:', { lat: numericLat, lng: numericLng });
    const timeoutId = setTimeout(() => {
      if (loading) {
        console.log('[LocationDisplay] Timeout - showing coordinates');
        setLoading(false);
      }
    }, 3000);

    setLoading(true);
    reverseGeocodeLocation(numericLat, numericLng)
      .then((result) => {
        clearTimeout(timeoutId);
        if (result) {
          console.log('[LocationDisplay] Setting address:', result);
          setAddress(result);
        } else {
          setAddress(null);
        }
        setLoading(false);
      })
      .catch((err) => {
        clearTimeout(timeoutId);
        console.error('[LocationDisplay] Error:', err);
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

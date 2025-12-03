import React, { useCallback, useRef } from 'react';
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';

interface InteractiveMapProps {
  lat: number;
  lng: number;
  onChange: (lat: number, lng: number) => void;
  height?: number | string;
  zoom?: number;
}

const containerStyle = {
  width: '100%',
  maxWidth: 600,
  height: 220,
  borderRadius: 8,
  overflow: 'hidden',
  margin: '8px 0',
  boxShadow: '0 1px 6px #0001',
};

const InteractiveMap: React.FC<InteractiveMapProps> = ({ lat, lng, onChange, height = 220, zoom = 17 }) => {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: 'YOUR_GOOGLE_MAPS_API_KEY', // TODO: replace with env/config
  });
  const mapRef = useRef<any>(null);

  const onMapClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      onChange(e.latLng.lat(), e.latLng.lng());
    }
  }, [onChange]);

  if (!isLoaded) return <div style={{ height }}>Loading map...</div>;

  return (
    <div style={{ ...containerStyle, height }}>
      <GoogleMap
        mapContainerStyle={{ width: '100%', height: '100%' }}
        center={{ lat, lng }}
        zoom={zoom}
        onClick={onMapClick}
        onLoad={map => { mapRef.current = map; }}
        options={{ streetViewControl: false, mapTypeControl: false }}
      >
        {/* @ts-ignore */}
        <Marker position={{ lat, lng }} />
      </GoogleMap>
    </div>
  );
};

export default InteractiveMap;

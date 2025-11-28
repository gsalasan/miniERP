import React from 'react';

interface MapProps {
  lat: number;
  lng: number;
  height?: number | string;
  zoom?: number;
}

const MapView: React.FC<MapProps> = ({ lat, lng, height = 220, zoom = 17 }) => {
  // Use leaflet OSM embed for better marker and zoom
  const src = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=${zoom}/${lat}/${lng}`;
  return (
    <div style={{ width: '100%', maxWidth: 600, height, borderRadius: 8, overflow: 'hidden', margin: '8px 0', boxShadow: '0 1px 6px #0001' }}>
      <iframe
        title="Map"
        width="100%"
        height={height}
        frameBorder="0"
        scrolling="no"
        src={src}
        style={{ border: 0, minHeight: 180 }}
        allowFullScreen
      ></iframe>
      <div style={{ textAlign: 'right', fontSize: 11, color: '#888', marginTop: 2 }}>
        <a href={src} target="_blank" rel="noopener noreferrer">Lihat di OpenStreetMap</a>
      </div>
    </div>
  );
};

export default MapView;

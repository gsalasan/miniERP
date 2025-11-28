import React from 'react';

interface GMapProps {
  lat: number;
  lng: number;
  height?: number | string;
  zoom?: number;
}

const GMapView: React.FC<GMapProps> = ({ lat, lng, height = 220, zoom = 17 }) => {
  const src = `https://www.google.com/maps?q=${lat},${lng}&z=${zoom}&output=embed`;
  return (
    <div style={{ width: '100%', maxWidth: 600, height, borderRadius: 8, overflow: 'hidden', margin: '8px 0', boxShadow: '0 1px 6px #0001' }}>
      <iframe
        title="Google Maps"
        width="100%"
        height={height}
        frameBorder="0"
        style={{ border: 0, minHeight: 180 }}
        src={src}
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      ></iframe>
      <div style={{ textAlign: 'right', fontSize: 11, color: '#888', marginTop: 2 }}>
        <a href={`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`} target="_blank" rel="noopener noreferrer">Lihat di Google Maps</a>
      </div>
    </div>
  );
};

export default GMapView;

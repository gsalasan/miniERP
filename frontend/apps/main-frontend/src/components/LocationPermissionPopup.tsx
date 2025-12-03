import React from 'react';

export interface LocationPermissionProps {
  onAllow: () => void;
  onDeny: () => void;
}

export function LocationPermissionPopup({ onAllow, onDeny }: LocationPermissionProps) {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
      padding: 20,
      animation: 'fadeIn 0.2s ease-out',
    }}>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>

      <div style={{
        background: 'white',
        borderRadius: 16,
        padding: 24,
        maxWidth: 400,
        width: '100%',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        animation: 'scaleIn 0.3s ease-out',
      }}>
        {/* Icon */}
        <div style={{
          width: 64,
          height: 64,
          borderRadius: 12,
          background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px',
        }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
        </div>

        {/* Content */}
        <h3 style={{
          fontSize: 20,
          fontWeight: 700,
          color: '#1F2937',
          textAlign: 'center',
          marginBottom: 12,
        }}>
          Izinkan Akses Lokasi
        </h3>

        <p style={{
          fontSize: 14,
          color: '#6B7280',
          textAlign: 'center',
          lineHeight: 1.6,
          marginBottom: 24,
        }}>
          Aplikasi memerlukan akses lokasi Anda untuk mencatat kehadiran. 
          Data lokasi hanya digunakan saat melakukan absensi.
        </p>

        {/* Security Badge */}
        <div style={{
          background: '#F3F4F6',
          borderRadius: 8,
          padding: '10px 12px',
          marginBottom: 20,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            <path d="M9 12l2 2 4-4"/>
          </svg>
          <div style={{
            fontSize: 12,
            color: '#374151',
            fontWeight: 500,
          }}>
            Privasi Anda terlindungi
          </div>
        </div>

        {/* Buttons */}
        <div style={{
          display: 'flex',
          gap: 10,
        }}>
          <button
            onClick={onDeny}
            style={{
              flex: 1,
              background: '#F3F4F6',
              color: '#374151',
              border: 'none',
              borderRadius: 8,
              padding: '12px 20px',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#E5E7EB'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#F3F4F6'}
          >
            Tidak Sekarang
          </button>
          <button
            onClick={onAllow}
            style={{
              flex: 1,
              background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              padding: '12px 20px',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(239, 68, 68, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.3)';
            }}
          >
            Izinkan Akses
          </button>
        </div>
      </div>
    </div>
  );
}

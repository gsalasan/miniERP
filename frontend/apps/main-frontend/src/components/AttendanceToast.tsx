import React, { useEffect } from 'react';

export interface ToastProps {
  show: boolean;
  type: 'checkIn' | 'checkOut';
  time: string;
  onClose: () => void;
}

export function AttendanceToast({ show, type, time, onClose }: ToastProps) {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(onClose, 5000);
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  // Only render if explicitly shown AND time is provided
  if (!show || !time) return null;

  const isCheckIn = type === 'checkIn';

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
      padding: 20,
      animation: 'fadeIn 0.3s ease-out',
    }}>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleUp {
          0% {
            opacity: 0;
            transform: scale(0.7);
          }
          50% {
            transform: scale(1.05);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
        @keyframes checkmark {
          0% {
            stroke-dashoffset: 100;
          }
          100% {
            stroke-dashoffset: 0;
          }
        }
      `}</style>
      
      <div style={{
        background: 'white',
        borderRadius: 20,
        padding: '32px 28px',
        maxWidth: 380,
        width: '100%',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        textAlign: 'center',
        animation: 'scaleUp 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}>
        {/* Animated Icon Circle */}
        <div style={{
          width: 80,
          height: 80,
          borderRadius: '50%',
          background: isCheckIn 
            ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
            : 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px',
          boxShadow: isCheckIn
            ? '0 8px 24px rgba(16, 185, 129, 0.4)'
            : '0 8px 24px rgba(239, 68, 68, 0.4)',
        }}>
          {isCheckIn ? (
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" style={{ strokeDasharray: 100, animation: 'checkmark 0.6s ease-out forwards' }}/>
            </svg>
          ) : (
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
              <polyline points="10 17 15 12 10 7"/>
              <line x1="15" y1="12" x2="3" y2="12"/>
            </svg>
          )}
        </div>

        {/* Title */}
        <h3 style={{
          fontSize: 22,
          fontWeight: 700,
          color: '#1F2937',
          marginBottom: 8,
          letterSpacing: '-0.02em',
        }}>
          {isCheckIn ? 'Absen Masuk Berhasil!' : 'Absen Keluar Berhasil!'}
        </h3>

        {/* Time Display */}
        <div style={{
          fontSize: 32,
          fontWeight: 800,
          color: isCheckIn ? '#10B981' : '#EF4444',
          marginBottom: 12,
          letterSpacing: '-0.03em',
        }}>
          {time}
        </div>

        {/* Subtitle */}
        <p style={{
          fontSize: 14,
          color: '#6B7280',
          marginBottom: 24,
          lineHeight: 1.5,
        }}>
          {isCheckIn 
            ? 'Kehadiran Anda telah tercatat. Selamat bekerja!' 
            : 'Terima kasih atas kerja keras Anda hari ini!'}
        </p>

        {/* Success Badge */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          background: isCheckIn ? '#D1FAE5' : '#FEE2E2',
          padding: '8px 16px',
          borderRadius: 20,
          marginBottom: 20,
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={isCheckIn ? '#10B981' : '#EF4444'} strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          <span style={{
            fontSize: 13,
            fontWeight: 600,
            color: isCheckIn ? '#065F46' : '#991B1B',
          }}>
            Tersimpan dengan aman
          </span>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            width: '100%',
            background: isCheckIn 
              ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
              : 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
            color: 'white',
            border: 'none',
            borderRadius: 10,
            padding: '12px 24px',
            fontSize: 15,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'transform 0.2s, box-shadow 0.2s',
            boxShadow: isCheckIn
              ? '0 4px 14px rgba(16, 185, 129, 0.3)'
              : '0 4px 14px rgba(239, 68, 68, 0.3)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = isCheckIn
              ? '0 6px 20px rgba(16, 185, 129, 0.4)'
              : '0 6px 20px rgba(239, 68, 68, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = isCheckIn
              ? '0 4px 14px rgba(16, 185, 129, 0.3)'
              : '0 4px 14px rgba(239, 68, 68, 0.3)';
          }}
        >
          Tutup
        </button>
      </div>
    </div>
  );
}

export function showAttendanceToast(type: 'checkIn' | 'checkOut', time: string) {
  const container = document.createElement('div');
  document.body.appendChild(container);

  const root = (window as any).ReactDOM?.createRoot ? 
    (window as any).ReactDOM.createRoot(container) :
    null;

  const cleanup = () => {
    if (root) {
      root.unmount();
    }
    document.body.removeChild(container);
  };

  if (root) {
    root.render(<AttendanceToast show={true} type={type} time={time} onClose={cleanup} />);
  }
}

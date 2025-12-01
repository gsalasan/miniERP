import React, { useEffect } from 'react';

export interface SuccessNotificationProps {
  show: boolean;
  title: string;
  message: string;
  type?: 'success' | 'info' | 'warning' | 'error';
  onClose: () => void;
}

export function SuccessNotification({ 
  show, 
  title, 
  message, 
  type = 'success',
  onClose 
}: SuccessNotificationProps) {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(onClose, 4000);
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  if (!show) return null;

  const colors = {
    success: {
      gradient: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
      bg: '#D1FAE5',
      text: '#065F46',
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
          <polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
      ),
    },
    info: {
      gradient: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
      bg: '#DBEAFE',
      text: '#1E40AF',
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="16" x2="12" y2="12"/>
          <line x1="12" y1="8" x2="12.01" y2="8"/>
        </svg>
      ),
    },
    warning: {
      gradient: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
      bg: '#FEF3C7',
      text: '#92400E',
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
          <line x1="12" y1="9" x2="12" y2="13"/>
          <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
      ),
    },
    error: {
      gradient: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
      bg: '#FEE2E2',
      text: '#991B1B',
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <line x1="15" y1="9" x2="9" y2="15"/>
          <line x1="9" y1="9" x2="15" y2="15"/>
        </svg>
      ),
    },
  };

  const theme = colors[type];

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      zIndex: 10000,
      animation: 'slideInRight 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    }}>
      <style>{`
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(100px) scale(0.8);
          }
          to {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }
        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
        }
      `}</style>
      
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '20px 24px',
        minWidth: '320px',
        maxWidth: '400px',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15), 0 8px 16px rgba(0, 0, 0, 0.1)',
        display: 'flex',
        gap: '16px',
        alignItems: 'flex-start',
        border: '1px solid rgba(0,0,0,0.05)',
      }}>
        {/* Icon Circle */}
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          background: theme.gradient,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          animation: 'pulse 2s ease-in-out infinite',
          boxShadow: `0 4px 14px ${theme.bg}`,
        }}>
          {theme.icon}
        </div>

        {/* Content */}
        <div style={{ flex: 1, paddingTop: '2px' }}>
          <h3 style={{
            margin: '0 0 6px 0',
            fontSize: '16px',
            fontWeight: 700,
            color: '#1F2937',
            letterSpacing: '-0.01em',
          }}>
            {title}
          </h3>
          <p style={{
            margin: 0,
            fontSize: '14px',
            color: '#6B7280',
            lineHeight: '1.5',
          }}>
            {message}
          </p>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#9CA3AF',
            transition: 'all 0.2s',
            borderRadius: '6px',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#F3F4F6';
            e.currentTarget.style.color = '#1F2937';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = '#9CA3AF';
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      {/* Progress Bar */}
      <div style={{
        height: '4px',
        background: '#E5E7EB',
        borderRadius: '0 0 16px 16px',
        overflow: 'hidden',
        marginTop: '-1px',
      }}>
        <div style={{
          height: '100%',
          background: theme.gradient,
          animation: 'progress 4s linear forwards',
        }}/>
      </div>

      <style>{`
        @keyframes progress {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
}

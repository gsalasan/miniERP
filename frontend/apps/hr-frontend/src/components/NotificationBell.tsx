import React from 'react';

interface NotificationBellProps {
  count?: number;
  onClick?: () => void;
}

const NotificationBell: React.FC<NotificationBellProps> = ({ count = 0, onClick }) => {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
      <button
        onClick={onClick}
        aria-label="Notifications"
        style={{
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          position: 'relative',
          fontSize: 20,
        }}
      >
        🔔
        {count > 0 && (
          <span
            style={{
              position: 'absolute',
              top: -6,
              right: -6,
              background: '#e55353',
              color: 'white',
              borderRadius: 10,
              padding: '2px 6px',
              fontSize: 12,
            }}
          >
            {count}
          </span>
        )}
      </button>
    </div>
  );
};

export default NotificationBell;

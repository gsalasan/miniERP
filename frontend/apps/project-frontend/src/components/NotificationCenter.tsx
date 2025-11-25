import { useEffect, useState } from 'react';
import { Snackbar, Alert } from '@mui/material';

type NotifyOptions = {
  severity?: 'success' | 'info' | 'warning' | 'error';
  duration?: number;
};

export function notify(message: string, opts?: NotifyOptions) {
  const event = new CustomEvent('app-notify', { detail: { message, opts } });
  window.dispatchEvent(event);
}

export default function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [severity, setSeverity] = useState<NotifyOptions['severity']>('info');
  const [duration, setDuration] = useState(4000);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail || {};
      setMessage(detail.message || '');
      setSeverity(detail.opts?.severity || 'info');
      setDuration(detail.opts?.duration || 4000);
      setOpen(true);
    };

    window.addEventListener('app-notify', handler as EventListener);
    return () => window.removeEventListener('app-notify', handler as EventListener);
  }, []);

  return (
    <Snackbar open={open} autoHideDuration={duration} onClose={() => setOpen(false)} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
      <Alert onClose={() => setOpen(false)} severity={severity} sx={{ width: '100%' }}>
        {message}
      </Alert>
    </Snackbar>
  );
}

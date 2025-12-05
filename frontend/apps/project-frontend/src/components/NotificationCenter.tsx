import { useEffect, useState } from 'react';
import { Snackbar, Alert, Slide, AlertTitle } from '@mui/material';
import type { SlideProps } from '@mui/material/Slide';

type NotifyOptions = {
  severity?: 'success' | 'info' | 'warning' | 'error';
  duration?: number;
  title?: string;
};

function SlideTransition(props: SlideProps) {
  return <Slide {...props} direction="left" />;
}

export function notify(message: string, opts?: NotifyOptions) {
  const event = new CustomEvent('app-notify', { detail: { message, opts } });
  window.dispatchEvent(event);
}

export default function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [title, setTitle] = useState<string | undefined>(undefined);
  const [severity, setSeverity] = useState<NotifyOptions['severity']>('info');
  const [duration, setDuration] = useState(4000);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail || {};
      setMessage(detail.message || '');
      setTitle(detail.opts?.title);
      setSeverity(detail.opts?.severity || 'info');
      setDuration(detail.opts?.duration || 4000);
      setOpen(true);
    };

    window.addEventListener('app-notify', handler as EventListener);
    return () => window.removeEventListener('app-notify', handler as EventListener);
  }, []);

  return (
    <Snackbar 
      open={open} 
      autoHideDuration={duration} 
      onClose={() => setOpen(false)} 
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      TransitionComponent={SlideTransition}
      sx={{ mt: 8 }}
    >
      <Alert 
        onClose={() => setOpen(false)} 
        severity={severity} 
        variant="filled"
        elevation={6}
        sx={{ 
          width: '100%',
          minWidth: '320px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          '& .MuiAlert-icon': {
            fontSize: '24px',
          },
          '& .MuiAlert-message': {
            fontSize: '14px',
            fontWeight: 500,
          },
        }}
      >
        {title && <AlertTitle sx={{ fontWeight: 600, mb: 0.5 }}>{title}</AlertTitle>}
        {message}
      </Alert>
    </Snackbar>
  );
}

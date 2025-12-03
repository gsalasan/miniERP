import { useEffect } from 'react';

/**
 * Hook to sync token from URL query parameter to localStorage
 * This is used for cross-app authentication via main-frontend
 */
export function useTokenSync() {
  useEffect(() => {
    console.log('🔍 useTokenSync running...');
    console.log('📍 Current URL:', window.location.href);
    
    // Check if token is in URL
    const params = new URLSearchParams(window.location.search);
    const tokenFromUrl = params.get('token');
    
    console.log('🔎 Token from URL:', tokenFromUrl ? '✅ ' + tokenFromUrl.substring(0, 20) + '...' : '❌ null');
    
    if (tokenFromUrl) {
      localStorage.setItem('token', tokenFromUrl);
      console.log('✅ Token synced from URL parameter to localStorage');
      // Remove token from URL for security
      window.history.replaceState({}, document.title, window.location.pathname);
      console.log('🧹 Token removed from URL for security');
    } else {
      const token = localStorage.getItem('token');
      if (token) {
        console.log('✅ Using existing token from localStorage:', token.substring(0, 20) + '...');
      } else {
        console.log('⚠️ No token found in URL or localStorage');
      }
    }
  }, []);
}

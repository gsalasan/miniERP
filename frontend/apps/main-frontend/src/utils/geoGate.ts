// Small geolocation gate: prevent any automatic calls to navigator.geolocation
// until the application sets `window.__allowGeolocation = true`.
// This avoids unexpected native permission prompts when third-party
// code or components call getCurrentPosition on mount.

declare global {
  interface Window {
    __allowGeolocation?: boolean;
  }
}

export function installGeoGate() {
  try {
    if (!('geolocation' in navigator)) return;

    const geo: any = (navigator as any).geolocation;
    if (!geo) return;

    const originalGet = geo.getCurrentPosition.bind(geo);
    const originalWatch = geo.watchPosition.bind(geo);

    const blockedHandler = (errorCallback?: PositionErrorCallback) => {
      if (typeof errorCallback === 'function') {
        // Mimic a PERMISSION_DENIED error
        const err: any = new Error('Geolocation blocked by app until user consents');
        err.code = 1; // PERMISSION_DENIED
        try { errorCallback(err); } catch (e) { /* ignore */ }
      }
    };

    (geo as any).getCurrentPosition = function(success: PositionCallback, error?: PositionErrorCallback, options?: PositionOptions) {
      if (window.__allowGeolocation) {
        return originalGet(success, error, options);
      }
      // Block automatic call and notify caller via error callback
      blockedHandler(error);
    };

    (geo as any).watchPosition = function(success: PositionCallback, error?: PositionErrorCallback, options?: PositionOptions) {
      if (window.__allowGeolocation) {
        return originalWatch(success, error, options);
      }
      blockedHandler(error);
      return -1; // invalid id
    };

    // Initialize as blocked
    window.__allowGeolocation = false;
    console.debug('[geoGate] installed - geolocation calls blocked until consent');
  } catch (e) {
    console.warn('[geoGate] failed to install', e);
  }
}

export function allowGeolocation() {
  window.__allowGeolocation = true;
}

export default installGeoGate;

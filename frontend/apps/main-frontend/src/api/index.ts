import API_CONFIG from '../config';

export async function login(email: string, password: string) {
  try {
    const res = await fetch(`${API_CONFIG.IDENTITY_SERVICE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      return {
        success: false,
        message: `Server error: ${text.substring(0, 100)}`,
        token: null,
      };
    }

    if (!res.ok) {
      return {
        success: false,
        message: data.message || `HTTP Error ${res.status}: ${res.statusText}`,
        token: null,
      };
    }

    return data;
  } catch (err: any) {
    console.error('Login error:', err);
    return {
      success: false,
      message: err?.message || API_CONFIG.OFFLINE_FALLBACK_MESSAGE,
      token: null,
    };
  }
}

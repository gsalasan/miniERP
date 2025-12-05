const sanitizeUrl = (url?: string) => {
	if (!url) return undefined;
	return url.endsWith('/') ? url.slice(0, -1) : url;
};

const HR_SERVICE_URL = sanitizeUrl(import.meta.env.VITE_HR_SERVICE_URL) || 'http://localhost:4004';
const IDENTITY_SERVICE_URL = sanitizeUrl(import.meta.env.VITE_IDENTITY_SERVICE_URL) || 'http://localhost:4000';

const API_CONFIG = {
	HR_SERVICE_URL,
	HR_API_BASE_URL: `${HR_SERVICE_URL}/api/v1`,
	IDENTITY_SERVICE_URL,
	REQUEST_TIMEOUT_MS: Number(import.meta.env.VITE_API_TIMEOUT_MS) || 15000,
	OFFLINE_FALLBACK_MESSAGE: 'Tidak bisa terhubung ke server. Pastikan backend berjalan dan jaringan stabil.',
};

export default API_CONFIG;

const sanitizeUrl = (value?: string) => {
	if (!value) return undefined;
	return value.endsWith('/') ? value.slice(0, -1) : value;
};

const HR_SERVICE_URL = sanitizeUrl(import.meta.env.VITE_HR_SERVICE_URL) || 'http://localhost:4004';
const MAIN_DASHBOARD_URL = sanitizeUrl(import.meta.env.VITE_MAIN_DASHBOARD_URL) || 'http://localhost:3000';

const API_CONFIG = {
	HR_SERVICE_URL,
	HR_API_BASE_URL: `${HR_SERVICE_URL}/api/v1`,
	MAIN_DASHBOARD_URL,
	REQUEST_TIMEOUT_MS: Number(import.meta.env.VITE_API_TIMEOUT_MS) || 15000,
	OFFLINE_FALLBACK_MESSAGE: 'Tidak bisa terhubung ke server HR. Pastikan layanan berjalan dan jaringan stabil.',
};

export default API_CONFIG;

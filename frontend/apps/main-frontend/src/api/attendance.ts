import axios from 'axios';

const HR_SERVICE_URL = 'http://localhost:4004/api/v1';

// Get token from localStorage
const getAuthToken = () => {
  return localStorage.getItem('token');
};

// Create axios instance with auth header
const hrApi = axios.create({
  baseURL: HR_SERVICE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
hrApi.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface GeoLocation {
  latitude: number;
  longitude: number;
  location?: string;
}

export interface Attendance {
  id: string;
  employee_id: string;
  date: string;
  check_in_time: string | null;
  check_in_latitude: string | null;
  check_in_longitude: string | null;
  check_in_location: string | null;
  check_out_time: string | null;
  check_out_latitude: string | null;
  check_out_longitude: string | null;
  check_out_location: string | null;
  work_duration_minutes: number | null;
  status: string;
  employee?: {
    id: string;
    full_name: string;
    position: string;
  };
}

export interface AttendanceResponse {
  success: boolean;
  data: Attendance | null;
  message?: string;
  error?: string;
}

export interface AttendanceListResponse {
  success: boolean;
  data: Attendance[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AttendanceStats {
  month: string;
  totalDays: number;
  presentDays: number;
  lateDays: number;
  absentDays: number;
  totalWorkMinutes: number;
  averageWorkMinutes: number;
  averageWorkHours: string;
}

// Get today's attendance
export const getTodayAttendance = async (): Promise<Attendance | null> => {
  try {
    const response = await hrApi.get<AttendanceResponse>('/attendances/today');
    return response.data.data;
  } catch (error: any) {
    console.error('Error getting today attendance:', error);
    throw new Error(error.response?.data?.error || 'Failed to get today attendance');
  }
};

// Check-in
export const checkIn = async (geoLocation: GeoLocation): Promise<Attendance> => {
  try {
    const response = await hrApi.post<AttendanceResponse>('/attendances/checkin', geoLocation);
    if (!response.data.data) {
      throw new Error('No data returned from check-in');
    }
    return response.data.data;
  } catch (error: any) {
    console.error('Error checking in:', error);
    throw new Error(error.response?.data?.error || 'Failed to check in');
  }
};

// Check-out
export const checkOut = async (geoLocation: GeoLocation): Promise<Attendance> => {
  try {
    const response = await hrApi.post<AttendanceResponse>('/attendances/checkout', geoLocation);
    if (!response.data.data) {
      throw new Error('No data returned from check-out');
    }
    return response.data.data;
  } catch (error: any) {
    console.error('Error checking out:', error);
    throw new Error(error.response?.data?.error || 'Failed to check out');
  }
};

// Get my attendance history
export const getMyAttendances = async (month?: string, page = 1, limit = 20): Promise<AttendanceListResponse> => {
  try {
    const params: any = { page, limit };
    if (month) {
      params.month = month;
    }
    const response = await hrApi.get<AttendanceListResponse>('/attendances/my', { params });
    return response.data;
  } catch (error: any) {
    console.error('Error getting my attendances:', error);
    throw new Error(error.response?.data?.error || 'Failed to get attendance history');
  }
};

// Get attendance stats
export const getAttendanceStats = async (month: string): Promise<AttendanceStats> => {
  try {
    const response = await hrApi.get<{ success: boolean; data: AttendanceStats }>('/attendances/stats', {
      params: { month },
    });
    return response.data.data;
  } catch (error: any) {
    console.error('Error getting attendance stats:', error);
    throw new Error(error.response?.data?.error || 'Failed to get attendance statistics');
  }
};

// Get current position using browser geolocation API with reverse geocoding
export const getCurrentPosition = async (): Promise<GeoLocation> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        
        try {
          // Lakukan reverse geocoding untuk mendapatkan alamat lengkap
          const token = getAuthToken();
          const response = await axios.get(
            `${HR_SERVICE_URL}/attendances/reverse-geocode?lat=${latitude}&lng=${longitude}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
          
          // Ambil alamat dari response backend
          const addressData = response.data?.data;
          const locationName = addressData?.address || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
          
          console.log('✅ Reverse geocoding success:', locationName);
          
          resolve({
            latitude,
            longitude,
            location: locationName, // Alamat lengkap hasil reverse geocoding
          });
        } catch (error) {
          console.warn('⚠️ Reverse geocoding failed, using coordinates:', error);
          // Fallback ke koordinat jika reverse geocoding gagal
          resolve({
            latitude,
            longitude,
            location: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
          });
        }
      },
      (error) => {
        // Provide a machine-readable error for permission denied so caller can show actionable UI
        if (error && error.code === error.PERMISSION_DENIED) {
          reject(new Error('PERMISSION_DENIED'));
          return;
        }

        let errorMessage = 'Failed to get your location';
        switch (error.code) {
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out.';
            break;
        }
        reject(new Error(errorMessage));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  });
};

// Format duration in minutes to readable format
export const formatDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours} jam ${mins} menit`;
};

// Format time to HH:MM
export const formatTime = (dateString: string | null): string => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
};

// Format date to readable format
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('id-ID', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
};
